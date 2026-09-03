import { useCallback, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const normalizeSocketUrl = (url) => {
  if (!url) return 'http://localhost:5234';
  let value = String(url).trim();
  value = value.replace(/:\s*$/, '');
  value = value.replace(/localhost(\d{2,5})/i, 'localhost:$1');
  if (!/^[a-zA-Z]+:\/\//.test(value)) value = `http://${value}`;
  return value;
};

const SOCKET_URL = normalizeSocketUrl(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5234');

export function useWebRTCCall() {
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCallerRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [callStatus, setCallStatus] = useState('idle');

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
        socketRef.current.emit('ice-candidate', {
          to: targetUserId,
          senderId: getCurrentUserId(),
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

  const ensureSocket = useCallback(() => {
    if (socketRef.current) return socketRef.current;

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on('connect', () => {
      setIsConnected(true);
      const currentUserId = getCurrentUserId();
      if (currentUserId) socket.emit('join-user', currentUserId);
      setCallStatus('connected');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setCallStatus('disconnected');
    });

    socket.on('incoming-call', async ({ from, signal, isVideo }) => {
      setCallStatus('ringing');
      pendingCallerRef.current = from;
      try {
        if (!peerConnectionRef.current) {
          await createPeerConnection(from, !!isVideo);
        }
        if (signal) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          socket.emit('answer-call', { to: from, signal: answer, fromUserId: getCurrentUserId() });
        }
      } catch (error) {
        console.error('incoming-call error:', error);
        setCallStatus('failed');
      }
    });

    socket.on('call-accepted', async ({ from, signal }) => {
      setCallStatus('connected');
      try {
        if (peerConnectionRef.current && signal) {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } catch (error) {
        console.error('call-accepted error:', error);
        setCallStatus('failed');
      }
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        if (peerConnectionRef.current && candidate) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('ice-candidate error:', error);
      }
    });

    socket.on('call-ended', () => {
      setCallStatus('ended');
      cleanupPeerConnection();
    });

    socketRef.current = socket;
    return socket;
  }, [cleanupPeerConnection, createPeerConnection, getCurrentUserId]);

  const startCall = useCallback(async (targetUserId, isVideo = true) => {
    try {
      const socket = ensureSocket();
      const pc = await createPeerConnection(targetUserId, isVideo);
      setCallStatus('calling');
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: !!isVideo });
      await pc.setLocalDescription(offer);
      socket.emit('call-user', {
        userToCall: targetUserId,
        from: getCurrentUserId(),
        signalData: offer,
        isVideo: !!isVideo,
      });
    } catch (error) {
      console.error('startCall error:', error);
      setCallStatus('failed');
    }
  }, [createPeerConnection, ensureSocket, getCurrentUserId]);

  const answerCall = useCallback(async () => {
    try {
      const socket = ensureSocket();
      const callerId = pendingCallerRef.current;
      if (!callerId || !peerConnectionRef.current) return;
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      socket.emit('answer-call', {
        to: callerId,
        signal: answer,
        fromUserId: getCurrentUserId(),
      });
      setCallStatus('connected');
    } catch (error) {
      console.error('answerCall error:', error);
      setCallStatus('failed');
    }
  }, [ensureSocket, getCurrentUserId]);

  const endCall = useCallback(() => {
    const socket = socketRef.current;
    const currentUserId = getCurrentUserId();

    if (socket && pendingCallerRef.current) {
      socket.emit('end-call', { to: pendingCallerRef.current, targetUserId: pendingCallerRef.current });
    }

    cleanupPeerConnection();
    setCallStatus('ended');
    pendingCallerRef.current = null;

    if (socket && currentUserId) {
      socket.emit('join-user', currentUserId);
    }
  }, [cleanupPeerConnection, getCurrentUserId]);

  const toggleAudio = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled;
    });
  }, []);

  useEffect(() => {
    ensureSocket();
    return () => {
      cleanupPeerConnection();
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [cleanupPeerConnection, ensureSocket]);

  return {
    localStream,
    remoteStream,
    isConnected,
    callStatus,
    startCall,
    answerCall,
    endCall,
    toggleAudio,
    toggleVideo,
  };
}
