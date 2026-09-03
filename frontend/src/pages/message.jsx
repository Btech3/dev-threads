import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Menu, X, Search, Phone, Video, Info, Paperclip, Smile, Mic, Send, Plus, Check } from 'lucide-react';
import { assets, menuItemsData } from '../assets/assets.js';
import { messageService } from '../services/messageServices.js';
import { socketService } from '../services/socketService.js';
import { useApp } from '../context/AppContext';

export default function Message() {
  const { userId } = useParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useApp();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
    // If routed with a userId (from Discover), auto-select that conversation
    if (userId) {
      (async () => {
        try {
          const convs = await messageService.getConversations();
          const found = convs.find(c => (c.user && c.user._id === userId) || (c.recipient && c.recipient._id === userId) || (c.participant && c.participant._id === userId));
          if (found) {
            selectUser(found);
          } else {
            const userObj = await (await import('../services/userService.js')).userService.getUserById(userId);
            if (userObj) {
              setSelectedUser(userObj);
              const msgs = await messageService.getMessages(userId);
              setMessages(msgs.messages || []);
            }
          }
        } catch (err) {
          console.warn('Auto-select conversation error:', err.message || err);
        }
      })();
    }
  }, []);

  // Listen for new messages
  useEffect(() => {
    // Incoming messages
    const unsubMsg = socketService.on('messageReceived', (data) => {
      const senderId = typeof data.senderId === 'object' ? data.senderId?._id : data.senderId;
      if (selectedUser && senderId === (selectedUser._id || selectedUser.id)) {
        setMessages((prev) => [...prev, data.message || data]);
        scrollToBottom();
      }
    });

    // Typing indicator
    const unsubTyping = socketService.on('typing', (data) => {
      if (data?.from === (selectedUser?._id || selectedUser?.id)) {
        setIsTyping(!!data.typing);
      }
    });

    return () => {
      unsubMsg();
      unsubTyping();
    };
  }, [selectedUser]);

  const fetchConversations = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await messageService.getConversations();
      const convs = Array.isArray(response) ? response : (response.data || []);
      setConversations(convs);
      // Auto-select Sarah Jenkins if present or the first conversation
      if (!selectedUser) {
        const sarah = convs.find(c => (c.user && c.user.full_name === 'Sarah Jenkins') || (c.recipient && c.recipient.full_name === 'Sarah Jenkins') || (c.participant && c.participant.full_name === 'Sarah Jenkins'));
        if (sarah) selectUser(sarah);
        else if (convs[0]) selectUser(convs[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setErrorMessage('Unable to load conversations.');
    } finally {
      setIsLoading(false);
    }
  };

  

  const selectUser = async (conversation) => {
    const user = conversation.user || conversation.recipient || conversation.participant || conversation;
    if (!user) return;

    setSelectedUser(user);
    setIsLoading(true);
    setErrorMessage('');

    try {
      const msgs = await messageService.getMessages(user._id);
      setMessages(msgs.messages || msgs.data || []);
      // join a room for this conversation (if server supports it)
      if (socketService.isConnected()) {
        socketService.send('join-room', { roomId: `chat:${user._id}` });
      }
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
      setErrorMessage('Unable to load messages for this chat.');
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    try {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {}
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedUser) return;

    const tempId = `temp-${Date.now()}`;
    const outgoing = {
      _id: tempId,
      senderId: user?._id || user?.id,
      recipientId: selectedUser._id || selectedUser.id,
      content: inputMessage.trim(),
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    // Optimistic append
    setMessages((prev) => [...prev, outgoing]);
    setInputMessage('');
    scrollToBottom();

    // Simulate brief typing indicator on the other side
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1200);

    try {
      // If there are attachments, upload them first
      let mediaPayload = [];
      if (selectedFiles.length > 0) {
        try {
          const uploadResponse = await messageService.uploadMedia(selectedFiles);
          mediaPayload = uploadResponse.media || uploadResponse.data?.media || uploadResponse.mediaFiles || [];
        } catch (uErr) {
          console.error('Upload error:', uErr);
          setErrorMessage(uErr?.message || 'Failed to upload attachments');
          // mark temp message as failed
          setMessages((prev) => prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m));
          return;
        }
      }

      // If we recorded audio chunks, convert to blob and upload
      if (recordedChunksRef.current.length > 0) {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        try {
          const uploadResponse = await messageService.uploadMedia([new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })]);
          mediaPayload = mediaPayload.concat(uploadResponse.media || uploadResponse.data?.media || []);
        } catch (uErr) {
          console.error('Voice upload error:', uErr);
          setErrorMessage(uErr?.message || 'Failed to upload voice note');
          setMessages((prev) => prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m));
          return;
        }
        // clear recorded data
        recordedChunksRef.current = [];
      }

      const response = await messageService.sendMessage(selectedUser._id || selectedUser.id, outgoing.content, mediaPayload);
      const saved = response.data || response;
      // Replace temp message with saved message when available
      setMessages((prev) => prev.map(m => m._id === tempId ? (saved.message || saved) : m));

      // notify server via socket if connected (best-effort)
      if (socketService.isConnected()) {
        socketService.send('message:sent', { to: selectedUser._id || selectedUser.id, message: saved.message || saved });
      }
      scrollToBottom();
      // clear attachments and previews after successful send
      setSelectedFiles([]);
      setFilePreviews([]);
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage(error?.message || 'Could not send message.');
      // mark failed
      setMessages((prev) => prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m));
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const updated = [...selectedFiles, ...files].slice(0, 5);
    setSelectedFiles(updated);
    const previews = files.map(f => ({ id: `${f.name}-${f.size}`, url: URL.createObjectURL(f), name: f.name, type: f.type }));
    setFilePreviews(prev => [...prev, ...previews].slice(0,5));
  };

  const removeFileAt = (index) => {
    setSelectedFiles(prev => prev.filter((_,i) => i !== index));
    setFilePreviews(prev => prev.filter((_,i) => i !== index));
  };

  const toggleEmojiPicker = () => setShowEmojiPicker(v => !v);

  const addEmoji = (emoji) => {
    setInputMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return alert('Recording not supported');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordedChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Record start error', err);
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } catch (e) {
      console.error('Stop recording error', e);
    }
  };

  // Call / Video actions
  const initiateCall = (type) => {
    if (!selectedUser) return;
    socketService.send('call:request', { to: selectedUser._id || selectedUser.id, type });
    // show calling UI (simple alert for now)
    alert(`Calling ${selectedUser.full_name} (${type})`);
  };

  const getAvatar = (user) => {
    if (user?.profile_picture) return user.profile_picture;
    return "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200"; 
  };

  const filteredConversations = conversations.filter((conv) => {
    const participant = conv.user || conv.recipient || conv.participant || conv;
    const search = searchQuery.trim().toLowerCase();
    if (!search) return true;
    return [participant.full_name, participant.username, conv.lastMessage]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(search));
  });

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
            src={getAvatar(user)} 
            alt={user?.full_name || 'You'} 
            className="w-10 h-10 rounded-full bg-slate-200 object-cover"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate">{user?.full_name || 'You'}</h4>
            <span className="text-xs text-slate-400 truncate block">@{user?.username || 'me'}</span>
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
      <main className="p-6 sm:p-8 md:p-12 max-w-7xl w-full mx-auto bg-slate-50 min-h-screen">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Messages</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Talk to your friends and family</p>
        </header>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Nav */}
          <nav className="col-span-12 lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4 sticky top-6 h-[80vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src={assets.logo} alt="pingup" className="w-8 h-8" />
                <span className="font-bold text-lg text-slate-900">pingup</span>
              </div>
              <ul className="space-y-2">
                {menuItemsData.map((item) => (
                  <li key={item.label}>
                    <Link to={item.to} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${item.label === 'Messages' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <item.Icon className="w-5 h-5" />
                      <span className="text-sm">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <button className="w-full mb-4 bg-indigo-600 text-white rounded-full py-2 font-semibold">+ Create Post</button>
              <div className="flex items-center gap-3">
                <img src={getAvatar(user)} alt={user?.full_name || 'You'} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{user?.full_name || 'John Warren'}</div>
                  <div className="text-xs text-slate-400">@{user?.username || 'john_warren'}</div>
                </div>
                <button title="Logout" className="text-slate-400 hover:text-slate-600"> <X className="w-4 h-4" /> </button>
              </div>
            </div>
          </nav>

          {/* Conversations panel */}
          <aside className="col-span-12 lg:col-span-3">
            <div className="space-y-4">
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Messages</h2>
                  <button className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Plus className="w-4 h-4" /></button>
                </div>
                <Search className="absolute left-4 top-14 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-100"
                />
              </div>

              <div className="mt-4 overflow-y-auto max-h-[68vh] space-y-2">
                {isLoading ? (
                  <div className="text-center text-slate-500 py-6">Loading conversations...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center text-slate-500 py-6">{searchQuery.trim() ? 'No conversations match your search.' : 'No conversations yet.'}</div>
                ) : (
                  filteredConversations.map((conv) => {
                    const participant = conv.user || conv.recipient || conv.participant || conv;
                    const isActive = selectedUser && (selectedUser._id === (participant._id || participant.id));
                    return (
                      <button key={(participant._id||participant.id)} onClick={() => selectUser(conv)} className={`w-full text-left flex items-center gap-3 p-3 rounded-xl ${isActive ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50'}`}>
                        <div className="relative">
                          <img src={getAvatar(participant)} alt={participant.full_name} className="w-12 h-12 rounded-full object-cover" />
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-400 border-2 border-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <div className="font-semibold text-slate-900 truncate">{participant.full_name}</div>
                            <div className="text-xs text-slate-400">{conv.lastActivity ? new Date(conv.lastActivity).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ''}</div>
                          </div>
                          <div className="text-xs text-slate-500 truncate mt-1">{conv.lastMessage || participant.lastMessage || ''}</div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </aside>

          {/* Middle: thread */}
          <section className="col-span-12 lg:col-span-5">
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden h-full flex flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <img src={getAvatar(selectedUser)} alt={selectedUser?.full_name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold">{selectedUser?.full_name || 'Select a chat'}</div>
                    <div className="text-xs text-green-500">{selectedUser ? 'Active now' : ''}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button className="p-2 rounded-lg hover:bg-slate-50"><Phone className="w-4 h-4" /></button>
                  <button className="p-2 rounded-lg hover:bg-slate-50"><Video className="w-4 h-4" /></button>
                  <button onClick={() => setShowRightPanel(!showRightPanel)} className="p-2 rounded-lg hover:bg-slate-50"><Info className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC]">
                {/* Date divider */}
                <div className="text-xs text-slate-400 text-center">TODAY</div>

                {messages.length === 0 && (
                  <div className="text-center text-slate-500 py-8">No messages yet. Say hello 👋</div>
                )}

                {messages.map((msg) => {
                  const isMe = msg.senderId?._id === user?._id || msg.senderId === user?._id || msg.senderId === (user?._id || user?.id);
                  return (
                    <div key={msg._id || Math.random()} className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && <img src={getAvatar(selectedUser)} alt="avatar" className="w-8 h-8 rounded-full mr-2" />}
                      <div className={`rounded-2xl p-3 max-w-[68%] ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        <div className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'} flex items-center gap-2 justify-end`}>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                          {isMe && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                      {isMe && <div className="w-6" />}
                    </div>
                  );
                })}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2">
                    <img src={getAvatar(selectedUser)} alt="avatar" className="w-8 h-8 rounded-full" />
                    <div className="bg-white p-2 rounded-2xl border border-slate-100">
                      <div className="text-xs text-slate-500">{selectedUser?.full_name} is typing</div>
                      <div className="flex items-end gap-1 mt-1">
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-150" />
                        <span className="w-2 h-2 bg-slate-300 rounded-full animate-pulse delay-300" />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-100 p-4 bg-white">
                <div className="space-y-2">
                  {/* Previews */}
                  {filePreviews.length > 0 && (
                    <div className="flex gap-2 mb-2">
                      {filePreviews.map((f, i) => (
                        <div key={f.id} className="relative w-20 h-20 rounded-md overflow-hidden bg-slate-100">
                          {f.type.startsWith('image/') ? <img src={f.url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">{f.name}</div>}
                          <button onClick={() => removeFileAt(i)} className="absolute top-1 right-1 bg-white rounded-full p-1 text-xs">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-slate-50"><Paperclip className="w-5 h-5 text-slate-500" /></button>
                    <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" multiple onChange={handleFileSelect} className="hidden" />

                    <div className="relative">
                      <button onClick={toggleEmojiPicker} className="p-2 rounded-full hover:bg-slate-50"><Smile className="w-5 h-5 text-slate-500" /></button>
                      {showEmojiPicker && (
                        <div className="absolute left-0 bottom-12 bg-white border rounded-md p-2 shadow">
                          {['😀','😂','😍','😮','😢','👍','🎉'].map(e => (
                            <button key={e} onClick={() => addEmoji(e)} className="p-1 text-lg">{e}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none"
                      disabled={!selectedUser}
                    />

                    <button onClick={sendMessage} className="rounded-full bg-indigo-600 p-3 text-white disabled:opacity-50" disabled={!selectedUser || (!inputMessage.trim() && selectedFiles.length===0 && recordedChunksRef.current.length===0)}>
                      <Send className="w-4 h-4" />
                    </button>

                    {!isRecording ? (
                      <button onClick={startRecording} className="p-2 rounded-full hover:bg-slate-50"><Mic className="w-5 h-5 text-slate-500" /></button>
                    ) : (
                      <button onClick={stopRecording} className="p-2 rounded-full bg-rose-500 text-white"><Mic className="w-5 h-5" /></button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right details */}
          <aside className={`${showRightPanel ? 'col-span-12 lg:col-span-2' : 'hidden'}`}>
            <div className="bg-white border border-slate-100 rounded-2xl p-6 space-y-4 sticky top-6">
              {selectedUser ? (
                <>
                  <div className="flex flex-col items-center">
                    <img src={getAvatar(selectedUser)} alt={selectedUser.full_name} className="w-24 h-24 rounded-full object-cover mb-3" />
                    <h3 className="font-semibold text-slate-900">{selectedUser.full_name}</h3>
                    <div className="text-xs text-green-500">Active now</div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Contact Info</h4>
                    <div className="text-sm text-slate-600">{selectedUser.email || 'sarah.j@example.com'}</div>
                    <div className="text-sm text-slate-600">{selectedUser.location || 'London, UK'}</div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Shared Media</h4>
                      <a href="#" className="text-xs text-indigo-600">View All</a>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {(messages || []).slice(-4).map((m, i) => (
                        <div key={i} className="w-full h-24 bg-slate-100 rounded-md overflow-hidden">
                          {m.media?.[0] ? (
                            m.media[0].type === 'video' ? <video src={m.media[0].url} className="w-full h-full object-cover" /> : <img src={m.media[0].url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No preview</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold mb-2">Chat Settings</h4>
                    <ul className="space-y-2 text-sm text-slate-700">
                      <li className="flex items-center justify-between"><span>Mute Notifications</span><input type="checkbox" /></li>
                      <li className="flex items-center justify-between"><span>Search in Conversation</span><button className="text-indigo-600 text-xs">Open</button></li>
                      <li className="flex items-center justify-between text-rose-600"><span>Block Contact</span><button className="text-rose-600 text-xs">Block</button></li>
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-slate-500">Select a user to see profile details.</div>
              )}
            </div>
          </aside>
        </div>
      </main>

    
    </div>
  );
}