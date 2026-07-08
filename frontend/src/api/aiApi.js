import { adminApi } from './axiosConfig';

// ============================================================
// AI API CALLS
// ============================================================

export const analyzeQuizResponses = async (quizId, participantTokenId = null) => {
  const response = await adminApi.post('/ai/analyze', {
    quiz_id: quizId,
    participant_token_id: participantTokenId
  });
  return response.data;
};

export const sendParticipantChatMessage = async (quizId, participantTokenId, message, chatHistory = []) => {
  console.log('📤 Sending chat:', { quizId, participantTokenId, message, chatHistory });
  
  // ✅ CRITICAL FIX: Use snake_case to match backend exactly
  const payload = {
    quiz_id: quizId,
    participant_token_id: participantTokenId,
    message: message,
    chat_history: chatHistory || []
  };
  
  console.log('📤 Payload being sent:', payload);
  
  const response = await adminApi.post('/ai/chat', payload);
  return response.data;
};

export const askAdminAI = async (quizId, question) => {
  const response = await adminApi.post('/ai/admin/qa', {
    quiz_id: quizId,
    question: question
  });
  return response.data;
};

export const generateQuizFAQs = async (quizId) => {
  console.log('📤 Sending FAQ request for quiz:', quizId);
  try {
    const response = await adminApi.post('/ai/faqs', {
      quiz_id: quizId
    });
    console.log('✅ FAQ response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ FAQ error:', error.response?.data || error.message);
    return {
      faqs: [
        { question: 'What is this quiz about?', answer: 'This quiz explores your visual preferences and decision-making patterns.' },
        { question: 'How long will it take?', answer: 'The quiz typically takes 3-5 minutes to complete.' },
        { question: 'What do my results mean?', answer: 'Your results help understand your personal preferences and thinking style.' },
        { question: 'Is my data private?', answer: 'Yes, all responses are completely anonymous and private.' },
        { question: 'Can I retake the quiz?', answer: 'Yes, you can retake the quiz anytime using the same link.' }
      ]
    };
  }
};

export const getQuizAIInsights = async (quizId) => {
  const response = await adminApi.get(`/ai/insights/${quizId}`);
  return response.data;
};

export const analyzeParticipantChat = async (quizId, participantTokenId) => {
  const response = await adminApi.post(`/ai/participant/analyze-chat?quiz_id=${quizId}&participant_token_id=${participantTokenId}`);
  return response.data;
};