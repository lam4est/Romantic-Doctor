import mongoose from "mongoose"

const workflowDetailSchema = new mongoose.Schema({
  n8nWorkflowId: { type: String, required: true }, 
  workflowId: { type: mongoose.Schema.Types.ObjectId, ref: "Workflow" },
  json: Object
}, { timestamps: true })

export default mongoose.model("WorkflowDetail", workflowDetailSchema)
