// import React from 'react'

// const chatbox = () => {
//   return (
//     <div>
//       <h1>Chat Box</h1>
//     </div>
//   )
// }

// export default chatbox;


import { useState } from 'react';
import { Menu, X, Image as ImageIcon, Send } from 'lucide-react';
import { 
  assets, 
  menuItemsData, 
  dummyUserData, 
  dummyMessagesData 
} from '../assets/assets.js';

export default function Chatbox() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [typedMessage, setTypedMessage] = useState('');

  // Fallback function to extract profile pictures smoothly
  const getAvatar = (user) => {
    if (user.profile_picture) return user.profile_picture;
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"; 
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative flex flex-col justify-between">
      
      {/* 1. MOBILE-ONLY TOP HEADER BAR */}
      {/* Matches image_2223bd.png by displaying the interlocutor metadata or current context cleanly, with the right-aligned hamburger */}
      <header className="md:hidden bg-white border-b border-slate-100 px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <img 
            src={getAvatar(dummyUserData)} 
            alt="Active Chat" 
            className="w-9 h-9 rounded-full object-cover"
          />
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">John Warren</h3>
            <span className="text-[11px] text-slate-400 block mt-0.5">@john_warren</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-slate-700 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

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

        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img src={getAvatar(dummyUserData)} alt="User" className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{dummyUserData.full_name}</h4>
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

      {/* 4. CHAT BOX SCROLL VIEW WINDOW CONTAINER */}
      {/* Takes full height layout canvas minus header/footer areas */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-4xl w-full mx-auto flex flex-col space-y-6 overflow-y-auto pb-24">
        {dummyMessagesData.map((message) => {
          // Check sender matching to float content right (current user) or left (incoming)
          const isMe = message.from_user_id === dummyUserData._id;

          return (
            <div 
              key={message._id}
              className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
            >
              {/* Media Image Attachments Rendering Logic */}
              {message.message_type === 'image' && (
                <div className="mb-1.5 rounded-2xl overflow-hidden shadow-sm border border-slate-100 max-w-xs sm:max-w-md bg-white p-1">
                  <img 
                    src={message.media_url} 
                    alt="Chat attachment" 
                    className="w-full h-auto object-cover max-h-60 sm:max-h-72 rounded-xl"
                  />
                </div>
              )}

              {/* Text Message Bubble Row Layout */}
              {message.text && (
                <div className={`px-4 py-2.5 rounded-2xl text-sm font-medium shadow-sm break-words leading-relaxed ${
                  isMe 
                    ? 'bg-[#5c33f6] text-white rounded-br-none' 
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                }`}>
                  {message.text}
                </div>
              )}

              {/* Timestamp Indicator Meta Block */}
              <span className="text-[10px] font-semibold text-slate-400 mt-1 px-1">
                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </main>

      {/* 5. RESPONSIVE FIXED CHAT FIELD INPUT FOOTER BAR */}
      <footer className="fixed bottom-0 inset-x-0 md:absolute bg-[#f8fafc]/80 backdrop-blur-md py-4 px-4 sm:px-6 md:px-8 border-t border-slate-100/60 z-30">
        <div className="max-w-4xl mx-auto w-full relative flex items-center">
          
          {/* File Attachment Action Button Grid Link */}
          <button className="absolute left-3 p-2 text-slate-400 hover:text-[#5c33f6] hover:bg-slate-100 rounded-xl transition-all flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Primary Text Field Input Area Box */}
          <input 
            type="text"
            placeholder="Type a message..."
            value={typedMessage}
            onChange={(e) => setTypedMessage(e.target.value)}
            className="w-full bg-white border border-slate-200/80 rounded-2xl py-3.5 pl-14 pr-14 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5c33f6] focus:ring-1 focus:ring-[#5c33f6] shadow-sm transition-all"
          />

          {/* Sending Button Trigger Element Node */}
          <button 
            disabled={!typedMessage.trim()}
            className={`absolute right-3 p-2 rounded-xl transition-all flex items-center justify-center ${
              typedMessage.trim()
                ? 'bg-[#5c33f6] text-white hover:bg-[#4a24e3] active:scale-95'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>

        </div>
      </footer>

    </div>
  );
}