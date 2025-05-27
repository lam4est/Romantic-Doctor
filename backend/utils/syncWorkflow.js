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

    const workflows = response.data.data;

    if (!Array.isArray(workflows)) {
      throw new Error("Dữ liệu từ n8n trả về không hợp lệ");
    }

    for (const workflow of workflows) {
      const existing = await Workflow.findOne({ n8nWorkflowId: workflow.id });

      let workflowDoc;
      if (existing) {
        existing.name = workflow.name;
        existing.active = workflow.active;
        await existing.save();
        workflowDoc = existing;
      } else {
        workflowDoc = await Workflow.create({
          name: workflow.name,
          n8nWorkflowId: workflow.id,
          active: workflow.active,
        });
      }

      // Cập nhật hoặc tạo mới detail
      const detailExisting = await WorkflowDetail.findOne({ n8nWorkflowId: workflow.id });

      if (detailExisting) {
        detailExisting.json = workflow;
        detailExisting.workflowId = workflowDoc._id;
        await detailExisting.save();
      } else {
        await WorkflowDetail.create({
          workflowId: workflowDoc._id,
          n8nWorkflowId: workflow.id,
          json: workflow,
        });
      }
    }

    console.log(`[SYNC SUCCESS] Đồng bộ ${workflows.length} workflows từ n8n.`);
  } catch (error) {
    console.error("[SYNC ERROR]:", {
      message: error.message,
      response: error.response?.data,
    });
  }
};

export default syncAllWorkflowsFromN8n;