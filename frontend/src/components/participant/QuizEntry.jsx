import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faClock, faImage } from '@fortawesome/free-solid-svg-icons';
import { participantApi } from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const QuizEntry = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [quizInfo, setQuizInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await participantApi.get(`/validate/${token}`);
      setQuizInfo(response.data);
      setLoading(false);
    } catch (error) {
      toast.error('Invalid or expired link');
      setLoading(false);
    }
  };

  const startQuiz = () => {
    navigate(`/quiz/${token}/page/1`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A312C] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#89D7B7] border-t-transparent" />
      </div>
    );
  }

  if (!quizInfo) {
    return (
      <div className="min-h-screen bg-[#1A312C] flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-[#FFF4E1] mb-2">Invalid Link</h2>
          <p className="text-[#FFF4E1]/60">This link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A312C] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card p-8 md:p-12 max-w-lg w-full text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-[#89D7B7]/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-2xl font-bold text-[#1A312C]">
            {quizInfo.title || 'Visual Preference Test'}
          </h1>
          <p className="text-[#1A312C]/60 text-sm mt-2">
            {quizInfo.description || 'Trust your instinct. Pick one.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-6 text-sm text-[#1A312C]/50 mb-6">
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faClock} /> {quizInfo.total_time || 0}s
          </span>
          <span className="flex items-center gap-1">
            <FontAwesomeIcon icon={faImage} /> {quizInfo.pages || 0} pages
          </span>
        </div>

        <button
          onClick={startQuiz}
          className="btn-neon w-full justify-center py-3 text-lg"
        >
          Start Quiz
          <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
        </button>

        <p className="text-xs text-[#1A312C]/30 mt-4">
          Your responses are anonymous. No personal data is collected.
        </p>
      </motion.div>
    </div>
  );
};

export default QuizEntry;