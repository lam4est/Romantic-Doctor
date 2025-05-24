import validator from "validator"
import bcrypt from 'bcryptjs'
import {v2 as cloudinary} from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import appointmentModel from "../models/appointmentModel.js"
import Workflow from '../models/workflow.js'
import WorkflowDetail from '../models/workflowDetail.js'
import jwt from 'jsonwebtoken'
import userModel from "../models/userModel.js"
import axios from 'axios'

//API for adding doctor
const addDoctor = async(req, res) =>{
    try {
        const {name, email, password, speciality, degree, experience, about, fees, address} = req.body
        const imageFile = req.file

        // checking for all data to add doctor
        if(!name || !email || !password ||!speciality ||!degree ||!experience ||!about ||!fees ||!address){
            return res.json({success:false, message: "Missing Details"})
        }

        // validating email format
        if(!validator.isEmail(email)){
            return res.json({success:false, message: "Please enter a valid email"})
        }

        if(password.length <8){
            return res.json({success:false, message: "Please enter a strong password"})
        }

        // hashing doctor password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        // upload image to cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type:"image"})
        const imageUrl = imageUpload.secure_url

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
            date: Date.now()

        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.json({success:true, message:"Doctor Added"})

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// APi for admin login
const loginAdmin = async(req,res) =>{
    try {
        
        const {email,password} = req.body

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD ){
            const token = jwt.sign(email+password,process.env.JWT_SECRET)
            res.json({success:true, token})
        } else {
            res.json({success:false, message:"Invalid credentials"})
        }

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req,res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({success:true, doctors})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

//API to get all appointment list 
const appointmentsAdmin = async(req,res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({success:true, appointments})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// API for appointment cancellation
const appointmentCancel = async (req,res) => {
    try {
        const {appointmentId} = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        await appointmentModel.findByIdAndUpdate(appointmentId, {cancelled: true})

        // releaseing doctor slot

        const {docId, slotDate, slotTime} = appointmentData
        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e!== slotTime)
        await doctorModel.findByIdAndUpdate(docId, {slots_booked})

        res.json({success:true, message:'Appointment Cancelled'})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async(req,res) =>{
    try {
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors : doctors.length,
            appointments: appointments.length,
            patiens: users.length,
            latestAppointments: appointments.reverse().slice(0.5)
        }

        res.json({success:true, dashData})

    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message}) 
    }
}

const getAllWorkflows = async (req, res) => {
  try {
    const workflows = await Workflow.find().sort({ createdAt: -1 })
    res.json({ success: true, workflows })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const syncWorkflowFromN8n = async (req, res) => {
  try {
    const { n8nWorkflowId } = req.body
    const { data } = await axios.get(`${n8nApiUrl}/workflows/${n8nWorkflowId}`, {
  headers: {
    'X-N8N-API-KEY': process.env.N8N_API_KEY
  }
})

    let workflow = await Workflow.findOne({ n8nWorkflowId })
    if (!workflow) {
      workflow = await Workflow.create({
        name: data.name,
        n8nWorkflowId: data.id,
        active: data.active,
      })
    }

    await WorkflowDetail.findOneAndUpdate(
      { n8nWorkflowId },
      { json: data, workflowId: workflow._id },
      { upsert: true, new: true }
    )

    res.json({ success: true, message: "Workflow synced", workflowId: workflow._id })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

const n8nApiUrl = 'http://localhost:5678/api/v1'

export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard, getAllWorkflows, syncWorkflowFromN8n};