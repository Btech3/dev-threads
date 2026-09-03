const handleTyping = (e) => {
  setInputMessage(e.target.value);
  
  // Emit typing event
  socketService.socketEmit('typing', {
    recipientId: selectedUser._id,
    isTyping: true
  });
};

// Listen for typing indicator
useEffect(() => {
  const unsubscribe = socketService.on('typing', (data) => {
    if (data.senderId === selectedUser?._id) {
      setIsTyping(data.isTyping);
    }
  });

  return unsubscribe;
}, [selectedUser]);