// import React from 'react'

// const connection = () => {
//   return (
//     <div>
//       <h1>Connection</h1>
//     </div>
//   )
// }

// export default connection

import { useState, useEffect } from 'react';
import { Menu, X, Users, UserCheck, Clock, Layers } from 'lucide-react';
import { assets, menuItemsData } from '../assets/assets.js';
import { connectionService } from '../services/connectionService.js';
import { socketService } from '../services/socketService';
import { useApp } from '../context/AppContext';

export default function Connections() {
  const { user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('followers');
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadConnectionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [followersRes, followingRes, connectionsRes, pendingRes] = await Promise.all([
        connectionService.getFollowers(),
        connectionService.getFollowing(),
        connectionService.getConnections(),
        connectionService.getPendingRequests()
      ]);

      setFollowers(followersRes?.followers || []);
      setFollowing(followingRes?.following || []);
      setConnections(connectionsRes?.connections || []);
      setPendingRequests(pendingRes?.requests || []);
    } catch (fetchError) {
      console.error('Error loading connection data:', fetchError);
      setError('Unable to load connection data. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      setIsLoading(true);
      await connectionService.unfollowUser(userId);
      setFollowing((prev) => prev.filter((item) => item._id?.toString() !== userId?.toString()));
      if (user?._id === userId) {
        setFollowers((prev) => prev.filter((item) => item._id?.toString() !== userId?.toString()));
      }
    } catch (unfollowError) {
      console.error('Error unfollowing user:', unfollowError);
      setError('Unable to unfollow user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConnectionData();
  }, []);

  useEffect(() => {
    const unsubscribeFollow = socketService.on('userFollowed', () => {
      loadConnectionData();
    });

    const unsubscribeUnfollow = socketService.on('userUnfollowed', () => {
      loadConnectionData();
    });

    return () => {
      unsubscribeFollow();
      unsubscribeUnfollow();
    };
  }, []);

  const getAvatar = (profile) => {
    if (profile?.profile_picture) return profile.profile_picture;
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';
  };

  const stats = [
    { label: 'Followers', count: followers.length, id: 'followers' },
    { label: 'Following', count: following.length, id: 'following' },
    { label: 'Pending', count: pendingRequests.length, id: 'pending' },
    { label: 'Connections', count: connections.length, id: 'connections' }
  ];

  const getActiveUsers = () => {
    if (activeTab === 'followers') return followers;
    if (activeTab === 'following') return following;
    if (activeTab === 'connections') return connections.map((item) => item.user || item);
    if (activeTab === 'pending') return pendingRequests.map((request) => request.userId || request.user || request);
    return [];
  };

  const activeUsers = getActiveUsers();

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      
      {/* 1. MOBILE ONLY MENU TRIGGER HEADER */}

      {/* 2. RESPONSIVE SIDEBAR MOBILE DRAWER PANEL */}
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
              const isConnectionsActive = item.label === 'Connections';
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isConnectionsActive ? 'bg-[#eef0ff] text-[#5c33f6]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <IconComponent className={`w-5 h-5 ${isConnectionsActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img src={getAvatar(user)} alt={user?.full_name || 'Profile'} className="w-10 h-10 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || 'Your profile'}</h4>
            <span className="text-xs text-slate-400 truncate block">@{user?.username || 'username'}</span>
          </div>
        </div>
      </div>

      {/* 3. MOBILE MENU BACKDROP */}
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />
      )}

      {/* 4. MAIN NETWORK DASHBOARD FEED CONTENT */}
      <main className="p-6 sm:p-8 md:p-12 max-w-5xl w-full mx-auto">
        
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Connections</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Manage your network and discover new connections</p>
        </header>

        {/* METRICS STATS COUNTER BLOCKS HOUSING PLATFORM */}
        {/* Swaps cleanly from 2 columns grid arrangement on phone interfaces into 4 crisp elements across desktop displays */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <button
              key={stat.id}
              onClick={() => setActiveTab(stat.id)}
              className={`p-5 rounded-2xl border text-center transition-all bg-white flex flex-col items-center justify-center ${
                activeTab === stat.id
                  ? 'border-[#5c33f6] ring-1 ring-[#5c33f6] shadow-md shadow-indigo-100/40'
                  : 'border-slate-200/70 hover:border-slate-300 shadow-sm'
              }`}
            >
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{stat.count}</span>
              <span className="text-xs font-semibold text-slate-400 mt-1">{stat.label}</span>
            </button>
          ))}
        </div>

        {/* HORIZONTAL PILL SUB-TAB ACTION CONTROLS BAR */}
        <div className="bg-white border border-slate-100 rounded-2xl p-2.5 mb-8 shadow-sm flex items-center gap-1 overflow-x-auto scrollbar-none w-full flex-wrap sm:flex-nowrap">
          {stats.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* MUTABLE CARDS LOOP PLATFORM CONTAINER */}
        {/* Switches automatically between single grid items array list on mobile viewports into 2 columns on layout monitors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeUsers.length === 0 ? (
            <div className="col-span-full rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500">
              {isLoading ? 'Loading connections…' : error || 'No connection data available yet.'}
            </div>
          ) : (
            activeUsers.map((connection) => (
              <div 
                key={connection._id || connection.connectionId}
                className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start space-x-4">
                  <img 
                    src={getAvatar(connection)} 
                    alt={connection.full_name} 
                    className="w-14 h-14 rounded-full bg-slate-100 object-cover border border-slate-100 flex-shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-800 text-base leading-snug truncate">
                          {connection.full_name}
                        </h3>
                        {connection.is_verified && (
                          <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                            Verified
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 truncate">@{connection.username}</span>
                    </div>
                    
                    <p className="text-xs text-slate-500 leading-relaxed pt-1 line-clamp-2 break-words">
                      {connection.bio || "Exploring life one step at a time. ✨"}
                    </p>
                  </div>
                </div>

                <div className="w-full mt-5 pt-4 border-t border-slate-50 space-y-2">
                  <button className="w-full bg-[#9333ea] hover:bg-[#a855f7] text-white font-bold py-2.5 px-4 rounded-xl text-xs tracking-wide shadow-sm transition-all text-center">
                    View Profile
                  </button>
                  {activeTab === 'following' && connection?._id && (
                    <button
                      type="button"
                      onClick={() => handleUnfollow(connection._id)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs tracking-wide transition-all"
                    >
                      Unfollow
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

      </main>

    </div>
  );
}