import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { participantApi } from '../../api/axiosConfig';
import ParticipantLayout from '../../pages/ParticipantLayout';
import toast from 'react-hot-toast';

const QuizPage = () => {
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
      console.log('📸 Page data received:', response.data);
      console.log('📸 Images array:', response.data?.images);
      
      // ✅ Check if images have the correct structure
      if (response.data?.images) {
        response.data.images.forEach((img, idx) => {
          console.log(`📸 Image ${idx}:`, {
            id: img.id,
            url: img.url,
            filename: img.filename,
            file_path: img.file_path,
            title: img.title
          });
        });
      }
      
      setPageData(response.data);
      setStartTime(Date.now());
      setSubmitted(false);
      setSelectedImage(null);
      setSubmitting(false);
    } catch (error) {
      console.error('❌ Load page error:', error);
      toast.error('Failed to load page');
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
      console.error('❌ Submit error:', error);
      toast.error('Failed to submit response');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData, pageNumber]);

  // ✅ FIX: Get the correct image source - handles ALL data structures
  const getImageSrc = (image) => {
    if (!image) {
      console.warn('⚠️ Image is null or undefined');
      return '';
    }
    
    // ✅ Check for url property (Pexels or direct URL)
    if (image.url && typeof image.url === 'string' && image.url.startsWith('http')) {
      console.log('🔗 Using URL from image.url:', image.url);
      return image.url;
    }
    
    // ✅ Check for file_path that starts with http (Pexels URL stored in file_path)
    if (image.file_path && typeof image.file_path === 'string' && image.file_path.startsWith('http')) {
      console.log('🔗 Using URL from image.file_path:', image.file_path);
      return image.file_path;
    }
    
    // ✅ Check for file_path that starts with /uploads/
    if (image.file_path && typeof image.file_path === 'string' && image.file_path.startsWith('/uploads/')) {
      const localUrl = `http://localhost:8000${image.file_path}`;
      console.log('📁 Using local image from file_path:', localUrl);
      return localUrl;
    }
    
    // ✅ Check for filename (local uploaded image)
    if (image.filename && typeof image.filename === 'string') {
      const localUrl = `http://localhost:8000/uploads/${image.filename}`;
      console.log('📁 Using local image from filename:', localUrl);
      return localUrl;
    }
    
    // ✅ Fallback: if image has id but no URL, try to construct from id
    if (image.id) {
      console.warn('⚠️ Image has ID but no URL/filename:', image.id);
    }
    
    console.warn('⚠️ No valid image source found:', image);
    return '';
  };

  if (!pageData) {
    return (
      <ParticipantLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#89D7B7] border-t-transparent" />
        </div>
      </ParticipantLayout>
    );
  }

  const layoutClass = {
    'grid-layout-2x2': 'grid-cols-2',
    'grid-layout-3x2': 'grid-cols-3',
    'stack-vertical': 'grid-cols-1 max-w-md mx-auto',
    'row-horizontal': 'grid-cols-4'
  }[pageData.layout_class] || 'grid-cols-2';

  // ✅ Get images from pageData - handle both possible structures
  const images = pageData.images || [];

  return (
    <ParticipantLayout>
      <div className="min-h-screen flex items-center justify-center p-3 sm:p-4">
        <div className="glass-card p-4 sm:p-6 md:p-8 max-w-3xl w-full">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 sm:mb-6">
            <span className="text-xs sm:text-sm text-[#89D7B7] font-medium">
              Page {pageNumber} of {pageData.total_pages}
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`
                w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-base sm:text-lg
                ${timer <= 3 ? 'bg-red-500 text-white animate-pulse' : 'bg-[#428475] text-white'}
              `}>
                {timer}s
              </div>
            </div>
          </div>

          {/* Image Grid */}
          <div className={`grid ${layoutClass} gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6`}>
            {images && images.length > 0 ? (
              images.map((image, index) => {
                const imgSrc = getImageSrc(image);
                return (
                  <motion.button
                    key={image.id || index}
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
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={image.title || image.filename || image.alt || `Option ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('❌ Image failed to load:', imgSrc);
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23428475" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#428475]/20 flex items-center justify-center text-[#428475] text-sm">
                        No Image
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-black/60 text-white text-[10px] sm:text-xs flex items-center justify-center backdrop-blur-sm">
                      {index + 1}
                    </div>
                    {selectedImage === image.id && (
                      <div className="absolute inset-0 bg-[#89D7B7]/20 flex items-center justify-center">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#89D7B7] text-[#1A312C] flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg shadow-[#89D7B7]/30">
                          ✓
                        </div>
                      </div>
                    )}
                  </motion.button>
                );
              })
            ) : (
              <div className="col-span-full text-center text-[#FFF4E1]/50 py-8">
                No images found for this page
              </div>
            )}
          </div>

          {/* Progress Dots */}
          <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
            {Array.from({ length: pageData.total_pages }, (_, i) => (
              <div
                key={i}
                className={`
                  w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-300
                  ${i + 1 < parseInt(pageNumber) ? 'bg-[#89D7B7] text-[#1A312C]' : ''}
                  ${i + 1 === parseInt(pageNumber) ? 'bg-[#428475] text-white scale-110 shadow-lg' : ''}
                  ${i + 1 > parseInt(pageNumber) ? 'bg-[#1A312C]/20 text-[#FFF4E1]/30' : ''}
                `}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <p className="text-center text-[#89D7B7]/60 text-xs sm:text-sm mt-3 sm:mt-4">
            Trust your instinct. Pick one.
          </p>
        </div>
      </div>
    </ParticipantLayout>
  );
};

export default QuizPage;