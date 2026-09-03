useEffect(() => {
  const unsubscribe = socketService.on('postCreated', (newPost) => {
    // Add new post to top of feed
    setPosts((prev) => [newPost, ...prev]);
    
    // Show notification
    addNotification(`${newPost.user.full_name} posted something new!`);
  });

  return unsubscribe;
}, []);