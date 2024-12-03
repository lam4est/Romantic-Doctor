import express from 'express'
import cors from 'cors'
import 'dotenv/config' 
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'

// app config
const app = express()
const port = process.env.PORT || 4000
console.log(port)
connectDB()
connectCloudinary()

// middlewares
app.use(cors({
    origin: ['https://romantic-doctor-frontend.onrender.com', 'https://romantic-doctor-admin.onrender.com'],  // Địa chỉ frontend của bạn
    methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Các phương thức HTTP được phép
}));
app.use(express.json())

// api endpoints
app.use('/api/admin', adminRouter);
app.use('/api/doctor', doctorRouter);
app.use('/api/user', userRouter);


app.get('/',(req,res) => {
    res.send('API WORKING')
})

app.listen(port, ()=> console.log("Server Start", port))

