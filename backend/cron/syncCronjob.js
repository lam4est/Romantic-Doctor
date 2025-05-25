import cron from 'node-cron'
import { syncAllWorkflowsFromN8n } from '../utils/syncWorkflow.js'

const startWorkflowSyncCron = () => {
  cron.schedule('*/10 * * * *', async () => {
    console.log('[CRON] Bắt đầu đồng bộ workflows từ n8n...')
    await syncAllWorkflowsFromN8n()
  })
}

export default startWorkflowSyncCron
