import { useState } from 'react';
import { Menu, X, UserPlus, Check, MessageSquare, Search } from 'lucide-react'; // Essential UI icons
import { 
  assets, 
  menuItemsData, 
  dummyUserData, 
  dummyConnectionsData 
} from '../assets/assets.js'; 

export default function Discover() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fallback function to extract profile pictures smoothly
  const getAvatar = (user) => {
    if (user.profile_picture) return user.profile_picture;
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"; 
  };

  // Optional: Filter users if you type in the search bar
  const filteredUsers = dummyConnectionsData.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.bio && user.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      
      {/* 1. MOBILE-ONLY TOP HEADER BAR */}
      {/* Displays absolutely nothing except the clean right-aligned hamburger on small viewports */}

      {/* 2. WORKING NAVIGATION DRAWER (Mobile Overlay Panel) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 h-full transform transition-transform duration-300 ease-in-out md:hidden
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="space-y-6">
          {/* Drawer Top Branding Row */}
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={assets.logo} alt="Logo" className="h-6 w-auto" />
              <span className="text-xl font-bold text-[#5c33f6]">Group</span>
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links mapping from menuItemsData */}
          <nav className="space-y-1">
            {menuItemsData.map((item, index) => {
              const IconComponent = item.Icon;
              const isDiscoverActive = item.label === 'Discover'; // Highlights active state
              
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isDiscoverActive
                      ? 'bg-[#eef0ff] text-[#5c33f6]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isDiscoverActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Current Active Account Profile Badge */}
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

      {/* 3. SEMI-TRANSPARENT BACKDROP SHADE */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* 4. DISCOVER MAIN WORKSPACE */}
      <main className="p-6 sm:p-8 md:p-12 max-w-5xl w-full mx-auto">
        
        {/* Workspace Greeting Meta Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Discover People</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Connect with amazing people and grow your network</p>
        </header>

        {/* Responsive Search Field Bar */}
        <div className="mb-8 relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </span>
          <input 
            type="text" 
            placeholder="Search people by name, username, bio, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5c33f6] focus:ring-1 focus:ring-[#5c33f6] shadow-sm transition-all"
          />
        </div>

        {/* GRID LAYOUT: Adapts cleanly from 1 column on mobile to 3 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            // Check if user is the dummy current user to toggle follow / following buttons
            const isCurrentUser = user._id === dummyUserData._id;

            return (
              <div 
                key={user._id}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center justify-between"
              >
                {/* Profile Picture and Identity Card Top */}
                <div className="flex flex-col items-center w-full">
                  <div className="relative mb-4">
                    <img 
                      src={getAvatar(user)} 
                      alt={user.full_name} 
                      className="w-20 h-20 rounded-full bg-slate-100 object-cover border-2 border-white shadow-sm"
                    />
                  </div>

                  <div className="flex items-center space-x-1 justify-center max-w-full">
                    <h3 className="font-bold text-slate-800 text-base leading-snug truncate">
                      {user.full_name}
                    </h3>
                    {user.is_verified && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 truncate block mt-0.5">@{user.username}</span>

                  {/* Description Bio text string */}
                  <p className="text-xs text-slate-500 leading-relaxed mt-3 whitespace-pre-line break-words line-clamp-3 w-full">
                    {user.bio || "No profile bio description supplied yet."}
                  </p>
                </div>

                {/* Badges & Button Utility Deck Base */}
                <div className="w-full mt-5 pt-4 border-t border-slate-50 space-y-4">
                  
                  {/* Location and Metadata Row pills */}
                  <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-medium text-slate-500">
                    <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      📍 {user.location || "Earth"}
                    </span>
                    <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      {user.followers?.length || 0} Followers
                    </span>
                  </div>

                  {/* Primary Grid Row Context Buttons */}
                  <div className="flex items-center gap-2 w-full">
                    {isCurrentUser ? (
                      // Display dynamic "Follow" status for profile cards
                      <button className="flex-1 bg-[#9333ea] hover:bg-[#a855f7] text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all">
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </button>
                    ) : (
                      // Display dynamic "Following" status for matched connections
                      <button className="flex-1 bg-[#9333ea]/10 text-[#9333ea] border border-transparent font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all">
                        <Check className="w-3.5 h-3.5" />
                        <span>Following</span>
                      </button>
                    )}

                    {/* Chat messaging auxiliary button */}
                    <button className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200/60 flex items-center justify-center aspect-square">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      </main>

    </div>
  );
}