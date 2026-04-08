const { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider')
const { getItem, updateItem, updateStageStatus, sendEmail, emailTemplates } = require('/opt/nodejs/utils')

const cognito = new CognitoIdentityProviderClient({ region: process.env.REGION })

exports.handler = async (event) => {
  console.log('Stage-ITProvisioning invoked:', JSON.stringify(event))
  const { employeeId, workflowId, employeeName, employeeEmail } = event

  try {
    await updateStageStatus(workflowId, 'IT_PROVISIONING', 'IN_PROGRESS')

    let cognitoUserExists = false
    try {
      await cognito.send(new AdminGetUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: employeeEmail,
      }))
      cognitoUserExists = true
    } catch (err) {
      if (err.name !== 'UserNotFoundException') throw err
    }

    let tempPassword = null
    if (!cognitoUserExists) {
      tempPassword = generateTempPassword()
      await cognito.send(new AdminCreateUserCommand({
        UserPoolId: process.env.USER_POOL_ID,
        Username: employeeEmail,
        TemporaryPassword: tempPassword,
        UserAttributes: [
          { Name: 'email', Value: employeeEmail },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: employeeName },
          { Name: 'custom:employee_id', Value: employeeId },
        ],
        MessageAction: 'SUPPRESS',
      }))
    }

    await updateItem(
      process.env.EMPLOYEE_TABLE,
      { employee_id: employeeId },
      'SET cognito_user_id = :cid, updated_at = :now',
      { ':cid': employeeEmail, ':now': new Date().toISOString() }
    )

    if (tempPassword) {
      const template = emailTemplates.welcome({
        name: employeeName.split(' ')[0],
        email: employeeEmail,
        tempPassword,
        loginUrl: process.env.FRONTEND_URL || 'https://hrms-onboarding-frontend-dev.s3-website.ap-south-1.amazonaws.com',
      })
      try {
        await sendEmail({ to: employeeEmail, ...template })
      } catch (emailErr) {
        console.warn('Welcome email skipped (SES sandbox or unverified address):', emailErr.message)
      }
    }

    await updateStageStatus(workflowId, 'IT_PROVISIONING', 'COMPLETE')

    return { cognitoUserCreated: true, credentialsSent: !!tempPassword }
  } catch (err) {
    console.error('Stage-ITProvisioning error:', err)
    await updateStageStatus(workflowId, 'IT_PROVISIONING', 'FAILED').catch(() => {})
    throw err
  }
}

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pwd = 'Tmp1!'
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}
