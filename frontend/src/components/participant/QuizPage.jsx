import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { participantApi } from '../../api/axiosConfig';
import { useAlert } from '../../components/common/CustomAlert';
import toast from 'react-hot-toast';

const QuizPage = () => {
  const { error } = useAlert();
  const { token, pageNumber } = useParams();
  const navigate = useNavigate();
  const [pageData, setPageData] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [timer, setTimer] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadPage = async () => {
    try {
      const response = await participantApi.get(`/${token}/page/${pageNumber}`);
      setPageData(response.data);
      setStartTime(Date.now());
      setSubmitted(false);
      setSelectedImage(null);
      setSubmitting(false);
    } catch (error) {
      error('Failed to load page');
      navigate(`/quiz/${token}/complete`);
    }
  };

  const handleTimeout = async () => {
    if (submitting || submitted) return;
    const latency = Date.now() - startTime;
    await submitResponse(null, null, latency, true);
  };

  const submitResponse = async (imageId, positionIndex, latency, timeout) => {
    if (submitted) return;
    setSubmitting(true);
    setSubmitted(true);
    
    try {
      await participantApi.post(`/${token}/response`, {
        page_id: pageData.page_id,
        page_number: parseInt(pageNumber),
        selected_image_id: imageId,
        selected_position_index: positionIndex,
        latency_ms: latency,
        timeout_flag: timeout
      });

      if (pageData.is_last_page) {
        navigate(`/quiz/${token}/complete`);
      } else {
        navigate(`/quiz/${token}/page/${parseInt(pageNumber) + 1}`);
      }
    } catch (error) {
      error('Failed to submit response');
      setSubmitting(false);
      setSubmitted(false);
    }
  };

  const handleSelect = async (imageId, positionIndex) => {
    if (submitting || submitted) return;
    setSelectedImage(imageId);
    const latency = Date.now() - startTime;
    await submitResponse(imageId, positionIndex, latency, false);
  };

  useEffect(() => {
    loadPage();
  }, [pageNumber]);

  useEffect(() => {
    if (!pageData) return;
    setTimer(pageData.time_limit_seconds);
    
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pageData, pageNumber]);

  if (!pageData) {
    return (
      <div className="min-h-screen bg-[#1A312C] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#89D7B7] border-t-transparent" />
      </div>
    );
  }

  const layoutClass = {
    'grid-layout-2x2': 'grid-cols-2',
    'grid-layout-3x2': 'grid-cols-3',
    'stack-vertical': 'grid-cols-1 max-w-md mx-auto',
    'row-horizontal': 'grid-cols-4'
  }[pageData.layout_class] || 'grid-cols-2';

  return (
    <div className="min-h-screen bg-[#1A312C] flex items-center justify-center p-4">
      <div className="glass-card p-6 md:p-8 max-w-3xl w-full">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-[#1A312C]/60">
            Page {pageNumber} of {pageData.total_pages}
          </span>
          <div className="flex items-center gap-3">
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
              ${timer <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-[#428475] text-white'}
            `}>
              {timer}s
            </div>
          </div>
        </div>

        <div className={`grid ${layoutClass} gap-4 mb-6`}>
          {pageData.images.map((image, index) => (
            <motion.button
              key={image.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(image.id, index)}
              disabled={!!selectedImage || submitted}
              className={`
                relative aspect-square rounded-lg overflow-hidden border-4 transition-all duration-300
                ${selectedImage === image.id ? 'border-[#89D7B7] shadow-lg shadow-[#89D7B7]/30' : 'border-transparent hover:border-[#428475]/30'}
                ${selectedImage && selectedImage !== image.id ? 'opacity-50' : ''}
              `}
            >
              <img
                src={`http://localhost:8000${image.url}`}
                alt={`Option ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white text-xs flex items-center justify-center">
                {index + 1}
              </div>
              {selectedImage === image.id && (
                <div className="absolute inset-0 bg-[#89D7B7]/20 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#89D7B7] text-[#1A312C] flex items-center justify-center text-2xl font-bold">
                    ✓
                  </div>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pageData.total_pages }, (_, i) => (
            <div
              key={i}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                ${i + 1 < parseInt(pageNumber) ? 'bg-[#89D7B7] text-[#1A312C]' : ''}
                ${i + 1 === parseInt(pageNumber) ? 'bg-[#428475] text-white scale-110 shadow-lg' : ''}
                ${i + 1 > parseInt(pageNumber) ? 'bg-[#1A312C]/10 text-[#1A312C]/30' : ''}
              `}
            >
              {i + 1}
            </div>
          ))}
        </div>

        <p className="text-center text-[#1A312C]/40 text-sm mt-4">
          Trust your instinct. Pick one.
        </p>
      </div>
    </div>
  );
};

export default QuizPage;