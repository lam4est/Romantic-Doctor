import React from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const WorkflowTable = ({ workflows, onEdit, onDelete, onToggleActive }) => {
  const navigate = useNavigate();

  return (
    <div className="p-4">
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="py-3 px-4 text-left">Name</th>
            <th className="py-3 px-4 text-left">Created At</th>
            <th className="py-3 px-4 text-center">Hits</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {workflows.map((w) => (
            <tr
              key={w._id}
              className="border-t hover:bg-gray-50 transition-all cursor-pointer"
              onClick={() => navigate(`/admin/workflows/${w.n8nWorkflowId}`)}
            >
              <td className="py-3 px-4">{w.name}</td>
              <td className="py-3 px-4">
                {new Date(w.createdAt).toLocaleString()}
              </td>
              <td className="py-3 px-4 text-center">{w.hits || 0}</td>
              <td className="py-3 px-4 text-center">
                <span
                  className={`px-3 py-1 text-sm rounded-full ${
                    w.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {w.active ? "Active" : "Not Active"}
                </span>
              </td>
              <td
                className="py-3 px-4 text-center space-x-4"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onEdit(w.n8nWorkflowId)}
                  className="text-blue-600 hover:text-blue-800 transition"
                  title="Edit"
                >
                  <Pencil size={18} />
                </button>

                <button
                  onClick={() => onToggleActive(w._id, w.active)}
                  className="text-green-600 hover:text-green-800 transition"
                  title="Toggle"
                >
                  {w.active ? (
                    <ToggleRight size={20} />
                  ) : (
                    <ToggleLeft size={20} />
                  )}
                </button>

                <button
                  onClick={() => onDelete(w._id)}
                  className="text-red-600 hover:text-red-800 transition"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WorkflowTable;
