import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faRobot, faBrain } from '@fortawesome/free-solid-svg-icons';
import ChatMessage from './ChatMessage';
import { LoadingMessage } from '../common/SkeletonLoader';
import { askAdminAI } from '../../api/aiApi';
import DotField from '../common/DotField';
import { useAlert } from '../common/CustomAlert';  // ✅ ADD THIS

const AIChat = ({ quizId }) => {
  const { error } = useAlert();  // ✅ ADD THIS
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([
    'What patterns do you see in the responses?',
    'Which image was most selected?',
    'What insights can you give me?',
    'How consistent are the participants?',
    'What recommendations do you have?'
  ]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', message: userMessage, timestamp: new Date().toLocaleTimeString() }]);
    setIsLoading(true);

    try {
      const response = await askAdminAI(quizId, userMessage);
      setMessages(prev => [...prev, {
        sender: 'ai',
        message: response.answer || 'I\'m not sure how to answer that. Can you ask something else about the data?',
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (err) {
      error('Failed to get response. Please try again.');  // ✅ Use custom error
      console.error('Admin chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
    setTimeout(() => sendMessage(), 300);
  };

  return (
    <div className="relative min-h-[500px] rounded-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1A312C]/95 via-[#1A312C]/90 to-[#1A312C]/85 backdrop-blur-xl" />
      
      <div className="absolute inset-0 opacity-30">
        <DotField
          dotRadius={1.5}
          dotSpacing={14}
          bulgeStrength={67}
          glowRadius={160}
          sparkle
          waveAmplitude={0}
          cursorRadius={500}
          cursorForce={0.1}
          bulgeOnly
          gradientFrom="#428475"
          gradientTo="#89D7B7"
          glowColor="#89D7B7"
        />
      </div>

      <div className="relative z-10 flex flex-col h-[500px]">
        <div className="bg-[#1A312C]/60 backdrop-blur-sm p-3 border-b border-[#428475]/20">
          <div className="flex items-center gap-2">
            <FontAwesomeIcon icon={faBrain} className="text-[#89D7B7]" />
            <span className="text-sm font-medium text-[#FFF4E1]">AI Data Assistant</span>
            <span className="text-xs text-[#FFF4E1]/40">Ask about your quiz data</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center mt-8">
              <div className="w-16 h-16 rounded-full bg-[#428475]/20 flex items-center justify-center mx-auto mb-4">
                <FontAwesomeIcon icon={faRobot} className="text-3xl text-[#89D7B7]" />
              </div>
              <h4 className="text-[#FFF4E1] font-semibold">Ask about your data</h4>
              <p className="text-[#FFF4E1]/50 text-sm mt-1">Get AI-powered insights from your quiz responses.</p>
              
              <div className="mt-4 space-y-2">
                <p className="text-xs text-[#FFF4E1]/40">💡 Try asking:</p>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestion(suggestion)}
                    className="w-full text-left px-3 py-2 rounded-lg bg-[#1A312C]/40 hover:bg-[#428475]/20 transition-colors text-[#89D7B7] text-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessage
                key={index}
                message={msg.message}
                sender={msg.sender}
                timestamp={msg.timestamp}
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#428475] flex items-center justify-center text-xs text-[#FFF4E1] flex-shrink-0">
                🤖
              </div>
              <div className="px-4 py-3 rounded-2xl bg-[#FFF4E1] rounded-bl-none">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="bg-[#1A312C]/60 backdrop-blur-sm p-3 border-t border-[#428475]/20">
          <div className="flex items-center gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask about your data..."
              className="flex-1 resize-none bg-[#FFF4E1]/10 rounded-xl px-4 py-2 text-[#FFF4E1] placeholder-[#FFF4E1]/30 focus:outline-none focus:ring-2 focus:ring-[#428475] text-sm max-h-24"
              rows="1"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                ${input.trim() && !isLoading 
                  ? 'bg-[#428475] text-[#FFF4E1] hover:bg-[#89D7B7] hover:text-[#1A312C]' 
                  : 'bg-[#428475]/30 text-[#FFF4E1]/30 cursor-not-allowed'}
              `}
            >
              <FontAwesomeIcon icon={faPaperPlane} className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;