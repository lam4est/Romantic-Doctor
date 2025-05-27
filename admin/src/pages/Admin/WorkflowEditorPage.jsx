import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import WorkflowEditorIframe from "../../components/WorkflowEditorIframe";

const WorkflowEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="p-4 flex flex-col h-screen">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-blue-600 mb-4 hover:underline">
        <ArrowLeft className="mr-2" size={20} />
        Quay lại danh sách
      </button>

      <WorkflowEditorIframe workflowId={id} />
    </div>
  );
};

export default WorkflowEditorPage;
