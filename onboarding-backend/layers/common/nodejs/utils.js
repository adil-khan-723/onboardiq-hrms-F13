const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb')
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses')
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns')
const crypto = require('crypto')

const REGION = process.env.REGION || 'ap-south-1'

// ── UUID — use crypto instead of uuid package (avoids ESM issues) ──
const uuidv4 = () => crypto.randomUUID()

// ── DynamoDB ──────────────────────────────────────────────
const ddbClient = new DynamoDBClient({ region: REGION })
const ddb = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
})

const putItem = (TableName, Item) => ddb.send(new PutCommand({ TableName, Item }))
const getItem = (TableName, Key) => ddb.send(new GetCommand({ TableName, Key }))
const updateItem = (TableName, Key, UpdateExpression, ExpressionAttributeValues, ExpressionAttributeNames) =>
  ddb.send(new UpdateCommand({ TableName, Key, UpdateExpression, ExpressionAttributeValues, ExpressionAttributeNames, ReturnValues: 'ALL_NEW' }))
const queryItems = (TableName, IndexName, KeyConditionExpression, ExpressionAttributeValues) =>
  ddb.send(new QueryCommand({ TableName, IndexName, KeyConditionExpression, ExpressionAttributeValues }))

// ── SES ──────────────────────────────────────────────────
const ses = new SESClient({ region: REGION })

const sendEmail = async ({ to, subject, htmlBody, textBody }) => {
  const from = process.env.SES_FROM_EMAIL
  return ses.send(new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: Array.isArray(to) ? to : [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: htmlBody, Charset: 'UTF-8' },
        Text: { Data: textBody || subject, Charset: 'UTF-8' },
      },
    },
  }))
}

// ── SNS ──────────────────────────────────────────────────
const sns = new SNSClient({ region: REGION })

const publishSNS = (Message, Subject) =>
  sns.send(new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Message,
    Subject,
  }))

// ── CORS Headers ──────────────────────────────────────────
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
}

// ── HTTP Response helpers ─────────────────────────────────
const response = (statusCode, body) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(body),
})

const ok = (data) => response(200, { success: true, data })
const created = (data) => response(201, { success: true, data })
const badRequest = (message) => response(400, { success: false, error: message })
const notFound = (message) => response(404, { success: false, error: message })
const serverError = (message) => response(500, { success: false, error: message })

// ── Stage helpers ─────────────────────────────────────────
const STAGES = ['DOCUMENT_COLLECTION', 'IT_PROVISIONING', 'POLICY_SIGNOFF', 'MANAGER_INTRO']

const createStages = async (workflowId) => {
  const now = new Date().toISOString()
  const stageTable = process.env.STAGE_TABLE
  for (const stageName of STAGES) {
    await putItem(stageTable, {
      stage_id: uuidv4(),
      workflow_id: workflowId,
      stage_name: stageName,
      status: 'PENDING',
      created_at: now,
      updated_at: now,
      completed_at: null,
      reminder_sent_at: null,
    })
  }
}

const updateStageStatus = async (workflowId, stageName, status) => {
  const stageTable = process.env.STAGE_TABLE
  const result = await queryItems(stageTable, 'workflow-index', 'workflow_id = :wid', { ':wid': workflowId })
  const stage = result.Items?.find(s => s.stage_name === stageName)
  if (!stage) throw new Error(`Stage ${stageName} not found for workflow ${workflowId}`)
  const now = new Date().toISOString()
  return updateItem(
    stageTable,
    { stage_id: stage.stage_id },
    'SET #s = :status, updated_at = :now' + (status === 'COMPLETE' ? ', completed_at = :now' : ''),
    { ':status': status, ':now': now },
    { '#s': 'status' }
  )
}

// ── Email templates ───────────────────────────────────────
const emailTemplates = {
  welcome: ({ name, email, tempPassword, loginUrl }) => ({
    subject: `Welcome to the team, ${name}! Your OnboardIQ credentials`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1C1A17;">
        <div style="background: #4A7C6B; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 400;">Welcome aboard!</h1>
        </div>
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p>Your onboarding account has been created. Here are your temporary credentials:</p>
        <div style="background: #F7F6F3; border: 1px solid #E8E5DE; border-radius: 10px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #5C5852;">Email</p>
          <p style="margin: 0 0 16px; font-size: 15px;">${email}</p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #5C5852;">Temporary Password</p>
          <p style="margin: 0; font-size: 15px;">${tempPassword}</p>
        </div>
        <p style="color: #C97B2E; font-size: 13px;">Please change your password on first login. This link expires in 7 days.</p>
        <a href="${loginUrl}" style="display: inline-block; background: #4A7C6B; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px;">Log in to OnboardIQ</a>
      </div>
    `,
  }),

  reminder: ({ name, stage, daysLeft }) => ({
    subject: `Action required: Complete your ${stage} — ${daysLeft} day(s) remaining`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1C1A17;">
        <p>Hi <strong>${name}</strong>,</p>
        <p>Your onboarding stage <strong>${stage}</strong> is still incomplete.</p>
        <p style="color: #C25042;">You have <strong>${daysLeft} day(s)</strong> left before it's marked overdue.</p>
      </div>
    `,
  }),

  hrDocumentsReady: ({ employeeName, employeeId }) => ({
    subject: `All documents received — ${employeeName} (${employeeId})`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
        <p>All required documents for <strong>${employeeName}</strong> (${employeeId}) have been uploaded and are ready for HR verification.</p>
      </div>
    `,
  }),
}

module.exports = {
  ddb, putItem, getItem, updateItem, queryItems,
  sendEmail, publishSNS,
  ok, created, badRequest, notFound, serverError,
  createStages, updateStageStatus,
  emailTemplates,
  uuidv4,
  STAGES,
  CORS_HEADERS,
}
