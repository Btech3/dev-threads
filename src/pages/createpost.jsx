// import React from 'react'

// const createpost = () => {
//   return (
//     <div>
//       <h1>Create Post</h1>
//     </div>
//   )
// }

// export default createpost


import { useState } from 'react';
import { Menu, X, Image as ImageIcon } from 'lucide-react';
import { 
  assets, 
  menuItemsData, 
  dummyUserData 
} from '../assets/assets.js'; 

export default function Createpost() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [postContent, setPostContent] = useState('');

  const getAvatar = (user) => {
    if (user.profile_picture) return user.profile_picture;
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"; 
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      
      {/* MOBILE HEADER BUTTON (Right-aligned menu button ONLY) */}

      {/* MOBILE OVERLAY NAVIGATION CONTAINER DRAWER */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 h-full transform transition-transform duration-300 ease-in-out md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={assets.logo} alt="Logo" className="h-6 w-auto" />
              <span className="text-xl font-bold text-[#5c33f6]">Group</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="space-y-1">
            {menuItemsData.map((item, index) => {
              const IconComponent = item.Icon;
              const isFeedActive = item.label === 'Feed'; // Fallback highlight matching default rules
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isFeedActive ? 'bg-[#eef0ff] text-[#5c33f6]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isFeedActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img src={getAvatar(dummyUserData)} alt={dummyUserData.full_name} className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{dummyUserData.full_name}</h4>
            <span className="text-xs text-slate-400 truncate block">@{dummyUserData.username}</span>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />
      )}

      {/* WORKSPACE CENTRAL WRAPPER DECK */}
      <main className="p-6 sm:p-8 md:p-12 max-w-2xl w-full mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Create Post</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Share your thoughts with the world</p>
        </header>

        {/* INPUT FORM WRAPPER PANEL CARD BOX */}
        <div className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          
          {/* User Meta Identity Info Card */}
          <div className="flex items-center space-x-3">
            <img 
              src={getAvatar(dummyUserData)} 
              alt={dummyUserData.full_name} 
              className="w-10 h-10 rounded-full object-cover bg-slate-100"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-800 leading-tight truncate">{dummyUserData.full_name}</h3>
              <span className="text-xs text-slate-400 block mt-0.5">@{dummyUserData.username}</span>
            </div>
          </div>

          {/* Core TextArea Platform Input */}
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="What's happening?"
            rows={5}
            className="w-full text-sm text-slate-800 placeholder-slate-400 focus:outline-none resize-none pt-2 bg-transparent min-h-[120px]"
          />

          {/* Bottom Utility Interactive Frame Control Deck */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
            {/* Attachment Button UI Frame */}
            <button className="p-2 text-slate-400 hover:text-[#5c33f6] hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Publishing Submit Button element node */}
            <button 
              disabled={!postContent.trim()}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                postContent.trim() 
                  ? 'bg-[#5c33f6] text-white hover:bg-[#4a24e3] active:scale-95 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              Publish Post
            </button>
          </div>

        </div>
      </main>

    </div>
  );
}