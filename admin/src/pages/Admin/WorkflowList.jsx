import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";
import WorkflowTable from "../../components/WorkflowTable";
import WorkflowEditorIframe from "../../components/WorkflowEditorIframe";
import CreateWorkflowModal from "../../components/CreateModal";
import ConfirmDeleteModal from "../../components/ConfirmDeleteModal";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const WorkflowList = () => {
  const { getAllWorkflows, workflows, createWorkflow, deleteWorkflow, toggleWorkflowActive } =
    useContext(AdminContext);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [workflowName, setWorkflowName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getAllWorkflows();
  }, []);

  const handleEdit = (workflowId) => {
    navigate(`/admin/workflows/${workflowId}`);
  };

  const handleToggleActive = async (workflowId, currentStatus) => {
    await toggleWorkflowActive(workflowId, !currentStatus);
  };

  const handleDelete = (workflowId) => {
    setWorkflowToDelete(workflowId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (workflowToDelete) {
      try {
        await deleteWorkflow(workflowToDelete);
        toast.success("Xoá workflow thành công!");
      } catch (error) {
        toast.error("Xoá thất bại, vui lòng thử lại.");
        console.error("Lỗi khi xoá workflow:", error);
      } finally {
        setWorkflowToDelete(null);
        setShowDeleteModal(false);
      }
    }
  };

  const handleCreateNewWorkflow = () => {
    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    if (!workflowName.trim()) return;

    try {
      const newWorkflow = await createWorkflow(workflowName);
      if (newWorkflow?.n8nWorkflowId) {
        setSelectedWorkflowId(newWorkflow.n8nWorkflowId);
      }
    } catch (err) {
      console.error("Lỗi khi tạo workflow:", err);
    }
    setWorkflowName("");
    setShowModal(false);
  };

  return (
    <div className="flex flex-col flex-1 overflow-x-auto p-4">
      <div className="flex justify-end">
        <button
          onClick={handleCreateNewWorkflow}
          className="px-4 py-1 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white"
>
          Tạo Workflow Mới
        </button>
      </div>

      <WorkflowTable
        workflows={workflows}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />

      <WorkflowEditorIframe workflowId={selectedWorkflowId} />

      <CreateWorkflowModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        workflowName={workflowName}
        setWorkflowName={setWorkflowName}
        onSubmit={handleModalSubmit}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default WorkflowList;
