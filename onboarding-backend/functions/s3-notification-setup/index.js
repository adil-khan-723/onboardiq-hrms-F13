const { S3Client, PutBucketNotificationConfigurationCommand } = require('@aws-sdk/client-s3')
const https = require('https')
const url = require('url')

exports.handler = async (event) => {
  const respond = (status, reason) => new Promise((resolve, reject) => {
    const body = JSON.stringify({ Status: status, Reason: reason, PhysicalResourceId: 'S3Notification', StackId: event.StackId, RequestId: event.RequestId, LogicalResourceId: event.LogicalResourceId })
    const parsed = url.parse(event.ResponseURL)
    const req = https.request({ hostname: parsed.hostname, port: 443, path: parsed.path, method: 'PUT', headers: { 'Content-Type': '', 'Content-Length': Buffer.byteLength(body) } }, () => resolve())
    req.on('error', reject)
    req.write(body)
    req.end()
  })
  if (event.RequestType === 'Delete') return respond('SUCCESS', 'Deleted')
  try {
    const s3 = new S3Client({ region: process.env.AWS_REGION })
    await s3.send(new PutBucketNotificationConfigurationCommand({
      Bucket: event.ResourceProperties.BucketName,
      NotificationConfiguration: {
        LambdaFunctionConfigurations: [{ LambdaFunctionArn: event.ResourceProperties.LambdaArn, Events: ['s3:ObjectCreated:*'], Filter: { Key: { FilterRules: [{ Name: 'prefix', Value: 'documents/' }] } } }]
      }
    }))
    return respond('SUCCESS', 'Notification configured')
  } catch (err) {
    return respond('FAILED', err.message)
  }
}
