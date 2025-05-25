import axios from 'axios'
import Workflow from '../models/workflow.js'
import WorkflowDetail from '../models/workflowDetail.js'

const n8nApiUrl = process.env.N8N_API_URL
const apiKey = process.env.N8N_API_KEY

export const syncAllWorkflowsFromN8n = async () => {
  try {
    const { data } = await axios.get(`${n8nApiUrl}/workflows`, {
      headers: {
        'X-N8N-API-KEY': apiKey
      }
    })

    const workflows = data.data || []

    for (const wf of workflows) {
      const detailRes = await axios.get(`${n8nApiUrl}/workflows/${wf.id}`, {
        headers: {
          'X-N8N-API-KEY': apiKey
        }
      })

      const detail = detailRes.data

      let workflow = await Workflow.findOne({ n8nWorkflowId: wf.id })

      if (!workflow) {
        workflow = await Workflow.create({
          name: wf.name,
          n8nWorkflowId: wf.id,
          active: wf.active,
        })
      } else {
        workflow.name = wf.name
        workflow.active = wf.active
        await workflow.save()
      }

      await WorkflowDetail.findOneAndUpdate(
        { n8nWorkflowId: wf.id },
        { json: detail, workflowId: workflow._id },
        { upsert: true, new: true }
      )
    }

    console.log(`[SYNC] Đồng bộ ${workflows.length} workflows thành công.`)
  } catch (error) {
    console.error('[SYNC ERROR]', error.message)
  }
}
