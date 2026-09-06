// import React from 'react'
import { assets } from '../assets/assets';
import { useNavigate } from 'react-router-dom';
import Menuitems from './Menuitems';
import { CirclePlus, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserButton, useClerk } from '@clerk/react'
import { useApp } from '../context/AppContext';

const sidebar = ({sidebarOpen, setSidebarOpen}) => {
    const navigate = useNavigate();
    const { user } = useApp();
    const { signOut } = useClerk();
  return (
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,86vw)] flex-col items-center justify-between border-r border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-xl transition-transform duration-300 ease-in-out sm:w-60 sm:translate-x-0 sm:shadow-none xl:w-72 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        <div className="w-full">
            <img onClick={()=> navigate('/')} src={assets.logo} alt="icon-logo" className='my-3 ml-6 h-9 w-auto max-w-[10rem] cursor-pointer object-contain sm:my-2' />
            <hr className='border-gray-300 mb-5 sm:mb-8' />

            <Menuitems setSidebarOpen={setSidebarOpen} />

            <Link to='/create-post' className='mx-4 mt-5 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-950 to-indigo-800 py-2.5 text-white transition hover:from-indigo-700 hover:to-purple-700 active:scale-95'>
              <CirclePlus className='h-5 w-5 sm:h-10 sm:w-10' />
              Create Post
            </Link>
        </div>

        <div className="flex w-full items-center justify-between border-t border-gray-200 p-4 px-5 sm:px-7">
            <div className="flex min-w-0 items-center gap-2">
              <UserButton />
              <div className='min-w-0'>
                <h1 className='truncate text-sm font-semibold text-gray-600'>{user?.full_name || 'User'}</h1>
                <p className='truncate text-xs text-gray-500'>@{user?.username || 'user'}</p>
              </div>
            </div>
            <LogOut onClick={signOut} className='w-4.5 text-gray-400 hover:text-gray-700 transistion cursor-pointer' />
        </div>
    </aside>
  )
}

export default sidebar;
