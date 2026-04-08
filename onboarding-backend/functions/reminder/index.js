const { updateItem, queryItems, sendEmail, emailTemplates } = require('/opt/nodejs/utils')

const STAGE_LABELS = {
  DOCUMENT_COLLECTION: 'Document Collection',
  DOCUMENT_COLLECTION_OVERDUE: 'Document Collection (Overdue)',
  IT_PROVISIONING: 'IT Provisioning',
  POLICY_SIGNOFF: 'Policy Sign-off',
  MANAGER_INTRO: 'Manager Introduction',
}

exports.handler = async (event) => {
  console.log('Reminder invoked:', JSON.stringify(event))
  const { stage, employeeId, employeeEmail, employeeName, attempt = 0, workflowId } = event

  try {
    const stageLabel = STAGE_LABELS[stage] || stage
    const daysLeft = Math.max(0, 3 - attempt)

    const isOverdue = stage.includes('OVERDUE')

    // ── Send reminder email to employee ──
    if (!isOverdue) {
      const template = emailTemplates.reminder({
        name: employeeName?.split(' ')[0] || 'there',
        stage: stageLabel,
        daysLeft,
      })
      try {
        await sendEmail({ to: employeeEmail, ...template })
      } catch (emailErr) {
        console.warn('Reminder email failed (non-fatal):', emailErr.message)
      }
    } else {
      // Overdue — escalate to HR
      try {
        await sendEmail({
          to: process.env.HR_EMAIL,
          subject: `OVERDUE: ${employeeName} has not completed ${stageLabel}`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
              <div style="background: #FBF0EE; border: 1px solid #F5C4B3; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; color: #C25042; font-size: 15px; font-weight: 500;">⚠️ Onboarding Stage Overdue</p>
              </div>
              <p><strong>${employeeName}</strong> (${employeeId}) has not completed <strong>${stageLabel}</strong> after 3 reminders.</p>
              <p>Please follow up directly or take manual action in the HR Admin Dashboard.</p>
            </div>
          `,
        })
      } catch (emailErr) {
        console.warn('Overdue HR email failed (non-fatal):', emailErr.message)
      }
    }

    // ── Update reminder count in workflow ──
    if (workflowId) {
      await updateItem(
        process.env.WORKFLOW_TABLE,
        { workflow_id: workflowId },
        'SET reminder_attempt = :count, last_reminder_at = :now, updated_at = :now',
        { ':count': attempt + 1, ':now': new Date().toISOString() }
      )
    }

    // ── Update stage record reminder timestamp ──
    if (workflowId) {
      const stagesResult = await queryItems(
        process.env.STAGE_TABLE,
        'workflow-index',
        'workflow_id = :wid',
        { ':wid': workflowId }
      )
      const matchingStage = stagesResult.Items?.find(s => s.stage_name === stage.replace('_OVERDUE', ''))
      if (matchingStage) {
        await updateItem(
          process.env.STAGE_TABLE,
          { stage_id: matchingStage.stage_id },
          'SET reminder_sent_at = :now, reminder_count = :count, updated_at = :now',
          { ':now': new Date().toISOString(), ':count': (matchingStage.reminder_count || 0) + 1 }
        )
      }
    }

    console.log(`Reminder sent for stage ${stage}, employee ${employeeId}, attempt ${attempt + 1}`)
    return { ...event, reminderSent: true, reminderAttempt: attempt + 1 }

  } catch (err) {
    console.error('Reminder error:', err)
    throw err
  }
}
