import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : ""
  );
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [workflows, setWorkflows] = useState([]);

  const backendUrl = "http://localhost:4000";

  const getAllDoctors = async () => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/all-doctors",
        {},
        { headers: { aToken } }
      );
      if (data.success) {
        setDoctors(data.doctors);
        console.log(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const changeAvailability = async (docId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/change-availability",
        { docId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllDoctors();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getAllAppointments = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/appointments", {
        headers: { aToken },
      });
      if (data.success) {
        setAppointments(data.appointments);
        console.log(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/cancel-appointment",
        { appointmentId },
        { headers: { aToken } }
      );
      if (data.success) {
        toast.success(data.message);
        getAllAppointments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getDashData = async () => {
    try {
      const { data } = await axios.get(backendUrl + "/api/admin/dashboard", {
        headers: { aToken },
      });
      if (data.success) {
        setDashData(data.dashData);
        console.log(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getAllWorkflows = async () => {
    const { data } = await axios.get(`${backendUrl}/api/admin/workflows`);
    if (data.success) setWorkflows(data.workflows);
  };

  const createWorkflow = async (name) => {
  try {
    const { data } = await axios.post(`${backendUrl}/api/admin/workflows`, { name });

    if (!data.success) {
      const message = data.message || "Tạo workflow thất bại";
      toast.error(message);
      throw new Error(message);
    }

    toast.success("Tạo workflow thành công");
    getAllWorkflows();
    return data.workflow;

  } catch (error) {
    const message = error?.response?.data?.message || "Lỗi khi tạo workflow";
    toast.error(message);
    console.error(error);
    throw error;
  }
};

const deleteWorkflow = async (workflowId) => {
  try {
    const res = await axios.delete(`${backendUrl}/api/admin/workflows/${workflowId}`);
    if (res.status === 200) {
      getAllWorkflows(); 
    }
  } catch (err) {
    console.error("Lỗi khi xóa workflow:", err);
  }
};

const toggleWorkflowActive = async (workflowId, newStatus) => {
  try {
    const res = await axios.post(
      `${backendUrl}/api/admin/workflows/${workflowId}/toggle-active`,
      { active: newStatus }
    );

    if (res.data.success) {
      toast.success("Cập nhật trạng thái thành công");
      getAllWorkflows();
    } else {
      toast.error(res.data.message || "Cập nhật trạng thái thất bại");
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái workflow:", error);
    toast.error("Lỗi khi cập nhật trạng thái, workflow phải có ít nhất 1 node để có thể kích hoạt.");
  }
};

  const value = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    getAllDoctors,
    changeAvailability,
    appointments,
    setAppointments,
    getAllAppointments,
    cancelAppointment,
    dashData,
    getDashData,
    workflows,
    getAllWorkflows,
    createWorkflow,
    deleteWorkflow,
    toggleWorkflowActive
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
