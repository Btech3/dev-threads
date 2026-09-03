import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, UserPlus, Check, MessageSquare, Search } from 'lucide-react';
import { assets, menuItemsData } from '../assets/assets.js';
import { userService } from '../services/userService.js';
import { useApp } from '../context/AppContext';

export default function Discover() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getUserSuggestions(12);
      setSuggestions(res.suggestions || []);
    } catch (err) {
      console.error('get suggestions failed', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) return fetchSuggestions();
    if (q.trim().length < 2) return;

    setIsLoading(true);
    try {
      const res = await userService.searchUsers(q.trim());
      setSuggestions(res.users || []);
    } catch (err) {
      console.error('search failed', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatar = (user) => user?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';

  const filteredUsers = suggestions;

  const content = isLoading ? (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500">Loading users...</div>
  ) : filteredUsers.length === 0 ? (
    <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500">No users found. Try a different search or refresh the page.</div>
  ) : (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredUsers.map((userItem) => {
        const isCurrentUser = userItem._id === user?._id;
        return (
          <div key={userItem._id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center justify-between">
            <div className="flex flex-col items-center w-full">
              <div className="relative mb-4">
                <img src={getAvatar(userItem)} alt={userItem.full_name} className="w-20 h-20 rounded-full bg-slate-100 object-cover border-2 border-white shadow-sm" />
              </div>

              <div className="flex items-center space-x-1 justify-center max-w-full">
                <h3 className="font-bold text-slate-800 text-base leading-snug truncate">{userItem.full_name}</h3>
                {userItem.is_verified && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">Verified</span>}
              </div>

              <span className="text-xs text-slate-400 truncate block mt-0.5">@{userItem.username}</span>
              <p className="text-xs text-slate-500 leading-relaxed mt-3 whitespace-pre-line break-words line-clamp-3 w-full">{userItem.bio || 'No profile bio description supplied yet.'}</p>
            </div>
            <div className="w-full mt-5 pt-4 border-t border-slate-50 space-y-4">
              <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] font-medium text-slate-500">
                <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">📍 {userItem.location || 'Earth'}</span>
                <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{userItem.followers?.length || 0} Followers</span>
              </div>

              <div className="flex items-center gap-2 w-full">
                {isCurrentUser ? (
                  <button className="flex-1 bg-[#9333ea] hover:bg-[#a855f7] text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Profile</span>
                  </button>
                ) : (
                  <button className="flex-1 bg-[#9333ea]/10 text-[#9333ea] border border-transparent font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all">
                    <Check className="w-3.5 h-3.5" />
                    <span>Following</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate(`/message/${userItem._id}`)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors border border-slate-200/60 flex items-center justify-center aspect-square"
                  aria-label={`Message ${userItem.full_name}`}
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      {/* 1. MOBILE-ONLY TOP HEADER BAR */}

      {/* 2. WORKING NAVIGATION DRAWER (Mobile Overlay Panel) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 h-full transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-6">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={assets.logo} alt="Logo" className="h-6 w-auto" />
              <span className="text-xl font-bold text-[#5c33f6]">Group</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Links mapping from menuItemsData */}
          <nav className="space-y-1">
            {menuItemsData.map((item, index) => {
              const IconComponent = item.Icon;
              const isDiscoverActive = item.label === 'Discover';
              return (
                <a key={index} href={item.to} onClick={() => setIsMobileMenuOpen(false)} className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isDiscoverActive ? 'bg-[#eef0ff] text-[#5c33f6]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
                  <IconComponent className={`w-5 h-5 ${isDiscoverActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Current Active Account Profile Badge */}
        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img src={getAvatar(user)} alt={user?.full_name || 'Profile'} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate">{user?.full_name || 'Your profile'}</h4>
            <span className="text-xs text-slate-400 truncate block">@{user?.username || 'username'}</span>
          </div>
        </div>
      </div>

      {/* 3. SEMI-TRANSPARENT BACKDROP SHADE */}
      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />}

      {/* 4. DISCOVER MAIN WORKSPACE */}
      <main className="p-6 sm:p-8 md:p-12 max-w-5xl w-full mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Discover People</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Connect with amazing people and grow your network</p>
        </header>

        <div className="mb-8 relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400"><Search className="w-5 h-5" /></span>
          <input type="text" placeholder="Search people by name, username, bio, or location..." value={searchQuery} onChange={handleSearchChange} className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#5c33f6] focus:ring-1 focus:ring-[#5c33f6] shadow-sm transition-all" />
        </div>

        {content}

      </main>

    </div>
  );
}
