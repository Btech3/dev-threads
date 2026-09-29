import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, X, Search, Phone, Video, Info, Paperclip, Smile, Mic, Send, Plus, Check } from 'lucide-react';
import { assets } from '../assets/assets.js';
import { messageService } from '../services/messageServices.js';
import { socketService } from '../services/socketService.js';
import { useApp } from '../context/AppContext';
import { useWebRTCCall } from '../hooks/useWebRTCCall.js';

export default function Message() {
  const { userId } = useParams();
  const { user } = useApp();
  const {
    localStream,
    remoteStream,
    callStatus,
    callError,
    incomingCall,
    isVideoCall,
    isMuted,
    isCameraOff,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  } = useWebRTCCall();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const fileInputRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const recordingStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const normalizeMessage = (payload) => {
    const message = (payload?.message && typeof payload.message === 'object')
      ? payload.message
      : payload?.data?.message || payload?.data || payload;
    if (!message || typeof message !== 'object') return null;
    return {
      ...message,
      _id: message._id || message.id || `message-${message.createdAt || Date.now()}`,
      content: message.content || '',
      media: Array.isArray(message.media)
        ? message.media
        : message.media_url
          ? [{ url: message.media_url, type: message.messageType || 'document' }]
          : [],
      createdAt: message.createdAt || message.created_at || new Date().toISOString()
    };
  };

  const sameId = (left, right) => String(left || '') === String(right || '');

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
              setMessages((msgs.messages || []).map(normalizeMessage).filter(Boolean));
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
      const incoming = normalizeMessage(data);
      const senderId = typeof data?.senderId === 'object' ? data.senderId?._id : data?.senderId;
      const recipientId = typeof data?.recipientId === 'object' ? data.recipientId?._id : data?.recipientId;
      const selectedId = selectedUser?._id || selectedUser?.id;
      if (incoming && selectedUser && (sameId(senderId, selectedId) || sameId(recipientId, selectedId))) {
        setMessages((prev) => prev.some((item) => sameId(item._id, incoming._id)) ? prev : [...prev, incoming]);
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
      setMessages((msgs.messages || msgs.data || []).map(normalizeMessage).filter(Boolean));
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
    if ((!inputMessage.trim() && selectedFiles.length === 0 && !recordedAudio) || !selectedUser) return;

    const tempId = `temp-${Date.now()}`;
    const outgoing = {
      _id: tempId,
      senderId: user?._id || user?.id,
      recipientId: selectedUser._id || selectedUser.id,
      content: inputMessage.trim(),
      media: [],
      createdAt: new Date().toISOString(),
      status: 'sending'
    };

    // Optimistic append
    setMessages((prev) => [...prev, outgoing]);
    setInputMessage('');
    scrollToBottom();

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
      if (recordedAudio) {
        try {
          const recordingType = recordedAudio.type || 'application/octet-stream';
          const extension = recordingType.includes('mp4') ? 'm4a' : recordingType.includes('ogg') ? 'ogg' : recordingType.includes('webm') ? 'webm' : 'audio';
          const uploadResponse = await messageService.uploadMedia([new File([recordedAudio], `voice-${Date.now()}.${extension}`, { type: recordingType })]);
          mediaPayload = mediaPayload.concat(uploadResponse.media || uploadResponse.data?.media || []);
        } catch (uErr) {
          console.error('Voice upload error:', uErr);
          setErrorMessage(uErr?.message || 'Failed to upload voice note');
          setMessages((prev) => prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m));
          return;
        }
        // clear recorded data
        recordedChunksRef.current = [];
        setRecordedAudio(null);
      }

      const response = await messageService.sendMessage(selectedUser._id || selectedUser.id, outgoing.content, mediaPayload);
      const saved = normalizeMessage(response);
      // Replace temp message with saved message when available
      setMessages((prev) => [
        ...prev.filter((item) => item._id !== tempId && !sameId(item._id, saved?._id)),
        ...(saved ? [saved] : [])
      ]);
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

  const handleMessageInput = (event) => {
    const value = event.target.value;
    setInputMessage(value);
    if (selectedUser && socketService.isConnected()) {
      socketService.send('typing', {
        to: selectedUser._id || selectedUser.id,
        from: user?._id || user?.id,
        typing: Boolean(value.trim())
      });
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
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrorMessage('Voice recording is not supported by this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;
      recordedChunksRef.current = [];
      setRecordedAudio(null);
      const supportedMimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg', 'audio/mp4'];
      const mimeType = supportedMimeTypes
        .find((type) => MediaRecorder.isTypeSupported(type)) || '';
      mediaRecorderRef.current = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const actualMimeType = mediaRecorderRef.current?.mimeType || mimeType || 'application/octet-stream';
        const blob = new Blob(recordedChunksRef.current, { type: actualMimeType });
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        if (blob.size === 0) {
          setErrorMessage('The voice recorder captured no audio. Check microphone permission and try again.');
          mediaRecorderRef.current = null;
          return;
        }
        setRecordedAudio(blob);
        mediaRecorderRef.current = null;
      };
      mediaRecorderRef.current.onerror = (event) => {
        const message = event?.error?.message || 'The browser recorder failed.';
        console.error('Record runtime error:', event?.error || event);
        setErrorMessage(`Voice recording failed: ${message}`);
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecording(false);
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      setErrorMessage('Recording voice... press the microphone again to stop.');
    } catch (err) {
      console.error('Record start error', err);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      mediaRecorderRef.current = null;
      setErrorMessage(`Microphone error: ${err?.message || 'Permission was denied or unavailable.'}`);
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.requestData?.();
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } catch (e) {
      console.error('Stop recording error', e);
      setErrorMessage(`Could not stop recording: ${e?.message || 'unknown recorder error'}`);
    }
  };

  useEffect(() => {
    if (!isRecording) return undefined;
    const intervalId = window.setInterval(() => {
      setRecordingSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [isRecording]);

  useEffect(() => () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
      recorder.stop();
    }
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    mediaRecorderRef.current = null;
  }, []);

  // Call / Video actions
  const initiateCall = (type) => {
    if (!selectedUser) return;
    setErrorMessage('');
    startCall(selectedUser._id || selectedUser.id, type === 'video');
  };

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream || null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream || null;
  }, [localStream, remoteStream]);

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
      
      {/* CORE DASHBOARD CONTENT GRID */}
      <main className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-7xl min-w-0 flex-col overflow-hidden bg-slate-50 p-4 sm:h-[100dvh] sm:p-6 md:p-8 xl:p-10">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Messages</h1>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm">Talk to your friends and family</p>
        </header>

        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-12 gap-3 overflow-hidden xl:gap-5">
          {/* Conversation list: full width until a chat is selected on mobile, then hidden. */}
          <aside className={`${selectedUser ? 'hidden md:block' : 'col-span-12'} min-h-0 min-w-0 md:col-span-4 lg:col-span-3`}>
            <div className="flex h-full min-h-0 flex-col gap-3">
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

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
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
            </div>
          </aside>

          <section className={`${selectedUser ? 'col-span-12' : 'hidden md:block'} min-h-0 min-w-0 md:col-span-8 lg:col-span-6`}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <button type="button" aria-label="Back to conversations" onClick={() => setSelectedUser(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 md:hidden">
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <img src={getAvatar(selectedUser)} alt={selectedUser?.full_name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold">{selectedUser?.full_name || 'Select a chat'}</div>
                    <div className="text-xs text-green-500">{selectedUser ? 'Active now' : ''}</div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:gap-3">
                  <button onClick={() => initiateCall('voice')} className="p-2 rounded-lg hover:bg-slate-50" title="Start voice call"><Phone className="w-4 h-4" /></button>
                  <button onClick={() => initiateCall('video')} className="p-2 rounded-lg hover:bg-slate-50" title="Start video call"><Video className="w-4 h-4" /></button>
                  {callStatus !== 'idle' && <span className="text-xs text-slate-500">{callStatus}</span>}
                  <button onClick={() => setShowRightPanel(!showRightPanel)} className="p-2 rounded-lg hover:bg-slate-50"><Info className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-[#F8FAFC] p-3 sm:p-4">
                {(callError || errorMessage) && <div className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{callError || errorMessage}</div>}
                {incomingCall && callStatus === 'ringing' && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-sm">
                    <span>{incomingCall.isVideo ? 'Incoming video call' : 'Incoming voice call'}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={answerCall} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs text-white">Accept</button>
                      <button type="button" onClick={() => rejectCall()} className="rounded-lg bg-rose-600 px-3 py-2 text-xs text-white">Reject</button>
                    </div>
                  </div>
                )}
                {callStatus !== 'idle' && (localStream || remoteStream) && (
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900 p-2">
                    {isVideoCall && <video ref={localVideoRef} autoPlay muted playsInline className="max-h-40 w-full rounded-lg bg-black object-cover" />}
                    {isVideoCall && <video ref={remoteVideoRef} autoPlay playsInline className="max-h-40 w-full rounded-lg bg-black object-cover" />}
                    <div className="col-span-2 flex justify-center gap-2">
                      <button type="button" onClick={toggleAudio} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white">{isMuted ? 'Unmute microphone' : 'Mute microphone'}</button>
                      <button type="button" onClick={endCall} className="rounded-lg bg-rose-600 px-3 py-2 text-xs text-white">End call</button>
                      {isVideoCall && <button type="button" onClick={toggleVideo} className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white">{isCameraOff ? 'Turn camera on' : 'Toggle camera'}</button>}
                    </div>
                  </div>
                )}

                {/* Date divider */}
                <div className="text-xs text-slate-400 text-center">TODAY</div>

                {messages.length === 0 && (
                  <div className="text-center text-slate-500 py-8">No messages yet. Say hello 👋</div>
                )}

                {messages.map((msg) => {
                  const normalizedMessage = normalizeMessage(msg);
                  if (!normalizedMessage) return null;
                  const isMe = normalizedMessage.senderId?._id === user?._id || normalizedMessage.senderId === user?._id || normalizedMessage.senderId === (user?._id || user?.id);
                  const messageMedia = normalizedMessage.media || [];
                  return (
                    <div key={normalizedMessage._id} className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && <img src={getAvatar(selectedUser)} alt="avatar" className="w-8 h-8 rounded-full mr-2" />}
                      <div className={`max-w-[85%] rounded-2xl p-3 sm:max-w-[68%] ${isMe ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
                        {normalizedMessage.content && <div className="break-words whitespace-pre-wrap">{normalizedMessage.content}</div>}
                        {messageMedia.length > 0 && <div className="mt-2 grid max-w-full gap-2">
                          {messageMedia.map((media, index) => {
                            const mediaType = String(media.type || media.mimetype || '').toLowerCase();
                            const url = media.url || media.mediaUrl;
                            if (!url) return null;
                            if (mediaType.includes('video')) return <video key={`${url}-${index}`} src={url} controls className="max-h-60 max-w-full rounded-lg" />;
                            if (mediaType.includes('audio')) return <audio key={`${url}-${index}`} src={url} controls className="max-w-full" />;
                            if (mediaType.includes('image')) return <img key={`${url}-${index}`} src={url} alt={media.fileName || 'Shared media'} className="max-h-60 max-w-full rounded-lg object-contain" />;
                            return <a key={`${url}-${index}`} href={url} target="_blank" rel="noreferrer" className="block max-w-full break-all text-xs underline">{media.fileName || 'Open shared document'}</a>;
                          })}
                        </div>}
                        <div className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'} flex items-center gap-2 justify-end`}>
                          <span>{new Date(normalizedMessage.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
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

              <div className="shrink-0 border-t border-slate-100 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4">
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

                  <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
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
                      onChange={handleMessageInput}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Type a message..."
                      className="min-w-0 w-full max-w-full flex-1 rounded-full border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none sm:px-4"
                      disabled={!selectedUser}
                    />

                    <button onClick={sendMessage} className="rounded-full bg-indigo-600 p-3 text-white disabled:opacity-50" disabled={!selectedUser || (!inputMessage.trim() && selectedFiles.length===0 && !recordedAudio)}>
                      <Send className="w-4 h-4" />
                    </button>

                    {!isRecording ? (
                      <button onClick={startRecording} className="p-2 rounded-full hover:bg-slate-50" title="Record voice note"><Mic className="w-5 h-5 text-slate-500" /></button>
                    ) : (
                      <button onClick={stopRecording} className="flex items-center gap-1 rounded-full bg-rose-500 px-2 py-1 text-white" title="Stop recording"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /><span className="text-xs tabular-nums">{String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}</span><Mic className="h-5 w-5" /></button>
                    )}
                    {recordedAudio && !isRecording && <span className="text-xs text-emerald-600">Voice note ready</span>}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right details */}
          <aside className={`${showRightPanel ? 'fixed inset-y-14 right-0 z-30 block w-[min(22rem,92vw)] border-l border-slate-200 bg-white shadow-xl lg:static lg:col-span-3 lg:w-auto lg:border-0 lg:shadow-none' : 'hidden'} min-h-0 min-w-0`}>
            <div className="h-full overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 space-y-4 lg:p-6">
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