// import React from 'react'

// const message = () => {
//   return (
//     <div>
//       <h1>Messages</h1>
//     </div>
//   )
// }

// export default message


import { useState } from 'react';
import { Menu, X } from 'lucide-react'; // Standard Lucide icons for clean toggle execution
import { 
  assets, 
  menuItemsData, 
  dummyUserData, 
  dummyConnectionsData 
} from '../assets/assets.js'; 

export default function Message() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getAvatar = (user) => {
    if (user.profile_picture) return user.profile_picture;
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"; 
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      
      {/* 1. MOBILE ONLY TOP ACTION BAR */}
      {/* 'justify-end' pushes your hamburger button directly to the top right edge, hiding brand text/logos entirely */}

      {/* 2. MOBILE DRAWER OVERLAY PANEL (Triggers when state = true) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 h-full transform transition-transform duration-300 ease-in-out md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          {/* Drawer Header Layout */}
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={assets.logo} alt="Logo" className="h-6 w-auto" />
              <span className="text-xl font-bold text-[#5c33f6]">Group</span>
            </div>
            {/* Close Button UI */}
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Render Items Links Layout */}
          <nav className="space-y-1">
            {menuItemsData.map((item, index) => {
              const IconComponent = item.Icon;
              const isMessagesActive = item.label === 'Messages';
              
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isMessagesActive
                      ? 'bg-[#eef0ff] text-[#5c33f6]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isMessagesActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Current Identity Meta Card Block */}
        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img 
            src={getAvatar(dummyUserData)} 
            alt={dummyUserData.full_name} 
            className="w-10 h-10 rounded-full bg-slate-200 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate">{dummyUserData.full_name}</h4>
            <span className="text-xs text-slate-400 truncate block">@{dummyUserData.username}</span>
          </div>
        </div>
      </div>

      {/* 3. TRANSPARENT DRAWER BACKDROP MODAL */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* 4. CORE DASHBOARD CONTENT GRID PLATFORM */}
      <main className="p-6 sm:p-8 md:p-12 max-w-5xl w-full mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Messages</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Talk to your friends and family</p>
        </header>

        {/* Dynamic Card Map Stack Engine */}
        <div className="space-y-4">
          {dummyConnectionsData.map((user) => (
            <div 
              key={user._id} 
              className="bg-white border border-slate-100 rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
            >
              <div className="flex items-start space-x-3 sm:space-x-4">
                <img 
                  src={getAvatar(user)} 
                  alt={user.full_name} 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-200 object-cover flex-shrink-0"
                />
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-800 text-sm sm:text-base leading-snug truncate">
                        {user.full_name}
                      </h3>
                      {user.is_verified && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">Verified</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 truncate">@{user.username}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl pt-1 whitespace-pre-line break-words">
                    {user.bio || "No profile bio description supplied yet."}
                  </p>
                </div>
              </div>

              {/* Icon Utilities Navigation Action Links */}
              <div className="flex sm:flex-col items-center justify-end gap-2 border-t border-slate-50 sm:border-0 pt-3 sm:pt-0">
                <button className="flex-1 sm:flex-initial p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-100 flex justify-center items-center min-w-[40px]">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.282 3.429.349M14.501 16.006L18 19V16.5m-15.4-3.356a48.108 48.108 0 013.478-.397m7.5 0a48.106 48.106 0 013.478.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                  <span className="sm:hidden text-xs font-medium ml-2">Message</span>
                </button>
                <button className="flex-1 sm:flex-initial p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-100 flex justify-center items-center min-w-[40px]">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="sm:hidden text-xs font-medium ml-2">View Profile</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

    </div>
  );
}