import express from 'express';
import { 
    bookAppointment, 
    cancelAppointment, 
    getProfile, 
    listAppointment, 
    loginUser, 
    registerUser, 
    updateProfile, 
    momoWebhookHandler,
    paymentMomo,
    handleChatMessage,
    startChatSession
} from '../controllers/userController.js';
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/get-profile', authUser, getProfile);
userRouter.post('/update-profile', upload.single('image'), authUser, updateProfile);
userRouter.post('/book-appointment', authUser, bookAppointment);
userRouter.get('/appointments', authUser, listAppointment);
userRouter.post('/cancel-appointment', authUser, cancelAppointment);
userRouter.post('/momo-payment', authUser, paymentMomo); 
userRouter.post('/capture-momo-payment', momoWebhookHandler); 
userRouter.post('/chat', handleChatMessage);
userRouter.post('/start-chat-session', startChatSession);

export default userRouter;