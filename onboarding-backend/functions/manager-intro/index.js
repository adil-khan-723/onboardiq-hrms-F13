const { getItem, updateItem, updateStageStatus, sendEmail } = require('/opt/nodejs/utils')

exports.handler = async (event) => {
  console.log('Stage-ManagerIntro invoked:', JSON.stringify(event))
  const { employeeId, workflowId, employeeName, employeeEmail, department, role, joiningDate } = event

  try {
    await updateStageStatus(workflowId, 'MANAGER_INTRO', 'IN_PROGRESS')

    // ── Fetch manager info from employee record ──
    const empResult = await getItem(process.env.EMPLOYEE_TABLE, { employee_id: employeeId })
    const managerId = empResult.Item?.manager_id

    let managerName = 'Your Manager'
    let managerEmail = null

    if (managerId) {
      const managerResult = await getItem(process.env.EMPLOYEE_TABLE, { employee_id: managerId })
      if (managerResult.Item) {
        managerName = managerResult.Item.full_name
        managerEmail = managerResult.Item.email
      }
    }

    const joiningFormatted = joiningDate
      ? new Date(joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'your joining date'

    // ── Email 1: Intro email TO the new hire ──
    try {
      await sendEmail({
        to: employeeEmail,
        subject: `Meet your manager — ${managerName}`,
        htmlBody: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1C1A17;">
            <div style="background: #EBF3EF; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; color: #2E5A4D; font-size: 15px; font-weight: 500;">👋 Manager Introduction</p>
            </div>
            <p>Hi <strong>${employeeName.split(' ')[0]}</strong>,</p>
            <p>We're excited to introduce you to your reporting manager, <strong>${managerName}</strong>.</p>
            <p>${managerName} will be your primary point of contact as you settle into your role as <strong>${role}</strong> in the <strong>${department}</strong> department.</p>
            <p>Your joining date is confirmed for <strong>${joiningFormatted}</strong>. Your manager will be in touch to set up a Day 1 meeting and walk you through team processes.</p>
            <p>In the meantime, please ensure all your onboarding steps are complete on OnboardIQ.</p>
            <hr style="border: none; border-top: 1px solid #E8E5DE; margin: 28px 0;" />
            <p style="font-size: 12px; color: #8C8880;">OnboardIQ HRMS · ap-south-1</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.warn('New hire intro email skipped (SES sandbox or unverified address):', emailErr.message)
    }

    // ── Email 2: Notification TO the manager ──
    if (managerEmail) {
      try {
        await sendEmail({
          to: managerEmail,
          subject: `New hire joining your team — ${employeeName} on ${joiningFormatted}`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1C1A17;">
              <div style="background: #FDF3E5; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; color: #C97B2E; font-size: 15px; font-weight: 500;">🧑‍💻 New hire joining your team</p>
              </div>
              <p>Hi <strong>${managerName.split(' ')[0]}</strong>,</p>
              <p>A new team member, <strong>${employeeName}</strong>, is joining as <strong>${role}</strong> in <strong>${department}</strong> on <strong>${joiningFormatted}</strong>.</p>
              <p>Please reach out to welcome them and schedule a Day 1 onboarding session. Their onboarding is almost complete.</p>
              <div style="background: #F7F6F3; border: 1px solid #E8E5DE; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px;">
                <p style="margin: 0 0 6px;"><strong>Employee:</strong> ${employeeName}</p>
                <p style="margin: 0 0 6px;"><strong>Role:</strong> ${role}</p>
                <p style="margin: 0 0 6px;"><strong>Department:</strong> ${department}</p>
                <p style="margin: 0;"><strong>Joining:</strong> ${joiningFormatted}</p>
              </div>
              <p>Log in to the HR Admin Dashboard to view their complete profile.</p>
              <hr style="border: none; border-top: 1px solid #E8E5DE; margin: 28px 0;" />
              <p style="font-size: 12px; color: #8C8880;">OnboardIQ HRMS</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.warn('Manager intro email skipped (SES sandbox or unverified address):', emailErr.message)
      }
    }

    await updateStageStatus(workflowId, 'MANAGER_INTRO', 'COMPLETE')

    // ── Update overall onboarding status to COMPLETE ──
    await updateItem(
      process.env.WORKFLOW_TABLE,
      { workflow_id: workflowId },
      'SET overall_status = :status, updated_at = :now',
      { ':status': 'COMPLETE', ':now': new Date().toISOString() }
    )

    await updateItem(
      process.env.EMPLOYEE_TABLE,
      { employee_id: employeeId },
      'SET #s = :status, updated_at = :now',
      { ':status': 'ACTIVE', ':now': new Date().toISOString() },
      { '#s': 'status' }
    )

    return { completed: true, managerNotified: !!managerEmail, employeeNotified: true }

  } catch (err) {
    console.error('Stage-ManagerIntro error:', err)
    throw err
  }
}
