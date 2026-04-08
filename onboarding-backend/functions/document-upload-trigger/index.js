const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3')
const { updateItem, queryItems, updateStageStatus, publishSNS, sendEmail, emailTemplates, serverError } = require('/opt/nodejs/utils')

const s3 = new S3Client({ region: process.env.REGION })

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const MAX_SIZE_BYTES = 10 * 1024 * 1024
const DOC_TYPES = ['ID_PROOF', 'DEGREE_CERTIFICATE', 'OFFER_LETTER']

exports.handler = async (event) => {
  console.log('DocumentUploadTrigger invoked:', JSON.stringify(event))

  for (const record of event.Records) {
    try {
      const bucket = record.s3.bucket.name
      const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
      const size = record.s3.object.size

      console.log(`Processing upload: ${key}, size: ${size}`)

      // ── 1. Get object metadata from S3 ──
      const headResult = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
      const metadata = headResult.Metadata || {}
      const employeeId = metadata['employee-id']
      const docType = metadata['doc-type']
      const documentId = metadata['document-id']
      const contentType = headResult.ContentType

      if (!employeeId || !docType || !documentId) {
        console.error('Missing required metadata on S3 object:', key)
        continue
      }

      // ── 2. Validate file ──
      const validationErrors = []
      if (!ALLOWED_TYPES.includes(contentType)) {
        validationErrors.push(`Invalid file type: ${contentType}`)
      }
      if (size > MAX_SIZE_BYTES) {
        validationErrors.push(`File too large: ${size} bytes (max 10MB)`)
      }

      const isValid = validationErrors.length === 0
      const now = new Date().toISOString()

      // ── 3. Update document record in DynamoDB ──
      await updateItem(
        process.env.DOCUMENT_TABLE,
        { document_id: documentId },
        'SET #status = :status, uploaded_at = :now, updated_at = :now, validation_errors = :errors, s3_key = :key',
        {
          ':status': isValid ? 'UPLOADED' : 'INVALID',
          ':now': now,
          ':errors': validationErrors,
          ':key': key,
        },
        { '#status': 'status' }
      )

      if (!isValid) {
        console.warn(`Document ${documentId} failed validation:`, validationErrors)
        continue
      }

      // ── 4. Check if ALL documents are now uploaded ──
      const allDocsResult = await queryItems(
        process.env.DOCUMENT_TABLE,
        'employee-index',
        'employee_id = :eid',
        { ':eid': employeeId }
      )

      const uploadedDocs = allDocsResult.Items?.filter(d => d.status === 'UPLOADED') || []
      const uploadedTypes = uploadedDocs.map(d => d.doc_type)
      const allDocsReceived = DOC_TYPES.every(t => uploadedTypes.includes(t))

      console.log(`Employee ${employeeId} docs received: ${uploadedTypes.join(', ')}. All complete: ${allDocsReceived}`)

      // ── 5. If all docs received — mark stage COMPLETE + notify HR ──
      if (allDocsReceived) {
        const { getItem } = require('/opt/nodejs/utils')
        const empResult = await getItem(process.env.EMPLOYEE_TABLE, { employee_id: employeeId })
        const employeeName = empResult.Item?.full_name || employeeId

        // Mark DOCUMENT_COLLECTION stage COMPLETE immediately so HR dashboard reflects real status
        // without waiting for the Step Functions 24h re-check cycle
        try {
          const wfResult = await queryItems(
            process.env.WORKFLOW_TABLE,
            'employee-index',
            'employee_id = :eid',
            { ':eid': employeeId }
          )
          const workflowId = wfResult.Items?.[0]?.workflow_id
          if (workflowId) {
            await updateStageStatus(workflowId, 'DOCUMENT_COLLECTION', 'COMPLETE')
            console.log(`Stage DOCUMENT_COLLECTION marked COMPLETE for workflow ${workflowId}`)
          }
        } catch (stageErr) {
          console.warn('Could not update stage status (non-fatal):', stageErr.message)
        }

        // Notify HR
        try {
          await publishSNS(
            `All required documents have been uploaded by ${employeeName} (${employeeId}).\n\nDocuments received:\n${DOC_TYPES.map(t => `✓ ${t}`).join('\n')}\n\nPlease log in to the HR Admin Dashboard to review and verify.`,
            `OnboardIQ: Documents ready for review — ${employeeName}`
          )
          const template = emailTemplates.hrDocumentsReady({ employeeName, employeeId })
          await sendEmail({ to: process.env.HR_EMAIL, ...template })
          console.log(`SNS + SES notification sent to HR for employee ${employeeId}`)
        } catch (notifyErr) {
          console.warn('HR notification failed (non-fatal):', notifyErr.message)
        }
      }

    } catch (err) {
      console.error('Error processing S3 record:', err)
      // Don't throw — process remaining records
    }
  }
}
