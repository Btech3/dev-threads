 import { useState } from 'react';
import { Menu, X, Heart, MessageCircle, Share2, Bookmark } from 'lucide-react';
import { 
  assets, 
  menuItemsData, 
  dummyUserData, 
  dummyStoriesData,
  dummyPostsData 
} from '../assets/assets.js';

export default function Feed() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fallback function to extract profile pictures smoothly
  const getAvatar = (user) => {
    if (user?.profile_picture) return user.profile_picture;
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"; 
  };

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
              const isFeedActive = item.label === 'Feed'; // Highlights Feed active view
              
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isFeedActive
                      ? 'bg-[#eef0ff] text-[#5c33f6]'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
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
          <img src={getAvatar(dummyUserData)} alt="User Profile" className="w-10 h-10 rounded-full object-cover" />
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

      {/* 4. MAIN FEED CANVAS */}
      <main className="p-4 sm:p-8 md:p-12 max-w-4xl w-full mx-auto space-y-8">
        
        {/* STORIES SCROLL VIEW PANEL */}
        {/* Hides browser scrollbars cleanly, layout flows smoothly horizontally */}
        <div className="w-full">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">Stories</h2>
          <div className="flex space-x-4 overflow-x-auto pb-3 scrollbar-none snap-x touch-pan-x w-full">
            {dummyStoriesData.map((story) => (
              <div 
                key={story._id}
                className="flex-shrink-0 w-24 h-36 sm:w-28 sm:h-40 rounded-2xl overflow-hidden relative shadow-sm border border-slate-100 bg-slate-900 snap-start group cursor-pointer"
              >
                {/* Media rendering conditional handles background previews for texts, images, or videos */}
                {story.media_type === 'image' && (
                  <img src={story.media_url} alt="Story content" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                )}
                {story.media_type === 'video' && (
                  <video src={story.media_url} className="w-full h-full object-cover" muted loop playsInline />
                )}
                {story.media_type === 'text' && (
                  <div 
                    style={{ backgroundColor: story.background_color || '#4f46e5' }}
                    className="w-full h-full p-2 flex items-center justify-center text-[8px] font-medium text-white leading-normal text-center overflow-hidden whitespace-normal select-none"
                  >
                    <p className="line-clamp-5">{story.content}</p>
                  </div>
                )}
                
                {/* Micro User Profile Badge on top of the story item */}
                <div className="absolute top-2 left-2 p-0.5 bg-white rounded-full shadow-sm">
                  <img 
                    src={getAvatar(story.user)} 
                    alt={story.user?.full_name} 
                    className="w-6 h-6 rounded-full object-cover"
                  />
                </div>

                {/* Micro User Bottom Label overlay gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2 pt-6">
                  <span className="text-[10px] font-bold text-white truncate block">
                    {story.user?.full_name || "User"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CORE TIMELINE POST FEED */}
        <div className="space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Recent Posts</h2>
          
          {dummyPostsData.map((post) => (
            <div 
              key={post._id}
              className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-4"
            >
              {/* Card Header Top Block metadata */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={getAvatar(post.user)} 
                    alt={post.user?.full_name} 
                    className="w-10 h-10 rounded-full bg-slate-100 object-cover flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-sm font-bold text-slate-800 leading-tight truncate max-w-[140px] sm:max-w-none">
                        {post.user?.full_name}
                      </h3>
                      {post.user?.is_verified && (
                        <span className="text-[9px] bg-blue-50 text-blue-600 px-1 py-0.5 rounded-full font-bold">✓</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 block mt-0.5">@{post.user?.username}</span>
                  </div>
                </div>

                <span className="text-[11px] font-semibold text-slate-400">
                  {new Date(post.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              {/* Text Description Segment Content */}
              {post.content && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words whitespace-pre-wrap">
                  {post.content}
                </p>
              )}

              {/* Post Attached Media Graphics Container */}
              {post.image_urls && post.image_urls.length > 0 && (
                <div className="rounded-xl overflow-hidden max-h-96 sm:max-h-[420px] w-full border border-slate-50 bg-slate-50">
                  <img 
                    src={post.image_urls[0]} 
                    alt="Timeline content graphic" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Interactive Engagement Analytics Deck Bar */}
              <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-slate-400">
                <div className="flex items-center space-x-6">
                  {/* Likes button tool */}
                  <button className="flex items-center space-x-1.5 hover:text-rose-500 transition-colors group text-xs font-semibold">
                    <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>{post.likes_count?.length || 0}</span>
                  </button>

                  {/* Comment trigger dummy link */}
                  <button className="flex items-center space-x-1.5 hover:text-[#5c33f6] transition-colors group text-xs font-semibold">
                    <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>0</span>
                  </button>
                </div>

                {/* Right side utility nodes deck */}
                <div className="flex items-center space-x-4">
                  <button className="hover:text-slate-700 transition-colors">
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button className="hover:text-slate-700 transition-colors">
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </main>

    </div>
  );
}