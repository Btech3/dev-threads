// import React from 'react'

// const chatbox = () => {
//   return (
//     <div>
//       <h1>Chat Box</h1>
//     </div>
//   )
// }

// export default chatbox;


import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu, X, Image as ImageIcon, Send, Paperclip } from 'lucide-react';
import { assets, menuItemsData } from '../assets/assets.js';
import { messageService } from '../services/messageServices.js';
import { socketService } from '../services/socketService.js';
import { userService } from '../services/userService.js';
import { useApp } from '../context/AppContext';

export default function Chatbox() {
  const navigate = useNavigate();
  const { userId: recipientId } = useParams();
  const { user } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [recipient, setRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (recipientId) {
      loadConversation(recipientId);
    }
  }, [recipientId]);

  useEffect(() => {
    const unsubscribe = socketService.on('messageReceived', (data) => {
      if (!data || !data.message) return;
      const incoming = data.message;
      const senderId = typeof data.senderId === 'object' ? data.senderId._id : data.senderId;
      if (senderId === recipientId) {
        setMessages((prev) => [...prev, incoming]);
      }
    });

    return unsubscribe;
  }, [recipientId]);

  const loadConversation = async (targetUserId) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [profileData, conversationData] = await Promise.all([
        userService.getUserById(targetUserId),
        messageService.getMessages(targetUserId)
      ]);
      setRecipient(profileData);
      setMessages(conversationData.messages || []);
    } catch (error) {
      console.error('Error loading conversation:', error);
      setErrorMessage('Unable to load the chat.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    if (selectedFiles.length + files.length > 5) {
      setErrorMessage('Use up to 5 attachments only');
      return;
    }

    const updatedFiles = [...selectedFiles, ...files];
    setSelectedFiles(updatedFiles);
    setErrorMessage('');

    const previews = files.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name
    }));
    setFilePreviews((prev) => [...prev, ...previews]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if ((!typedMessage.trim() && selectedFiles.length === 0) || !recipientId) return;
    setIsLoading(true);
    setErrorMessage('');

    try {
      let mediaPayload = [];
      if (selectedFiles.length > 0) {
        const uploadResponse = await messageService.uploadMedia(selectedFiles);
        mediaPayload = uploadResponse.media || [];
      }

      const response = await messageService.sendMessage(recipientId, typedMessage.trim(), mediaPayload);
      const newMessage = response.data || response;
      setMessages((prev) => [...prev, newMessage]);
      setTypedMessage('');
      setSelectedFiles([]);
      setFilePreviews([]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      setErrorMessage('Message send failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvatar = (person) => {
    if (person?.profile_picture) return person.profile_picture;
    return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200';
  };

  const formatMessageTimestamp = (dateValue) => {
    if (!dateValue) return 'Just now';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dayLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return isToday ? time : `${dayLabel} • ${time}`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans antialiased text-slate-800 w-full relative">
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed top-4 left-4 z-50 p-2 text-slate-600 hover:text-slate-800 md:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 flex flex-col justify-between p-4 h-full transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
              const isActive = item.label === 'Messages';
              return (
                <a
                  key={index}
                  href={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-[#eef0ff] text-[#5c33f6]' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                >
                  <IconComponent className={`w-5 h-5 ${isActive ? 'text-[#5c33f6]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center space-x-3">
          <img src={getAvatar(user)} alt={user?.full_name || 'You'} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-800 leading-tight truncate">{user?.full_name || 'You'}</h4>
            <span className="text-xs text-slate-400 truncate block">@{user?.username || 'me'}</span>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />}

      <main className="p-6 sm:p-8 md:p-12 max-w-5xl w-full mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Chat</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Real-time messages with text, images, and videos</p>
        </header>

        {!recipient ? (
          <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center text-slate-500">
            {isLoading ? 'Loading chat...' : errorMessage || 'Select a chat to start messaging.'}
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 border-b border-slate-100 p-4">
              <button onClick={() => navigate('/message')} className="text-slate-400 hover:text-slate-600">Back</button>
              <img src={getAvatar(recipient)} alt={recipient.full_name} className="w-12 h-12 rounded-full object-cover bg-slate-100" />
              <div>
                <h2 className="font-semibold text-slate-900">{recipient.full_name}</h2>
                <p className="text-xs text-slate-500">@{recipient.username}</p>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-[#f8fbff]">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
                  No messages yet. Start the conversation.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId?._id === user?._id;
                  const mediaItems = Array.isArray(msg.media) ? msg.media : [];
                  return (
                    <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`rounded-3xl p-3 max-w-[80%] space-y-2 ${isMe ? 'bg-[#5c33f6] text-white' : 'bg-white text-slate-900 border border-slate-200'}`}>
                        {mediaItems.length > 0 && (
                          <div className="grid gap-3">
                            {mediaItems.map((mediaItem, index) => {
                              const mediaUrl = mediaItem.url || mediaItem.mediaUrl || mediaItem.fileUrl;
                              if (!mediaUrl) return null;
                              if (mediaItem.type === 'video' || mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
                                return <video key={`${mediaUrl}-${index}`} src={mediaUrl} controls className="w-full h-auto" />;
                              }
                              if (mediaItem.type === 'audio' || mediaUrl.match(/\.(mp3|wav|m4a|aac|ogg)$/i)) {
                                return <audio key={`${mediaUrl}-${index}`} src={mediaUrl} controls className="w-full" />;
                              }
                              if (mediaItem.type === 'document' || mediaUrl.match(/\.(pdf|doc|docx|txt)$/i)) {
                                return (
                                  <a key={`${mediaUrl}-${index}`} href={mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                                    <Paperclip className="w-3.5 h-3.5" />
                                    Document attachment
                                  </a>
                                );
                              }
                              return <img key={`${mediaUrl}-${index}`} src={mediaUrl} alt={mediaItem.type} className="w-full h-auto object-cover" />;
                            })}
                          </div>
                        )}
                        {msg.content && <p className="break-words whitespace-pre-wrap">{msg.content}</p>}
                        <div className="text-[10px] text-right opacity-80">
                          {formatMessageTimestamp(msg.createdAt)}
            <div className="border-t border-slate-100 p-4">
              {errorMessage && <p className="text-xs text-rose-500 mb-3">{errorMessage}</p>}
              <div className="space-y-3">
                {filePreviews.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filePreviews.map((file, index) => (
                      <div key={file.id} className="group relative rounded-3xl overflow-hidden border border-slate-200 bg-white">
                        {file.type.startsWith('image/') ? (
                          <img src={file.url} alt={file.name} className="w-full h-40 object-cover" />
                        ) : file.type.startsWith('video/') ? (
                          <video src={file.url} controls className="w-full h-40 object-cover" />
                        ) : (
                          <div className="flex h-40 items-center justify-center text-sm text-slate-500">{file.name}</div>
                        )}
                        <button type="button" onClick={() => removeFile(index)} className="absolute top-2 right-2 rounded-full bg-white p-1 shadow-sm text-slate-800 hover:bg-slate-100">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                    <Paperclip className="w-4 h-4" /> Attach
                  </button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileSelect} className="hidden" />
                  <input
                    type="text"
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#5c33f6] focus:outline-none focus:ring-1 focus:ring-[#5c33f6]"
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={isLoading || (!typedMessage.trim() && selectedFiles.length === 0)}
                    className="rounded-3xl bg-[#5c33f6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4a24e3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
