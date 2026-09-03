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
    <div className={`w-60 xl:w-72 bg-white border-r border-gray-200 flex flex-col justify-between items-center fixed top-0 left-0 h-screen ${sidebarOpen ? 'translate-x-0' : 'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out z-50`}>

        <div className="w-full">
            <img onClick={()=> navigate('/')} src={assets.logo} alt="icon-logo" className='w-26 ml-7 my-2 cursor-pointer' />
            <hr className='border-gray-300 mb-8' />

            <Menuitems setSidebarOpen={setSidebarOpen} />

            <Link to='/create-post' className='flex items-center justify-center gap-2 py-2.5 mt-6 mx-4 rounded-lg bg-gradient-to-r from-indigo-950 to-indigo-800 to-purple-500 hover:from-indigo-700 hover:to-purple-700 text-white active:scale-95 transition cursor-pointer'>
              <CirclePlus className='w-10 h-10' />
              Create Post
            </Link>
        </div>

        <div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer">
              <UserButton />
              <div className=''>
                <h1 className='flex text-gray-600 bold cursor-pointer'>{user?.full_name || 'User'}</h1>
                <p className='flex text-brown-550 text-xs'>@{user?.username || 'user'}</p>
              </div>
            </div>
            <LogOut onClick={signOut} className='w-4.5 text-gray-400 hover:text-gray-700 transistion cursor-pointer' />
        </div>
    </div>
  )
}

export default sidebar;
