import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, faTimes, faPaperPlane, 
  faLightbulb, faCommentDots
} from '@fortawesome/free-solid-svg-icons';
import { sendParticipantChatMessage, generateQuizFAQs } from '../../api/aiApi';
import { useAlert } from '../common/CustomAlert';
import DotField from '../common/DotField';

const ParticipantChat = ({ quizId, participantTokenId, quizTitle }) => {
  const { error } = useAlert();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [faqs, setFaqs] = useState([]);
  const [showFaqs, setShowFaqs] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Debug: Check if quizId is received
  console.log('📌 ParticipantChat received:', { quizId, participantTokenId, quizTitle });

  useEffect(() => {
    if (isOpen && faqs.length === 0) {
      loadFAQs();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadFAQs = async () => {
    // ✅ Check if quizId is valid
    if (!quizId) {
      console.warn('⚠️ No quizId provided, cannot load FAQs');
      return;
    }
    
    try {
      const response = await generateQuizFAQs(quizId);
      if (response && response.faqs) {
        setFaqs(response.faqs);
      }
    } catch (err) {
      console.error('FAQ error:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    // ✅ Check if quizId is valid
    if (!quizId) {
      error('Quiz ID not available. Please try again.');
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setShowFaqs(false);

    const newUserMessage = { sender: 'user', message: userMessage, timestamp: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const chatHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

      const response = await sendParticipantChatMessage(
        quizId,
        participantTokenId,
        userMessage,
        chatHistory
      );

      const aiMessage = {
        sender: 'ai',
        message: response.response || 'I\'m not sure how to respond to that.',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      error('Failed to get response. Please try again.');
      console.error('Chat send error:', err);
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

  const handleFAQClick = (question) => {
    setInput(question);
    setTimeout(() => sendMessage(), 300);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full 
          bg-[#428475] text-[#FFF4E1] shadow-lg shadow-[#428475]/30 
          flex items-center justify-center
          hover:bg-[#89D7B7] hover:text-[#1A312C] transition-all duration-300
          ${isOpen ? 'hidden' : ''}
        `}
      >
        <FontAwesomeIcon icon={faRobot} className="text-2xl" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#89D7B7] rounded-full animate-pulse" />
      </button>

      {/* MODAL OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Content */}
          <div 
            className="relative w-[92vw] max-w-4xl h-[88vh] max-h-[750px] rounded-2xl overflow-hidden"
            style={{
              background: '#1A312C',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              border: '1px solid rgba(137,215,183,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* DOTFIELD BACKGROUND */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
              <DotField
                dotRadius={1.5}
                dotSpacing={14}
                bulgeStrength={67}
                glowRadius={160}
                sparkle={false}
                waveAmplitude={0}
                cursorRadius={500}
                cursorForce={0.1}
                bulgeOnly
                gradientFrom="#428475"
                gradientTo="#89D7B7"
                glowColor="#89D7B7"
              />
            </div>

            {/* CONTENT */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="bg-[#1A312C]/80 backdrop-blur-sm p-4 flex items-center justify-between border-b border-[#428475]/20 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#428475] flex items-center justify-center shadow-lg shadow-[#428475]/20">
                    <FontAwesomeIcon icon={faRobot} className="text-[#FFF4E1] text-lg" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#FFF4E1]">AI Assistant</h3>
                    <p className="text-xs text-[#89D7B7]/70">
                      {quizTitle || 'Quiz Assistant'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-[#FFF4E1]/50 hover:text-[#FFF4E1] transition-colors w-9 h-9 rounded-full hover:bg-[#FFF4E1]/10 flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-lg" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center mt-12">
                    <div className="w-20 h-20 rounded-full bg-[#428475]/20 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#428475]/10">
                      <FontAwesomeIcon icon={faRobot} className="text-4xl text-[#89D7B7]" />
                    </div>
                    <h4 className="text-2xl font-bold text-[#FFF4E1]">How can I help you?</h4>
                    <p className="text-[#FFF4E1]/50 text-sm mt-2 max-w-md mx-auto">
                      Ask me anything about this quiz.
                    </p>
                    
                    {showFaqs && faqs.length > 0 && (
                      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                        <p className="col-span-full text-xs text-[#FFF4E1]/30 mb-2 flex items-center gap-2 justify-center">
                          <FontAwesomeIcon icon={faLightbulb} className="text-[#89D7B7]" />
                          Suggested Questions
                        </p>
                        {faqs.slice(0, 6).map((faq, index) => (
                          <button
                            key={index}
                            onClick={() => handleFAQClick(faq.question)}
                            className="text-left px-4 py-3 rounded-xl bg-[#1A312C]/50 hover:bg-[#428475]/30 transition-all duration-200 
                                     text-[#89D7B7] text-sm border border-[#428475]/10 hover:border-[#428475]/30"
                          >
                            <div className="flex items-start gap-2">
                              <FontAwesomeIcon icon={faCommentDots} className="text-[#428475] text-xs mt-0.5" />
                              <span>{faq.question}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        msg.sender === 'user' ? 'bg-[#89D7B7] text-[#1A312C]' : 'bg-[#428475] text-[#FFF4E1]'
                      }`}>
                        {msg.sender === 'user' ? '👤' : '🤖'}
                      </div>
                      <div className={`px-4 py-3 rounded-2xl max-w-[75%] ${
                        msg.sender === 'user' 
                          ? 'bg-[#428475] text-[#FFF4E1] rounded-br-none' 
                          : 'bg-[#FFF4E1] text-[#1A312C] rounded-bl-none'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <span className={`text-[10px] mt-1 block ${
                          msg.sender === 'user' ? 'text-[#FFF4E1]/50' : 'text-[#1A312C]/40'
                        }`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#428475] flex items-center justify-center text-xs text-[#FFF4E1] flex-shrink-0">
                      🤖
                    </div>
                    <div className="px-4 py-3 rounded-2xl bg-[#FFF4E1] rounded-bl-none">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-[#428475] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-[#428475] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-[#428475] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="bg-[#1A312C]/80 backdrop-blur-sm p-4 border-t border-[#428475]/20 flex-shrink-0">
                <div className="flex items-end gap-3 max-w-4xl mx-auto">
                  <div className="flex-1 relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask anything about the quiz..."
                      className="w-full resize-none bg-[#FFF4E1]/10 rounded-2xl px-5 py-3.5 text-[#FFF4E1] 
                               placeholder-[#FFF4E1]/30 focus:outline-none focus:ring-2 focus:ring-[#428475] 
                               text-sm max-h-32 min-h-[52px] border border-[#428475]/10"
                      rows="1"
                      style={{ minHeight: '52px' }}
                    />
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || isLoading}
                    className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0
                      ${input.trim() && !isLoading 
                        ? 'bg-[#428475] text-[#FFF4E1] hover:bg-[#89D7B7] hover:text-[#1A312C] shadow-lg shadow-[#428475]/30' 
                        : 'bg-[#428475]/30 text-[#FFF4E1]/30 cursor-not-allowed'}
                    `}
                  >
                    <FontAwesomeIcon icon={faPaperPlane} className="text-lg" />
                  </button>
                </div>
                <p className="text-[10px] text-[#FFF4E1]/20 text-center mt-2">
                  AI is focused on the quiz topic
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ParticipantChat;