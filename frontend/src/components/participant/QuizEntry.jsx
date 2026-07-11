import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faClock, faImage } from '@fortawesome/free-solid-svg-icons';
import { participantApi } from '../../api/axiosConfig';
import { useAlert } from '../../components/common/CustomAlert';
import ParticipantChat from '../ai/ParticipantChat';
import TiltedCard from '../common/TiltedCard';
import ParticipantLayout from '../../pages/ParticipantLayout';

const QuizEntry = () => {
  const { error } = useAlert();
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
      console.log('✅ Quiz info from backend:', response.data);
      setQuizInfo(response.data);
      setLoading(false);
    } catch (err) {
      error('Invalid or expired link');
      setLoading(false);
    }
  };

  const startQuiz = () => {
    navigate(`/quiz/${token}/page/1`);
  };

  if (loading) {
    return (
      <ParticipantLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#89D7B7] border-t-transparent" />
        </div>
      </ParticipantLayout>
    );
  }

  if (!quizInfo) {
    return (
      <ParticipantLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass-card p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-[#FFF4E1] mb-2">Invalid Link</h2>
            <p className="text-[#FFF4E1]/60">This link is invalid or has expired.</p>
          </div>
        </div>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-lg"
        >
          {/* ✅ Tilted Card */}
          <TiltedCard
            imageSrc="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400"
            altText={quizInfo.title || 'Visual Preference Test'}
            captionText={quizInfo.title || 'Visual Preference Test'}
            containerHeight="420px"
            containerWidth="100%"
            imageHeight="400px"
            imageWidth="100%"
            rotateAmplitude={12}
            scaleOnHover={1.03}
            showTooltip={true}
            displayOverlayContent={true}
            overlayContent={
              <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#89D7B7]/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <span className="text-3xl">⭐</span>
                </div>
                <h1 className="text-2xl font-bold text-[#FFF4E1] mb-2">
                  {quizInfo.title || 'Visual Preference Test'}
                </h1>
                <p className="text-[#FFF4E1]/70 text-sm mb-4 max-w-xs">
                  {quizInfo.description || 'Trust your instinct. Pick one.'}
                </p>

                <div className="flex items-center justify-center gap-4 text-xs text-[#89D7B7] mb-4">
                  <span className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    <FontAwesomeIcon icon={faClock} /> {quizInfo.total_time || 0}s
                  </span>
                  <span className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                    <FontAwesomeIcon icon={faImage} /> {quizInfo.pages || 0} pages
                  </span>
                </div>

                <button
                  onClick={startQuiz}
                  className="btn-neon w-full justify-center py-2.5 text-sm"
                >
                  Start Survey
                  <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </button>

                <p className="text-[10px] text-[#FFF4E1]/30 mt-4">
                  Your responses are anonymous. No personal data is collected.
                </p>
              </div>
            }
          />
        </motion.div>

        {/* Chat */}
        <ParticipantChat
          quizId={quizInfo?.quiz_id || null}
          participantTokenId={token}
          quizTitle={quizInfo?.title}
          quizDescription={quizInfo?.description}
          aiOverview={quizInfo?.ai_overview}
        />
      </div>
    </ParticipantLayout>
  );
};

export default QuizEntry;