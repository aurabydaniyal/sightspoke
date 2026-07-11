import { adminApi } from './axiosConfig';

// ============================================================
// AI INSIGHTS
// ============================================================

export const getQuizAIInsights = async (quizId) => {
  const response = await adminApi.get(`/ai/insights/${quizId}`);
  return response.data;
};

export const analyzeQuizResponses = async (quizId, participantTokenId = null) => {
  const response = await adminApi.post('/ai/analyze-survey', {
    quiz_id: quizId,
    participant_token_id: participantTokenId
  });
  return response.data;
};

// ============================================================
// PARTICIPANT ANALYSIS - FIXED
// ============================================================

export const analyzeParticipant = async (quizId, participantToken) => {
  // ✅ Pass the token string (not UUID)
  const response = await adminApi.post('/ai/analyze-participant', {
    quiz_id: quizId,
    participant_token_id: participantToken  // This is the token string
  });
  return response.data;
};

// ============================================================
// CHAT LOGS - FIXED
// ============================================================

export const getChatLogs = async (quizId) => {
  const response = await adminApi.get(`/ai/chat-logs/${quizId}`);
  return response.data;
};

export const getParticipantChatLogs = async (quizId, participantToken) => {
  // ✅ Pass the token string (not UUID)
  const response = await adminApi.get(`/ai/participant-chat-logs/${quizId}/${participantToken}`);
  return response.data;
};

// ============================================================
// AI CHAT
// ============================================================

export const sendParticipantChatMessage = async (quizId, participantTokenId, message, chatHistory = []) => {
  const payload = {
    quiz_id: quizId,
    participant_token_id: participantTokenId,
    message: message,
    chat_history: chatHistory || []
  };
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
  try {
    const response = await adminApi.post('/ai/faqs', {
      quiz_id: quizId
    });
    return response.data;
  } catch (error) {
    console.error('FAQ error:', error);
    return {
      faqs: [
        { question: 'What is this survey about?', answer: 'This survey explores psychological patterns and preferences.' },
        { question: 'How long will it take?', answer: 'The survey takes approximately 3-5 minutes.' },
        { question: 'What do my results mean?', answer: 'Your results help understand your psychological patterns and thinking style.' },
        { question: 'Is my data private?', answer: 'Yes, all responses are completely anonymous and private.' },
        { question: 'Can I retake the survey?', answer: 'Yes, you can retake the survey anytime using the same link.' }
      ]
    };
  }
};

export const askExpertAI = async (quizId, question) => {
  const response = await adminApi.post('/ai/expert-query', {
    quiz_id: quizId,
    question: question
  });
  return response.data;
};