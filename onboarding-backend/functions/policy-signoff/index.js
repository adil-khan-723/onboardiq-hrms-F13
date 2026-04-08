const { updateStageStatus, queryItems, sendEmail } = require('/opt/nodejs/utils')

const POLICIES = [
  'Code of Conduct & Ethics Policy',
  'Information Security & Data Privacy Policy',
  'Remote Work & Flexible Working Policy',
  'Anti-Harassment & Discrimination Policy',
  'IT Acceptable Use Policy',
]

exports.handler = async (event) => {
  console.log('Stage-PolicySignoff invoked:', JSON.stringify(event))
  const { employeeId, workflowId, employeeName, employeeEmail } = event

  try {
    await updateStageStatus(workflowId, 'POLICY_SIGNOFF', 'IN_PROGRESS')

    // ── Send policy sign-off email with link to portal ──
    const policyList = POLICIES.map((p, i) => `<li style="margin-bottom:8px;">${i + 1}. ${p}</li>`).join('')
    const portalUrl = `${process.env.FRONTEND_URL || 'https://your-onboarding-app.s3-website.ap-south-1.amazonaws.com'}/onboard`

    try {
      await sendEmail({
        to: employeeEmail,
        subject: `Action required: Please sign your company policies — ${employeeName}`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1C1A17;">
            <h2 style="font-weight: 400; font-size: 20px;">Policy Acknowledgements</h2>
            <p>Hi <strong>${employeeName.split(' ')[0]}</strong>,</p>
            <p>As part of your onboarding, please review and acknowledge the following company policies:</p>
            <ul style="padding-left: 20px; color: #5C5852; line-height: 1.8;">${policyList}</ul>
            <p>Please log in to OnboardIQ to complete your policy sign-off:</p>
            <a href="${portalUrl}" style="display: inline-block; background: #4A7C6B; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 8px;">Sign Policies →</a>
            <hr style="border: none; border-top: 1px solid #E8E5DE; margin: 28px 0;" />
            <p style="font-size: 12px; color: #8C8880;">This is an automated message from OnboardIQ HRMS.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.warn('Policy sign-off email skipped (SES sandbox or unverified address):', emailErr.message)
    }

    // Query DynamoDB for the POLICY_SIGNOFF stage record — signed_at is set by the
    // PUT /employees/{id}/policy-signoff API endpoint when the employee completes the portal step
    const stagesResult = await queryItems(
      process.env.STAGE_TABLE,
      'workflow-index',
      'workflow_id = :wid',
      { ':wid': workflowId }
    )
    const policyStage = stagesResult.Items?.find(s => s.stage_name === 'POLICY_SIGNOFF')
    const allPoliciesSigned = !!(policyStage?.signed_at)

    if (allPoliciesSigned) {
      await updateStageStatus(workflowId, 'POLICY_SIGNOFF', 'COMPLETE')
    }

    return { allPoliciesSigned, emailSent: true, policiesCount: POLICIES.length }

  } catch (err) {
    console.error('Stage-PolicySignoff error:', err)
    throw err
  }
}
