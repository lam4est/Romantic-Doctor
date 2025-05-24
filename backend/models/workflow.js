import mongoose from "mongoose"

const workflowSchema = new mongoose.Schema({
  name: String,
  n8nWorkflowId: { type: String, required: true }, 
  active: Boolean
}, { timestamps: true })

export default mongoose.model("Workflow", workflowSchema)
