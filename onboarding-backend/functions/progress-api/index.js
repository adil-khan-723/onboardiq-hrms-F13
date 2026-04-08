const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb')
const { getItem, queryItems, updateItem, ok, notFound, serverError } = require('/opt/nodejs/utils')

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: process.env.REGION || 'ap-south-1' }))

const STAGE_ORDER = ['DOCUMENT_COLLECTION', 'IT_PROVISIONING', 'POLICY_SIGNOFF', 'MANAGER_INTRO']
const stageOrder = (name) => STAGE_ORDER.indexOf(name)

exports.handler = async (event) => {
  console.log('ProgressAPI invoked:', JSON.stringify(event))
  try {
    const { httpMethod, pathParameters } = event

    // GET /employees — list all for HR dashboard
    if (httpMethod === 'GET' && !pathParameters?.employeeId) {
      const [employees, workflows, stages, documents] = await Promise.all([
        ddb.send(new ScanCommand({ TableName: process.env.EMPLOYEE_TABLE })),
        ddb.send(new ScanCommand({ TableName: process.env.WORKFLOW_TABLE })),
        ddb.send(new ScanCommand({ TableName: process.env.STAGE_TABLE })),
        ddb.send(new ScanCommand({ TableName: process.env.DOCUMENT_TABLE })),
      ])

      const workflowMap = {}
      for (const wf of (workflows.Items || [])) workflowMap[wf.employee_id] = wf

      const stageMap = {}
      for (const s of (stages.Items || [])) {
        if (!stageMap[s.workflow_id]) stageMap[s.workflow_id] = []
        stageMap[s.workflow_id].push(s)
      }

      const docMap = {}
      for (const d of (documents.Items || [])) {
        if (!docMap[d.employee_id]) docMap[d.employee_id] = []
        docMap[d.employee_id].push(d)
      }

      const result = (employees.Items || []).map(emp => {
        const wf = workflowMap[emp.employee_id] || {}
        const empStages = (stageMap[wf.workflow_id] || []).sort((a, b) => stageOrder(a.stage_name) - stageOrder(b.stage_name))
        return {
          ...emp,
          workflow: wf,
          stages: empStages,
          documents: docMap[emp.employee_id] || [],
        }
      })

      return ok(result)
    }

    const { employeeId } = pathParameters || {}
    if (!employeeId) return notFound('Employee ID required')

    // PUT /employees/{employeeId}/policy-signoff
    if (httpMethod === 'PUT') {
      const wfResult = await queryItems(
        process.env.WORKFLOW_TABLE,
        'employee-index',
        'employee_id = :eid',
        { ':eid': employeeId }
      )
      const workflow = wfResult.Items?.[0]
      if (!workflow) return notFound(`No workflow found for employee ${employeeId}`)

      const stagesResult = await queryItems(
        process.env.STAGE_TABLE,
        'workflow-index',
        'workflow_id = :wid',
        { ':wid': workflow.workflow_id }
      )
      const policyStage = stagesResult.Items?.find(s => s.stage_name === 'POLICY_SIGNOFF')
      if (!policyStage) return notFound(`POLICY_SIGNOFF stage not found for workflow ${workflow.workflow_id}`)

      const now = new Date().toISOString()

      await updateItem(
        process.env.STAGE_TABLE,
        { stage_id: policyStage.stage_id },
        'SET signed_at = :now, updated_at = :now, #s = :status',
        { ':now': now, ':status': 'IN_PROGRESS' },
        { '#s': 'status' }
      )

      await updateItem(
        process.env.WORKFLOW_TABLE,
        { workflow_id: workflow.workflow_id },
        'SET current_stage = :stage, updated_at = :now',
        { ':stage': 'POLICY_SIGNOFF', ':now': now }
      )

      return ok({ message: 'Policy sign-off recorded', employeeId, signedAt: now })
    }

    // GET /employees/{employeeId}/progress
    const empResult = await getItem(process.env.EMPLOYEE_TABLE, { employee_id: employeeId })
    if (!empResult.Item) return notFound(`Employee ${employeeId} not found`)

    const wfResult = await queryItems(process.env.WORKFLOW_TABLE, 'employee-index', 'employee_id = :eid', { ':eid': employeeId })
    const workflow = wfResult.Items?.[0] || null

    let stages = []
    if (workflow) {
      const stagesResult = await queryItems(process.env.STAGE_TABLE, 'workflow-index', 'workflow_id = :wid', { ':wid': workflow.workflow_id })
      stages = (stagesResult.Items || []).sort((a, b) => stageOrder(a.stage_name) - stageOrder(b.stage_name))
    }

    const docsResult = await queryItems(process.env.DOCUMENT_TABLE, 'employee-index', 'employee_id = :eid', { ':eid': employeeId })

    const totalStages = stages.length
    const completedStages = stages.filter(s => s.status === 'COMPLETE').length

    return ok({
      employee: empResult.Item,
      workflow,
      stages,
      documents: docsResult.Items || [],
      summary: {
        totalStages,
        completedStages,
        progressPercent: totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0,
        currentStage: workflow?.current_stage || null,
        overallStatus: workflow?.overall_status || 'NOT_STARTED',
      },
    })

  } catch (err) {
    console.error('ProgressAPI error:', err)
    return serverError(err.message)
  }
}
