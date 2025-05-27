import React, { useContext } from 'react'
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {AdminContext} from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Admin/Dashboard';
import AllApointments from './pages/Admin/AllApointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorsList from './pages/Admin/DoctorsList';
import WorkflowList from './pages/Admin/WorkflowList';
import WorkflowEditorPage from './pages/Admin/WorkflowEditorPage';

const App = () => {

  const {aToken} = useContext(AdminContext)

  return aToken ? (
    <div className='bg-[#F8F9FD]'> 
      <ToastContainer/>
      <Navbar/>
      <div className='flex items-start'>
        <Sidebar/>
        <Routes>
          <Route path='/' element={<></>} />
          <Route path='/admin-dashboard' element={<Dashboard/>} />
          <Route path='/all-appointments' element={<AllApointments/>} />
          <Route path='/add-doctor' element={<AddDoctor/>} />
          <Route path='/doctor-list' element={<DoctorsList/>} />
          <Route path="/admin/workflows" element={<WorkflowList />} />
          <Route path="/admin/workflows/:id" element={<WorkflowEditorPage />} />
        </Routes>
      </div>
    </div>
  ) : ( 
    <>
      <Login />
      <ToastContainer/>
    </>
  )
}

export default App