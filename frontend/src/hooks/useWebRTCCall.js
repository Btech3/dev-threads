import { useCallback, useEffect, useRef, useState } from 'react';
import { socketService } from '../services/socketService.js';

export function useWebRTCCall() {
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCallerRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');
  const [callError, setCallError] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const pendingOfferRef = useRef(null);

  const getCurrentUserId = useCallback(() => {
    return localStorage.getItem('backendUserId') || localStorage.getItem('clerkId') || null;
  }, []);

  const cleanupPeerConnection = useCallback(() => {
    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
    setIsVideoCall(false);
    setIsMuted(false);
    setIsCameraOff(false);
  }, []);

  const createPeerConnection = useCallback(async (targetUserId, isVideo = true) => {
    if (!targetUserId) {
      throw new Error('A target user is required to start a call');
    }

    const configuration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && targetUserId) {
        socketService.send('call:ice-candidate', {
          to: targetUserId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) setRemoteStream(stream);
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Microphone/camera access is not supported in this browser');
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: !!isVideo,
    });

    localStreamRef.current = stream;
    setLocalStream(stream);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    return pc;
  }, [getCurrentUserId]);

  const reportCallError = useCallback((context, error) => {
    const detail = error?.message || String(error || 'Unknown error');
    const message = `${context}: ${detail}`;
    console.error(`[WebRTC] ${message}`, error);
    setCallError(message);
  }, []);

  const ensureSocket = useCallback(() => {
    const socket = socketService.getSocket();
    if (socketRef.current === socket) return socket;

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      const currentUserId = getCurrentUserId();
      if (currentUserId) socket.emit('join-user', currentUserId);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setCallStatus('disconnected');
    });

    const unsubscribeRing = socketService.on('call:ring', ({ from, offer, isVideo }) => {
      setCallStatus('ringing');
      pendingCallerRef.current = from;
      pendingOfferRef.current = offer;
      setIsVideoCall(Boolean(isVideo));
      setIncomingCall({ from, isVideo: Boolean(isVideo) });
      setCallError('');
    });

    const unsubscribeAnswer = socketService.on('call:answer', async ({ answer }) => {
      setCallStatus('connected');
      try {
        if (peerConnectionRef.current && answer) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      } catch (error) {
        reportCallError('Call answer failed', error);
        setCallStatus('failed');
      }
    });

    const unsubscribeIce = socketService.on('call:ice-candidate', async ({ candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        reportCallError('Network candidate failed', error);
      }
    });

    const unsubscribeEnd = socketService.on('call:end', () => {
      setCallStatus('ended');
      cleanupPeerConnection();
    });

    const unsubscribeFailure = socketService.on('call:failed', ({ error }) => {
      reportCallError('Call signaling failed', new Error(error || 'Unknown signaling error'));
      setCallStatus('failed');
    });

    const unsubscribeReject = socketService.on('call:reject', ({ reason }) => {
      reportCallError('Call rejected', new Error(reason || 'The call was rejected'));
      cleanupPeerConnection();
      setCallStatus('ended');
    });

    const unsubscribeCancel = socketService.on('call:cancel', () => {
      cleanupPeerConnection();
      setCallStatus('ended');
    });

    socket.on('connect_error', (error) => {
      reportCallError('Socket connection failed', error);
      setIsConnected(false);
    });

    socketRef.currentUnsubscribe = () => {
      unsubscribeRing();
      unsubscribeAnswer();
      unsubscribeIce();
      unsubscribeEnd();
      unsubscribeFailure();
      unsubscribeReject();
      unsubscribeCancel();
    };

    return socket;
  }, [cleanupPeerConnection, createPeerConnection, getCurrentUserId, reportCallError]);

  const startCall = useCallback(async (targetUserId, isVideo = true) => {
    try {
      setCallError('');
      const socket = ensureSocket();
      const pc = await createPeerConnection(targetUserId, isVideo);
      setIsVideoCall(Boolean(isVideo));
      setCallStatus('calling');
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: !!isVideo });
      await pc.setLocalDescription(offer);
      socket.emit('call:initiate', {
        to: targetUserId,
        offer,
        isVideo: !!isVideo,
      });
    } catch (error) {
      reportCallError('Starting call failed', error);
      setCallStatus('failed');
    }
  }, [createPeerConnection, ensureSocket, reportCallError]);

  const answerCall = useCallback(async () => {
    try {
      const callerId = pendingCallerRef.current;
      const offer = pendingOfferRef.current;
      if (!callerId || !offer) throw new Error('No incoming call is waiting');

      setCallError('');
      const socket = ensureSocket();
      if (!peerConnectionRef.current) {
        await createPeerConnection(callerId, Boolean(incomingCall?.isVideo));
      }

      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit('call:accept', { to: callerId, answer });
      setCallStatus('connected');
      setIncomingCall(null);
      pendingOfferRef.current = null;
    } catch (error) {
      reportCallError('Answering call failed', error);
      setCallStatus('failed');
    }
  }, [createPeerConnection, ensureSocket, incomingCall?.isVideo, reportCallError]);

  const rejectCall = useCallback((reason = 'Call rejected') => {
    const callerId = pendingCallerRef.current;
    if (callerId) socketService.send('call:reject', { to: callerId, reason });
    pendingCallerRef.current = null;
    pendingOfferRef.current = null;
    setIncomingCall(null);
    setIsVideoCall(false);
    setCallStatus('ended');
  }, []);

  const endCall = useCallback(() => {
    const socket = socketRef.current;
    const currentUserId = getCurrentUserId();

    if (socket && pendingCallerRef.current) {
      socket.emit('call:end', { to: pendingCallerRef.current });
    }

    cleanupPeerConnection();
    setCallStatus('ended');
    pendingCallerRef.current = null;
    pendingOfferRef.current = null;
    setIncomingCall(null);

    if (socket && currentUserId) {
      socket.emit('join-user', currentUserId);
    }
  }, [cleanupPeerConnection, getCurrentUserId]);

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return false;
    let nextMuted = isMuted;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      nextMuted = !track.enabled;
    });
    setIsMuted(nextMuted);
    return nextMuted;
  }, [isMuted]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return false;
    let nextCameraOff = isCameraOff;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
      nextCameraOff = !track.enabled;
    });
    setIsCameraOff(nextCameraOff);
    return nextCameraOff;
  }, [isCameraOff]);

  useEffect(() => {
    ensureSocket();
    return () => {
      cleanupPeerConnection();
      socketRef.currentUnsubscribe?.();
      socketRef.current = null;
    };
  }, [cleanupPeerConnection, ensureSocket]);

  return {
    localStream,
    remoteStream,
    isConnected,
    callStatus,
    callError,
    incomingCall,
    isMuted,
    isCameraOff,
    isVideoCall,
    startCall,
    answerCall,
    rejectCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
}
