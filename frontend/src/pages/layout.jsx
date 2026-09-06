import Sidebar from '../components/sidebar'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { assets } from '../assets/assets'

const Layout = () => {
  const { user } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return user ? (
    <div className='min-h-[100dvh] w-full overflow-x-hidden bg-slate-100 sm:flex'>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>

      <div className="min-w-0 flex-1 bg-slate-100 pt-14 sm:ml-60 sm:pt-0 xl:ml-72">
        <Outlet />
      </div>
      <div className="fixed inset-x-0 top-0 z-[60] flex h-14 items-center justify-between border-b border-gray-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:hidden">
        <button type="button" aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100" onClick={() => setSidebarOpen((open) => !open)}>
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <img onClick={() => setSidebarOpen(false)} src={assets.logo} alt="Pingup" className="h-7 w-auto cursor-pointer object-contain" />
        <div className="w-9" aria-hidden="true" />
      </div>
      {sidebarOpen && <button type="button" aria-label="Close navigation overlay" className="fixed inset-0 z-40 bg-slate-950/30 sm:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  ) : (
    <h1>Loading...</h1>
      )
}

export default Layout;