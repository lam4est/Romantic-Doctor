import validator from 'validator';
import bcrypt from 'bcryptjs';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import appointmentModel from '../models/appointmentModel.js';
import axios from 'axios';
import crypto from 'crypto';

// API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !password || !email) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Enter a strong password" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
      lead_score: 10
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    await axios.post('http://localhost:5678/webhook-test/register-user', {
      userId: user._id,
      name: user.name,
      email: user.email,
      lead_score: user.lead_score
    });

    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API for user login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User does not exist!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select('-password');
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update user profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data missing" });
    }

    await userModel.findByIdAndUpdate(userId, { name, phone, address: JSON.parse(address), dob, gender });

    if (imageFile) {
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
      const imageUrl = imageUpload.secure_url;
      await userModel.findByIdAndUpdate(userId, { image: imageUrl });
    }

    res.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;
    const docData = await doctorModel.findById(docId).select('-password');

    if (!docData.available) {
      return res.json({ success: false, message: 'Doctor not available' });
    }

    let slots_booked = docData.slots_booked;

    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res.json({ success: false, message: 'Slot not available' });
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select('-password');

    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      payment : false,
      date: Date.now(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    await axios.post("http://localhost:5678/webhook-test/appointment-webhook", {
      event_type: "appointment-created",
      appointment_id: newAppointment._id, 
      email: userData.email,
      name: userData.name,
      date: slotDate,
      time: slotTime,
      doctor: docData.name,
      fees: docData.fees,
      is_paid: false, 
    });

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    const timeoutId = setTimeout(async () => {
      try {
        const appointment = await appointmentModel.findById(newAppointment._id);
        if (!appointment.payment && !appointment.cancelled) {
          
          await appointmentModel.findByIdAndUpdate(newAppointment._id, { cancelled: true });

          const doctor = await doctorModel.findById(docId);
          let updatedSlots = doctor.slots_booked;
          updatedSlots[slotDate] = updatedSlots[slotDate].filter(slot => slot !== slotTime);
          await doctorModel.findByIdAndUpdate(docId, { slots_booked: updatedSlots });

          try {
            await axios.post("http://localhost:5678/webhook-test/appointment-webhook", {
              event_type: "appointment-cancelled",
              email: userData.email,
              name: userData.name,
              date: slotDate,
              time: slotTime,
              doctor: docData.name,
            });
          } catch (webhookError) {
            console.log('Webhook cancellation failed:', webhookError.message);
          }

          console.log(`Appointment ${newAppointment._id} auto-cancelled due to non-payment`);
        }
      } catch (error) {
        console.log('Auto-cancel error:', error.message);
      }
    }, 60000 * 30); // 30 phút

    res.json({ success: true, message: 'Appointment Booked' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user appointments for frontend my-appointment page
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.body;
    const appointments = await appointmentModel.find({ userId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    console.log(req.params, req.body);
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: 'Unauthorized action' });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime);
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    await axios.post("http://localhost:5678/webhook-test/appointment-webhook", {
      event_type: "appointment-cancelled",
      appointment_id: appointmentId,
      email: req.body.email || appointmentData.userData.email,
      name: req.body.name || appointmentData.userData.name,
      date: appointmentData.slotDate,
      time: appointmentData.slotTime,
      doctor: doctorData.name,
    });

    res.json({ success: true, message: 'Appointment Cancelled' });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const paymentMomo = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (!appointmentData || appointmentData.cancelled) {
      return res.json({ success: false, message: "Appointment cancelled or not found" });
    }
    if (appointmentData.payment) {
      return res.json({ success: false, message: "Appointment already paid" });
    }

    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const requestId = `${partnerCode}${Date.now()}`;
    const orderId = requestId;
    const usdAmount = appointmentData.amount;
    const exchangeRate = 24000; // USD to VND exchange rate
    const amountVND = Math.round(usdAmount * exchangeRate);
    const amount = amountVND.toString();

    const orderInfo = `Thanh toán lịch hẹn với bác sĩ ${appointmentData.docData.name}`;
    const redirectUrl = `http://localhost:5173/my-appointments?appointmentId=${appointmentId}`;
    const ipnUrl = `https://ad87-116-110-120-189.ngrok-free.app/api/user/capture-momo-payment`; //ngrok backend URL
    // callback URL for MoMo to send payment result - quan trong
    const requestType = "captureWallet";
    const extraData = JSON.stringify({
      appointmentId,
      userId: appointmentData.userId
    });

    const rawSignature =
      `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}` +
      `&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}` +
      `&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi'
    };

    const momoRes = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (momoRes.data && momoRes.data.payUrl) {
      res.json({ success: true, redirectUrl: momoRes.data.payUrl });
    } else {
      res.json({ success: false, message: 'Dont create momo payment gateway', result: momoRes.data });
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.json({ success: false, message: error.message });
  }
};

const momoWebhookHandler = async (req, res) => {
  try {
    const { resultCode, extraData } = req.body;
    const parsedExtra = JSON.parse(extraData || "{}");
    const appointmentId = parsedExtra.appointmentId;
    const userId = parsedExtra.userId;

    if (resultCode === 0) {
      const appointmentData = await appointmentModel.findByIdAndUpdate(
        appointmentId,
        { payment: true },
        { new: true }
      );

      if (!appointmentData) {
        return res.status(404).send("Appointment not found");
      }

      const userData = await userModel.findById(userId);

      await axios.post("http://localhost:5678/webhook-test/appointment-webhook", {
        event_type: "appointment-payment",
        appointment_id: appointmentData._id,
        user_id: appointmentData.userId,
        doc_id: appointmentData.docId,
        amount: appointmentData.amount,
        slot_date: appointmentData.slotDate,
        slot_time: appointmentData.slotTime,
        payment_date: Date.now(),
        doctor_name: appointmentData.docData?.name,
        user_email: appointmentData.userData?.email,
        user_name: appointmentData.userData?.name,
        is_paid: true,
        lead_score: userData?.lead_score
      });

      return res.status(200).send("OK");
    }

    return res.status(400).send("Payment failed or cancelled");
  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal server error");
  }
};

  const startChatSession = (req, res) => {
    const sessionKey = crypto.randomBytes(16).toString('hex');
    res.json({ success: true, sessionKey });
  };  

  const handleChatMessage = async (req, res) => {
    try {
      const { message, sessionKey } = req.body;
      if (!message || !sessionKey) {
        return res.json({ success: false, message: 'Message and sessionKey are required' });
      }
  
      const n8nResponse = await axios.post('http://localhost:5678/webhook/chatbot', {
        message,
        sessionKey
      });
      console.log('n8n response:', n8nResponse.data); 
  
      const botReply = n8nResponse.data.reply || 'Xin lỗi, hệ thống không thể xử lý yêu cầu.';
      res.json({ success: true, reply: botReply });
    } catch (error) {
      console.log('Error calling n8n webhook:', error.message);
      res.json({ success: false, message: error.message });
    }
  };  

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentMomo,
  momoWebhookHandler,
  handleChatMessage,
  startChatSession
};