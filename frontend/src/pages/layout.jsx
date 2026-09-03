import Sidebar from '../components/sidebar'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'

const Layout = () => {
  const { user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return user ? (
    <div className='w-full flex h-screen'>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

      <div className="flex-1 bg-slate-100">
        <Outlet />
      </div>
    {
      sidebarOpen ?
      <X className="absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden" onClick={() => setSidebarOpen(false)}/>
      :
      < Menu className="absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden" onClick={() => setSidebarOpen(true)}/>
    }
    </div>
  ) : (
    <h1>Loading...</h1>
      )
}

export default Layout;