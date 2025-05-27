import React from "react";

const WorkflowEditorIframe = ({ workflowId }) => {
  if (!workflowId) return null;

  return (
    <div
      className="resize overflow-auto border rounded-md shadow mt-2"
      style={{ width: "100%", minHeight: "500px" }}>
      <iframe
        title="Workflow Editor"
        src={`http://localhost:5678/workflow/${workflowId}`}
        className="w-full h-full"
        style={{ minHeight: "500px", minWidth: "1200px", border: "none" }}
      />
    </div>
  );
};

export default WorkflowEditorIframe;
