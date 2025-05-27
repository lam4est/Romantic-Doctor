import validator from "validator";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import Workflow from "../models/workflow.js";
import WorkflowDetail from "../models/workflowDetail.js";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import axios from "axios";
import syncAllWorkflowsFromN8n from "../utils/syncWorkflow.js";

//API for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Please enter a strong password",
      });
    }

    // hashing doctor password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: JSON.parse(address),
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: "Doctor Added" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// APi for admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//API to get all appointment list
const appointmentsAdmin = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({});
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for appointment cancellation
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // releaseing doctor slot

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    const appointments = await appointmentModel.find({});

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patiens: users.length,
      latestAppointments: appointments.reverse().slice(0.5),
    };

    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getAllWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ createdAt: -1 });
    res.json({ success: true, workflows });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const createWorkflow = async (req, res) => {
  const { name } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Tên workflow không được để trống',
    });
  }

  const payload = {
    name,
    nodes: [],
    connections: {},
    settings: {},
  };

  const headers = {
    'X-N8N-API-KEY': process.env.N8N_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const { data: workflowData } = await axios.post( `${process.env.N8N_API_URL}/workflows`, payload , { headers });

    if (!workflowData?.id) {
      return res.status(500).json({
        success: false,
        message: 'Không tạo được workflow trên n8n',
      });
    }

    const result = {
      name,
      n8nWorkflowId: workflowData.id,
      active: workflowData.active,
      createdAt: new Date(),
    };

    await syncAllWorkflowsFromN8n();
    return res.json({ success: true, workflow: result });
  } catch (error) {
    console.error('Lỗi khi tạo workflow:', {
      message: error.message,
      status: error.response?.status,
      response: error.response?.data,
    });

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message || 'Lỗi server khi tạo workflow',
    });
  }
};

const deleteWorkflow = async (req, res) => {
  const { id } = req.params;

  try {
    // Bước 1: Tìm workflow trong MongoDB theo _id
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found in database' });
    }

    const n8nWorkflowId = workflow.n8nWorkflowId;

    // Bước 2: Xoá trên n8n
    const response = await axios.delete(`${process.env.N8N_API_URL}/workflows/${n8nWorkflowId}`, {
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY,
      },
    });

    console.log('Đã xóa trên n8n:', response.status, response.data);
    
    await syncAllWorkflowsFromN8n();

    return res.status(200).json({ message: 'Workflow deleted and synced successfully' });
  } catch (error) {
    console.error('Lỗi khi xoá workflow:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    return res.status(500).json({ message: 'Failed to delete workflow', error: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  allDoctors,
  appointmentsAdmin,
  appointmentCancel,
  adminDashboard,
  getAllWorkflows,
  createWorkflow,
  deleteWorkflow,
};
