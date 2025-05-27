import axios from "axios";
import Workflow from "../models/workflow.js";
import WorkflowDetail from "../models/workflowDetail.js";

const syncAllWorkflowsFromN8n = async () => {
  try {
    const response = await axios.get(`${process.env.N8N_API_URL}/workflows`, {
      headers: {
        "X-N8N-API-KEY": process.env.N8N_API_KEY,
      },
    });

    const workflows = response.data.data; // ✅

    if (!Array.isArray(workflows)) {
      throw new Error("Dữ liệu từ n8n trả về không hợp lệ");
    }

    await Workflow.deleteMany({});
    await WorkflowDetail.deleteMany({});

    for (const workflow of workflows) {
      const newWorkflow = new Workflow({
        name: workflow.name,
        n8nWorkflowId: workflow.id,
        active: workflow.active,
      });

      const savedWorkflow = await newWorkflow.save();

      const newDetail = new WorkflowDetail({
        workflowId: savedWorkflow._id,
        n8nWorkflowId: workflow.id,
        json: workflow,
      });

      await newDetail.save();
    }

    console.log(`[SYNC SUCCESS] Đã đồng bộ ${workflows.length} workflow từ n8n.`);
  } catch (error) {
    console.error("[SYNC ERROR]:", {
      message: error.message,
      response: error.response?.data,
    });
  }
};

export default syncAllWorkflowsFromN8n;