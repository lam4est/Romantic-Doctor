import React, { useContext, useEffect, useState } from "react";
import { AdminContext } from "../../context/AdminContext";

const WorkflowList = () => {
  const { getAllWorkflows, workflows } = useContext(AdminContext);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState(null);

  useEffect(() => {
    getAllWorkflows();
  }, []);

  const WorkflowIframe = ({ workflowId }) => (
    <iframe
      title="Workflow Editor"
      src={`http://localhost:5678/workflow/${workflowId}`}
      style={{ width: "100%", height: "90vh", border: "none" }}
    />
  );

  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: "30%", borderRight: "1px solid gray" }}>
        <h2>Workflows</h2>
        <ul>
          {workflows.map((w) => (
            <li
              key={w._id}
              onClick={() => setSelectedWorkflowId(w.n8nWorkflowId)}
              style={{ cursor: "pointer", padding: "8px", backgroundColor: selectedWorkflowId === w.n8nWorkflowId ? "#eee" : "transparent" }}
            >
              {w.name} - {w.n8nWorkflowId}
            </li>
          ))}
        </ul>
      </div>
      <div style={{ width: "70%" }}>
        {selectedWorkflowId ? (
          <WorkflowIframe workflowId={selectedWorkflowId} />
        ) : (
          <p>Chọn workflow để chỉnh sửa</p>
        )}
      </div>
    </div>
  );
};

export default WorkflowList;
