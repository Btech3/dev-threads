const handleLike = async () => {
  try {
    const result = await postService.likePost(post._id);
    
    // Update UI immediately
    setPost((prev) => ({
      ...prev,
      likes_count: result.likes_count,
      isLiked: result.isLiked
    }));

    // Emit via socket for real-time
    socketService.socketEmit('post:like', {
      postId: post._id,
      userId: user.id
    });
  } catch (error) {
    console.error('Error liking post:', error);
  }
};

// Listen for other users' likes
useEffect(() => {
  const unsubscribe = socketService.on('postLiked', (data) => {
    if (data.postId === post._id && data.userId !== user.id) {
      setPost((prev) => ({
        ...prev,
        likes_count: prev.likes_count + 1
      }));
    }
  });

  return unsubscribe;
}, [post._id, user.id]);