const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { putItem, updateItem, queryItems, ok, badRequest, serverError, uuidv4 } = require('/opt/nodejs/utils')

const s3 = new S3Client({ region: process.env.REGION })

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
const MAX_SIZE_BYTES = 10 * 1024 * 1024  // 10 MB
const DOC_TYPES = ['ID_PROOF', 'DEGREE_CERTIFICATE', 'OFFER_LETTER']

// API handler — generates presigned upload URL
exports.handler = async (event) => {
  console.log('DocumentUploadUrl invoked:', JSON.stringify(event))

  try {
    const { employeeId } = event.pathParameters || {}
    const body = JSON.parse(event.body || '{}')
    const { docType, fileName, contentType, fileSize } = body

    if (!employeeId || !docType || !fileName || !contentType) {
      return badRequest('Missing required fields: employeeId, docType, fileName, contentType')
    }

    if (!DOC_TYPES.includes(docType)) {
      return badRequest(`Invalid docType. Must be one of: ${DOC_TYPES.join(', ')}`)
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return badRequest(`Invalid file type. Allowed: PDF, JPEG, PNG`)
    }

    if (fileSize && fileSize > MAX_SIZE_BYTES) {
      return badRequest('File too large. Maximum size is 10 MB')
    }

    const documentId = uuidv4()
    const s3Key = `documents/${employeeId}/${docType}/${documentId}-${fileName}`
    const now = new Date().toISOString()

    // Create presigned PUT URL — valid for 15 minutes
    const putCommand = new PutObjectCommand({
      Bucket: process.env.DOCUMENT_BUCKET,
      Key: s3Key,
      ContentType: contentType,
      Metadata: {
        'employee-id': employeeId,
        'doc-type': docType,
        'document-id': documentId,
        'original-filename': fileName,
      },
    })
    const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 900 })

    // Store pending document record
    await putItem(process.env.DOCUMENT_TABLE, {
      document_id: documentId,
      employee_id: employeeId,
      doc_type: docType,
      s3_key: s3Key,
      file_name: fileName,
      content_type: contentType,
      status: 'PENDING_UPLOAD',
      verified: false,
      uploaded_at: null,
      verified_at: null,
      created_at: now,
      updated_at: now,
    })

    return ok({
      documentId,
      uploadUrl,
      s3Key,
      expiresIn: 900,
      message: 'Upload URL generated. PUT your file directly to this URL.',
    })

  } catch (err) {
    console.error('DocumentUploadUrl error:', err)
    return serverError(err.message)
  }
}

// Step Functions stage handler — checks if all docs collected
exports.stage = async (event) => {
  console.log('Stage-DocumentCollection invoked:', JSON.stringify(event))
  const { employeeId, workflowId } = event

  try {
    const { updateStageStatus, updateItem } = require('/opt/nodejs/utils')
    await updateStageStatus(workflowId, 'DOCUMENT_COLLECTION', 'IN_PROGRESS')

    // Check existing docs
    const docsResult = await queryItems(
      process.env.DOCUMENT_TABLE,
      'employee-index',
      'employee_id = :eid',
      { ':eid': employeeId }
    )
    const docs = docsResult.Items || []
    const uploaded = DOC_TYPES.map(t => docs.find(d => d.doc_type === t && d.status === 'UPLOADED'))
    const allReceived = uploaded.every(Boolean)

    if (allReceived) {
      await updateStageStatus(workflowId, 'DOCUMENT_COLLECTION', 'COMPLETE')
    }

    return { allDocumentsReceived: allReceived }

  } catch (err) {
    console.error('Stage-DocumentCollection error:', err)
    throw err
  }
}
