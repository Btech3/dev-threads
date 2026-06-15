// import React from 'react'

// const profile = () => {
//   return (
//     <div>
//       <h1>Profile</h1>
//     </div>
//   )
// }

// export default profile


import { useState } from 'react';
import { Menu, X, MapPin, Calendar, Link as LinkIcon } from 'lucide-react';
import { 
  assets, 
  menuItemsData, 
  dummyUserData, 
  dummyPostsData 
} from '../assets/assets.js';

export default function Profile() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper functions for profile/cover fallbacks
  const getAvatar = (user) => {
    if (user.profile_picture) return user.profile_picture;
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"; 
  };

  const getCover = (user) => {
    if (user.cover_photo) return user.cover_photo;
    // Solid background color fallback if import string is empty
    return "https://images.unsplash.com/photo-170811/pexels-photo-170811.jpeg";
  };

  // Formatting date string nicely
  const joinDate = dummyUserData.createdAt 
    ? new Date(dummyUserData.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : "July 2025";

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      
      {/* 1. MOBILE-ONLY TOP HEADER BAR */}
      {/* Hidden on desktop. Displays absolute right-aligned hamburger to control drawer menu */}

      {/* 2. WORKING NAVIGATION DRAWER (Mobile Overlay Panel) */}
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
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1">
            {menuItemsData.map((item, index) => {
              const IconComponent = item.Icon;
              const isProfileActive = item.label === 'Profile';
              
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isProfileActive
                      ? 'bg-[#eef0ff] text-[#5c33f6]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isProfileActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img src={getAvatar(dummyUserData)} alt="Profile Avatar" className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{dummyUserData.full_name}</h4>
            <span className="text-xs text-slate-400 truncate block">@{dummyUserData.username}</span>
          </div>
        </div>
      </div>

      {/* 3. MOBILE MENU BACKGROUND BLUR OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* 4. MAIN PROFILE CONTENT CANVAS */}
      <main className="w-full mx-auto max-w-4xl pb-16">
        
        {/* HERO COVER BANNER IMAGE FRAME */}
        <div className="relative h-44 sm:h-60 w-full overflow-hidden bg-slate-200">
          <img 
            src={getCover(dummyUserData)} 
            alt="Profile Cover" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* PROFILE META IDENTITY HEADER INFO BLOCK */}
        <div className="px-4 sm:px-8 relative -mt-16 sm:-mt-20 mb-6 flex flex-col space-y-4">
          
          {/* Avatar and Edit Button Alignment Deck */}
          <div className="flex items-end justify-between w-full">
            <div className="relative">
              <img 
                src={getAvatar(dummyUserData)} 
                alt={dummyUserData.full_name} 
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white bg-slate-100 object-cover shadow-sm"
              />
            </div>
            
            <button className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95">
              Edit Profile
            </button>
          </div>

          {/* User Metadata Profile Header Content */}
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                {dummyUserData.full_name}
              </h1>
              {dummyUserData.is_verified && (
                <span className="text-[10px] sm:text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
                  Verified
                </span>
              )}
            </div>
            <span className="text-xs sm:text-sm text-slate-400 block">@{dummyUserData.username}</span>
          </div>

          {/* Bio Text area description parsing block */}
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl whitespace-pre-line break-words pt-1">
            {dummyUserData.bio || "No profile bio description supplied yet."}
          </p>

          {/* Meta Indicators Row pills */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-medium text-slate-400 pt-1">
            <div className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{dummyUserData.location || "Earth"}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {joinDate}</span>
            </div>
          </div>

          {/* Network Follow Counts Row Tracker */}
          <div className="flex items-center space-x-6 text-xs sm:text-sm pt-2">
            <div className="flex items-center space-x-1">
              <span className="font-bold text-slate-900">{dummyUserData.following?.length || 0}</span>
              <span className="text-slate-400 font-medium">Following</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="font-bold text-slate-900">{dummyUserData.followers?.length || 0}</span>
              <span className="text-slate-400 font-medium">Followers</span>
            </div>
          </div>

        </div>

        {/* TABS SELECTOR STRIP BAR HEADER */}
        <div className="border-b border-slate-100 px-4 sm:px-8 flex items-center space-x-6 mb-6">
          <button className="border-b-2 border-[#5c33f6] pb-3 text-sm font-bold text-[#5c33f6]">
            Posts
          </button>
          <button className="pb-3 text-sm font-bold text-slate-400 hover:text-slate-600">
            Media
          </button>
          <button className="pb-3 text-sm font-bold text-slate-400 hover:text-slate-600">
            Likes
          </button>
        </div>

        {/* USER TIMELINE POSTS DATA CARDS STACK FEED */}
        <div className="px-4 sm:px-8 space-y-4">
          {dummyPostsData.map((post) => (
            <div 
              key={post._id}
              className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              {/* Card Meta Top Row */}
              <div className="flex items-center space-x-3">
                <img 
                  src={getAvatar(dummyUserData)} 
                  alt={dummyUserData.full_name} 
                  className="w-10 h-10 rounded-full object-cover bg-slate-100"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">{dummyUserData.full_name}</h4>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Text Body Rendering Block */}
              {post.content && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                  {post.content}
                </p>
              )}

              {/* Image Previews Mapping inside Feed row items */}
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="rounded-xl overflow-hidden max-h-96 w-full border border-slate-100 bg-slate-50">
                  <img 
                    src={post.image_urls[0]} 
                    alt="Timeline content graphic" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

      </main>

    </div>
  );
}