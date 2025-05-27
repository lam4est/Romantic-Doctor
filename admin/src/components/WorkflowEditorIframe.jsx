import React from "react";

const WorkflowEditorIframe = ({ workflowId }) => {
  if (!workflowId) return null;

  return (
    <iframe
      title="Workflow Editor"
      src={`http://localhost:5678/workflows/${workflowId}`}
      className="w-full h-[90vh] border mt-6 rounded-md shadow"
    />
  );
};

export default WorkflowEditorIframe;
