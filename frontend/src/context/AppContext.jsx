import { createContext, useContext, useState, useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useAppAuth } from './AuthContext';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { appUser, setAppUser } = useAppAuth();
  const [posts, setPosts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    const shouldConnect = !!appUser?._id;

    if (shouldConnect) {
      // Save backend user ID to localStorage for API use
      localStorage.setItem('backendUserId', appUser._id);
      
      // Connect socket using backend userId so server emits match the joined room
      socketService.connect(appUser._id);

      // Listen for real-time events
      const handleSocketPostCreated = (data) => {
        const newPost = data.post || data;
        setPosts((prev) => [newPost, ...prev]);
        addNotification(`${newPost.user?.full_name || newPost.userId?.full_name || 'Someone'} created a new post`);
      };

      const unsubscribePostCreated = socketService.on('postCreated', handleSocketPostCreated);
      const unsubscribePostCreatedUnderscore = socketService.on('post_created', handleSocketPostCreated);

      const unsubscribeMessageReceived = socketService.on('messageReceived', (data) => {
        setMessages((prev) => [...prev, data]);
        addNotification(`New message received`);
      });

      const unsubscribeUserUpdated = socketService.on('userUpdated', (data) => {
        if (data?.user?._id === appUser?._id) {
          setAppUser(data.user);
          addNotification('Your profile was updated successfully');
        }
      });

      const unsubscribeUserFollowed = socketService.on('userFollowed', (data) => {
        if (!data) return;

        const isFollower = data.followerId === appUser?._id;
        const isTarget = data.targetUserId === appUser?._id;

        setAppUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev };

          if (isTarget) {
            updated.followers = Array.isArray(updated.followers)
              ? [...updated.followers, data.followerId]
              : [data.followerId];
          }

          if (isFollower) {
            updated.following = Array.isArray(updated.following)
              ? [...updated.following, data.targetUserId]
              : [data.targetUserId];
          }

          return updated;
        });

        addNotification(isTarget ? 'You have a new follower' : 'Connection updated');
      });

      const unsubscribeUserUnfollowed = socketService.on('userUnfollowed', (data) => {
        if (!data) return;

        const isFollower = data.userId === appUser?._id;
        const isTarget = data.targetUserId === appUser?._id;

        setAppUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev };

          if (isTarget && Array.isArray(updated.followers)) {
            updated.followers = updated.followers.filter((id) => id.toString() !== data.userId?.toString());
          }

          if (isFollower && Array.isArray(updated.following)) {
            updated.following = updated.following.filter((id) => id.toString() !== data.targetUserId?.toString());
          }

          return updated;
        });

        addNotification(isTarget ? 'Someone unfollowed you' : 'Connection removed');
      });

      const unsubscribeSocketConnected = socketService.on('socketConnected', () => {
        setIsOnline(true);
        console.log('Connected to real-time server');
      });

      const unsubscribeSocketDisconnected = socketService.on('socketDisconnected', () => {
        setIsOnline(false);
        console.log('Disconnected from real-time server');
      });

      const unsubscribeUserOnline = socketService.on('userOnline', (data) => {
        const userId = data?.userId;
        if (!userId) return;
        setOnlineUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      });

      const unsubscribeUserOffline = socketService.on('userOffline', (data) => {
        const userId = data?.userId;
        if (!userId) return;
        setOnlineUsers((prev) => prev.filter((id) => String(id) !== String(userId)));
      });

      const unsubscribePresenceUpdate = socketService.on('presenceUpdate', (data) => {
        if (Array.isArray(data?.onlineUsers)) {
          setOnlineUsers(data.onlineUsers.map(String));
        }
      });

      // Cleanup on unmount
      return () => {
        unsubscribePostCreated();
        unsubscribePostCreatedUnderscore();
        unsubscribeMessageReceived();
        unsubscribeUserUpdated();
        unsubscribeUserFollowed();
        unsubscribeUserUnfollowed();
        unsubscribeSocketConnected();
        unsubscribeSocketDisconnected();
        unsubscribeUserOnline();
        unsubscribeUserOffline();
        unsubscribePresenceUpdate();
        socketService.disconnect();
      };
    }
  }, [appUser]);

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, timestamp: new Date() }]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  return (
    <AppContext.Provider
      value={{
        posts,
        setPosts,
        messages,
        setMessages,
        notifications,
        addNotification,
        isOnline,
        onlineUsers,
        isLoading,
        setIsLoading,
        user: appUser
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
