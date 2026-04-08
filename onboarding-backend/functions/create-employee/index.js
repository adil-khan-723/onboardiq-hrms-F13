const { CognitoIdentityProviderClient, AdminCreateUserCommand } = require('@aws-sdk/client-cognito-identity-provider')
const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn')
const { putItem, updateItem, sendEmail, emailTemplates, createStages, uuidv4, created, badRequest, serverError } = require('/opt/nodejs/utils')

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })
const sfn = new SFNClient({ region: process.env.REGION })

exports.handler = async (event) => {
  console.log('CreateEmployee invoked:', JSON.stringify(event))
  try {
    const body = JSON.parse(event.body || '{}')
    const { firstName, lastName, email, phone, department, role, employmentType, joiningDate, managerId } = body

    if (!firstName || !lastName || !email || !department || !role) {
      return badRequest('Missing required fields: firstName, lastName, email, department, role')
    }

    const employeeId = `EMP-${uuidv4().split('-')[0].toUpperCase()}`
    const workflowId = `WF-${uuidv4().split('-')[0].toUpperCase()}`
    const now = new Date().toISOString()

    // 1. Create Employee record
    await putItem(process.env.EMPLOYEE_TABLE, {
      employee_id: employeeId,
      email: email.toLowerCase(),
      full_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      department,
      role,
      employment_type: employmentType || 'Full-time',
      joining_date: joiningDate || null,
      manager_id: managerId || null,
      status: 'ONBOARDING',
      cognito_user_id: null,
      created_at: now,
      updated_at: now,
    })

    // 2. Create Workflow record
    await putItem(process.env.WORKFLOW_TABLE, {
      workflow_id: workflowId,
      employee_id: employeeId,
      execution_arn: null,
      current_stage: 'DOCUMENT_COLLECTION',
      overall_status: 'IN_PROGRESS',
      reminder_attempt: 0,
      started_at: now,
      updated_at: now,
    })

    // 3. Create stage records
    await createStages(workflowId)

    // 4. Provision Cognito user (non-fatal)
    let cognitoUserId = null
    let tempPassword = null
    try {
      tempPassword = generateTempPassword()
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: email.toLowerCase(),
        TemporaryPassword: tempPassword,
        UserAttributes: [
          { Name: 'email', Value: email.toLowerCase() },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: `${firstName} ${lastName}` },
          { Name: 'custom:employee_id', Value: employeeId },
          { Name: 'custom:department', Value: department },
          { Name: 'custom:role', Value: role },
        ],
        MessageAction: 'SUPPRESS',
      }))
      cognitoUserId = email.toLowerCase()
      await updateItem(
        process.env.EMPLOYEE_TABLE,
        { employee_id: employeeId },
        'SET cognito_user_id = :cid, updated_at = :now',
        { ':cid': cognitoUserId, ':now': new Date().toISOString() }
      )
    } catch (cognitoErr) {
      console.error('Cognito user creation failed (non-fatal):', cognitoErr.message)
    }

    // 5. Start Step Functions (non-fatal)
    let executionArn = null
    try {
      const sfnInput = {
        employeeId, workflowId,
        employeeName: `${firstName} ${lastName}`,
        employeeEmail: email.toLowerCase(),
        department, role, joiningDate,
        reminderAttempt: 0,
        documentCollection: { allDocumentsReceived: false },
        itProvisioning: { cognitoUserCreated: !!cognitoUserId },
        policySignoff: { allPoliciesSigned: false },
      }
      const sfnResult = await sfn.send(new StartExecutionCommand({
        stateMachineArn: process.env.STATE_MACHINE_ARN,
        name: `onboarding-${employeeId}-${Date.now()}`,
        input: JSON.stringify(sfnInput),
      }))
      executionArn = sfnResult.executionArn
      await updateItem(
        process.env.WORKFLOW_TABLE,
        { workflow_id: workflowId },
        'SET execution_arn = :arn, updated_at = :now',
        { ':arn': executionArn, ':now': new Date().toISOString() }
      )
    } catch (sfnErr) {
      console.error('Step Functions start failed (non-fatal):', sfnErr.message)
    }

    // 6. Send welcome email (non-fatal)
    try {
      if (tempPassword) {
        const template = emailTemplates.welcome({
          name: firstName,
          email: email.toLowerCase(),
          tempPassword,
          loginUrl: process.env.FRONTEND_URL || 'https://hrms-onboarding-frontend-dev.s3-website.ap-south-1.amazonaws.com',
        })
        await sendEmail({ to: email, ...template })
      }
    } catch (emailErr) {
      console.error('Welcome email failed (non-fatal):', emailErr.message)
    }

    return created({
      employeeId,
      workflowId,
      executionArn,
      message: 'Employee created successfully',
    })

  } catch (err) {
    console.error('CreateEmployee error:', err)
    return serverError(err.message)
  }
}

function generateTempPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%'
  const all = upper + lower + digits + special
  let pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ]
  for (let i = 0; i < 8; i++) pwd.push(all[Math.floor(Math.random() * all.length)])
  return pwd.sort(() => Math.random() - 0.5).join('')
}
