import React from 'react';
import { motion } from 'framer-motion';

const ChatMessage = ({ message, sender, timestamp, isTyping = false }) => {
  const isUser = sender === 'user';
  const isAI = sender === 'ai' || sender === 'bot';
  
  // Instagram-style bubble classes
  const bubbleClass = isUser 
    ? 'bg-[#428475] text-[#FFF4E1] rounded-br-none ml-auto' 
    : 'bg-[#FFF4E1] text-[#1A312C] rounded-bl-none';

  const avatarClass = isUser 
    ? 'bg-[#89D7B7] text-[#1A312C]' 
    : 'bg-[#428475] text-[#FFF4E1]';

  const avatarIcon = isUser ? '👤' : '🤖';

  // Typing indicator
  if (isTyping) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 max-w-[85%]"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarClass}`}>
          {avatarIcon}
        </div>
        <div className={`px-4 py-3 rounded-2xl ${bubbleClass}`}>
          <div className="flex items-center gap-2">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${avatarClass}`}>
        {avatarIcon}
      </div>
      
      {/* Message Bubble */}
      <div className={`px-4 py-3 rounded-2xl shadow-sm ${bubbleClass}`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message}
        </p>
        {timestamp && (
          <span className={`text-[10px] mt-1 block ${isUser ? 'text-[#FFF4E1]/60' : 'text-[#1A312C]/40'}`}>
            {timestamp}
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default ChatMessage;