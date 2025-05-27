import React from "react";

const CreateWorkflowModal = ({
  isOpen,
  onClose,
  workflowName,
  setWorkflowName,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-[400px] shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-center">Tạo Workflow Mới</h2>
        <input
          type="text"
          placeholder="Tên workflow..."
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2 mb-4 focus:outline-none focus:ring focus:border-blue-500"
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tạo
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkflowModal;
