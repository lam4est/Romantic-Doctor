import { useContext, useState } from 'react'
import { AppContext } from '../context/AppContext'
import {assets} from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'
import bcrypt from 'bcryptjs'

const MyProfile = () => {

  const {userData, setUserData, token, backendUrl, loadUserProfileData} = useContext(AppContext)

  const [isEdit, setIsEdit] = useState(false)

  const [image, setImage] = useState(false)

  const [showPasswordForm, setShowPasswordForm] = useState(false)

  const [showOTPForm, setShowOTPForm] = useState(false)

  const [otp, setOtp] = useState('')

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showCurrentPasswordForm, setShowCurrentPasswordForm] = useState(false)

  const [tempNewPassword, setTempNewPassword] = useState('');

  const updateUserProfileData = async () => {
    try {
      const formData = new FormData()

      formData.append('name', userData.name)
      formData.append('phone', userData.phone)
      formData.append('address', JSON.stringify(userData.address))
      formData.append('gender', userData.gender)
      formData.append('dob', userData.dob)

      image && formData.append('image', image)

      const {data} = await axios.post(backendUrl + '/api/user/update-profile', formData, {headers:{token}})

      if(data.success){
        toast.success(data.message)
        await loadUserProfileData()
        setIsEdit(false)
        setImage(false)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || 'Failed to update user profile')
    }
  }

  const verifyCurrentPassword = async () => {
    try {
      const {data} = await axios.post(backendUrl + '/api/user/verify-password', {
        currentPassword: passwordData.currentPassword
      }, {headers: {token}});

      if(data.success) {
        toast.success('Password verified successfully');
        setShowPasswordForm(true);
      } else {
        toast.error('Current password is incorrect');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to verify password');
    }
  };

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match!");
      return;
    }

    try {
      const response = await axios.post('http://localhost:5678/webhook/send-otp', {
        phone: userData.phone,
        email: userData.email,
        name: userData.name,
        newPassword: passwordData.newPassword
      });
      
      if (response.data.success) {
        toast.success('OTP sent successfully');
        setShowOTPForm(true);
        setTempNewPassword(passwordData.newPassword);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initiate password change');
    }
  };

  const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };

  const verifyOTP = async () => {
    try {
      const hashedNewPassword = await hashPassword(tempNewPassword);
      // const hashedCurrentPassword = await hashPassword(passwordData.currentPassword);

      const response = await axios.post('http://localhost:5678/webhook/verify-otp', {
        phone: userData.phone,
        email: userData.email,
        otp: otp,
        newPassword: hashedNewPassword,
        // currentPassword: hashedCurrentPassword,
        verificationTime: new Date().toISOString()
      });
      
      if (response.data.success) {
        toast.success('Password changed successfully');
        setShowPasswordForm(false);
        setShowOTPForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setOtp('');
        setTempNewPassword('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    }
  };

  return userData && (
    <div className='max-w-lg flex flex-col gap-2 text-sm'>

      {
        isEdit
        ? <label htmlFor="image">
          <div className='inline-block relative cursor-pointer'>
            <img className='w-36 rounded opacity-75' src={image ? URL.createObjectURL(image) : userData.image} alt="" />
            <img className='w-10 absolute bottom-12 right-12' src={image ? '' : assets.upload_icon} alt="" />
          </div>
          <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
        </label>
        :<img className='w-36 rounded' src={userData.image} alt="" />
      }

      {
        isEdit
          ? <input className='bg-gray-50 text-3xl font-medium max-w-60 mt-4'
            type="text" value={userData.name}
            onChange={e => setUserData(prev => ({ ...prev, name: e.target.value }))} />
          : <p className='font-medium text-3xl text-neutral-800 mt-4 '>{userData.name}</p>
      }

      <hr className='bg-zinc-400 h-[1px] border-none' />
      <div>
        <p className='text-neutral-500 underline mt-3'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Email ID : </p>
          <p className='text-blue-500'>{userData.email}</p>
          <p className='font-medium'>Phone</p>
          {
            isEdit
              ? <input
                className='bg-gray-100 max-w-52' type="text"
                value={userData.phone} onChange={e => setUserData(prev => ({ ...prev, phone: e.target.value }))} />
              : <p className='text-blue-400'>{userData.phone}</p>
          }
          <p className='font-medium'>Address : </p>
          {
            isEdit
              ? <p>
                <input
                  onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line1: e.target.value } }))}
                  value={userData.address.line1} type="text"
                  className='bg-gray-50' />
                <br />
                <input
                  onChange={(e) => setUserData(prev => ({ ...prev, address: { ...prev.address, line2: e.target.value } }))}
                  value={userData.address.line2} type="text"
                  className='bg-gray-50' />
              </p>
              : <p className='text-gray-500'>
                {userData.address.line1}
                <br />
                {userData.address.line2}
              </p>
          }
        </div>
      </div>
      <div>
        <p className='text-neutral-500 underline mt-3'>BASIC INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className='font-medium'>Gender: </p>
          {
            isEdit
              ? <select
                className='max-w-20 bg-gray-100'
                onChange={(e) => setUserData(prev => ({ ...prev, gender: e.target.value }))}
                value={userData.gender}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              : <p className='text-gray-400'>{userData.gender}</p>
          }
          <p className='font-medium'>Birthday:</p>
          {
            isEdit
              ? <input
                className='max-w-28 bg-gray-100' type="date"
                onChange={(e) => setUserData(prev => ({ ...prev, dob: e.target.value }))}
                value={userData.dob} />
              : <p className='text-gray-400'>{userData.dob}</p>
          }
        </div>
      </div>

      <div className='mt-10 flex gap-4'>
        {
          isEdit
            ? <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
              onClick={updateUserProfileData}>Save Information</button>
            : <button className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
              onClick={() => setIsEdit(true)}>Edit</button>
        }
        <button 
          className='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all'
          onClick={() => {
            setShowPasswordForm(false);
            setShowOTPForm(false);
            setPasswordData({
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            });
            setOtp('');
            setShowCurrentPasswordForm(true);
          }}
        >
          Change Password
        </button>
      </div>

      {showCurrentPasswordForm && !showPasswordForm && !showOTPForm && (
        <div className='mt-6 p-6 border rounded-lg'>
          <h3 className='text-lg font-medium mb-4'>Verify Current Password</h3>
          <div className='flex flex-col gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({...prev, tPassword: e.target.value}))}
                className='w-full px-3 py-2 border rounded-md'
                required
              />
            </div>
            <div className='flex gap-4'>
              <button
                onClick={verifyCurrentPassword}
                className='bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-all'
              >
                Verify Password
              </button>
              <button
                onClick={() => {
                  setShowCurrentPasswordForm(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className='border border-gray-300 px-6 py-2 rounded-full hover:bg-gray-50 transition-all'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showPasswordForm && !showOTPForm && (
        <div className='mt-6 p-6 border rounded-lg'>
          <h3 className='text-lg font-medium mb-4'>Set New Password</h3>
          <form onSubmit={handleNewPasswordSubmit} className='flex flex-col gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({...prev, newPassword: e.target.value}))}
                className='w-full px-3 py-2 border rounded-md'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({...prev, confirmPassword: e.target.value}))}
                className='w-full px-3 py-2 border rounded-md'
                required
              />
            </div>
            <div className='flex gap-4'>
              <button
                type="submit"
                className='bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-all'
              >
                Continue
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
                className='border border-gray-300 px-6 py-2 rounded-full hover:bg-gray-50 transition-all'
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showOTPForm && (
        <div className='mt-6 p-6 border rounded-lg'>
          <h3 className='text-lg font-medium mb-4'>Verify OTP</h3>
          <div className='flex flex-col gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Enter OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className='w-full px-3 py-2 border rounded-md'
                placeholder="Enter 6 digit OTP"
                maxLength={6}
                required
              />
            </div>
            <div className='flex gap-4'>
              <button
                onClick={verifyOTP}
                className='bg-primary text-white px-6 py-2 rounded-full hover:bg-primary/90 transition-all'
              >
                Verify OTP
              </button>
              <button
                onClick={() => {
                  setShowOTPForm(false);
                  setOtp('');
                }}
                className='border border-gray-300 px-6 py-2 rounded-full hover:bg-gray-50 transition-all'
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyProfile