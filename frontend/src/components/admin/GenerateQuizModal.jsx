import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faWandMagicSparkles, faSpinner, 
  faArrowRight, faInfoCircle, faBrain,
  faUserMd, faImage
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { useAlert } from '../common/CustomAlert';

const GenerateQuizModal = ({ isOpen, onClose, onSuccess }) => {
  const { success, error, warning, info } = useAlert();
  
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [pageCount, setPageCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generatedQuiz, setGeneratedQuiz] = useState(null);

  // ✅ Page options: 3 to 6 (as backend supports)
  const pageOptions = [3, 4, 5, 6];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      warning('Please enter a survey topic');
      return;
    }
    if (!description.trim()) {
      warning('Please enter a description for psychological context');
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.post('/ai/generate-quiz', {
        topic: topic.trim(),
        description: description.trim(),
        page_count: pageCount
      });
      
      setGeneratedQuiz(response.data);
      success('Psychological survey generated successfully! 🧠');
      
      setTimeout(() => {
        onSuccess(response.data);
      }, 1500);
      
    } catch (err) {
      console.error('❌ Generate error:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to generate survey';
      error(typeof errorMsg === 'string' ? errorMsg : 'Failed to generate survey');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setTopic('');
      setDescription('');
      setPageCount(3);
      setGeneratedQuiz(null);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[92vw] max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div 
                className="glass-card p-6 sm:p-8 relative"
                style={{
                  background: 'rgba(26, 49, 44, 0.96)',
                  backdropFilter: 'blur(24px)',
                  WebkitBackdropFilter: 'blur(24px)',
                  border: '1px solid rgba(137, 215, 183, 0.15)',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
                }}
              >
                {/* Close Button */}
                <button
                  onClick={handleClose}
                  disabled={loading}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 text-[#FFF4E1]/40 hover:text-[#FFF4E1] transition-colors disabled:opacity-50 z-10"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-xl sm:text-2xl" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#428475]/20 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faBrain} className="text-[#89D7B7] text-lg sm:text-xl" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-[#FFF4E1]">
                      Generate Survey
                    </h2>
                    <p className="text-xs sm:text-sm text-[#FFF4E1]/50">
                      AI creates survey questions with psychological context
                    </p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Topic */}
                  <div>
                    <label className="block text-sm font-medium text-[#FFF4E1]/70 mb-1">
                      Survey Topic <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter survey topic..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      disabled={loading}
                      className="w-full bg-[#FFF4E1]/10 rounded-xl px-4 py-3 text-[#FFF4E1] placeholder-[#FFF4E1]/30 focus:outline-none focus:ring-2 focus:ring-[#428475] disabled:opacity-50"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-[#FFF4E1]/70 mb-1">
                      Description <span className="text-red-400">*</span>
                      <span className="text-[#FFF4E1]/30 text-xs ml-1">(psychological context)</span>
                    </label>
                    <textarea
                      placeholder="Describe the psychological aspects this survey measures..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={loading}
                      rows="3"
                      className="w-full bg-[#FFF4E1]/10 rounded-xl px-4 py-3 text-[#FFF4E1] placeholder-[#FFF4E1]/30 focus:outline-none focus:ring-2 focus:ring-[#428475] resize-none disabled:opacity-50"
                    />
                    <p className="text-xs text-[#FFF4E1]/30 mt-1">
                      💡 This description helps AI generate psychologically relevant images
                    </p>
                  </div>

                  {/* Page Count */}
                  <div>
                    <label className="block text-sm font-medium text-[#FFF4E1]/70 mb-1">
                      Number of Pages <span className="text-red-400">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {pageOptions.map((num) => (
                        <button
                          key={num}
                          onClick={() => setPageCount(num)}
                          disabled={loading}
                          className={`
                            flex-1 min-w-[44px] py-2.5 rounded-xl font-medium transition-all duration-300
                            ${pageCount === num 
                              ? 'bg-[#428475] text-white shadow-lg shadow-[#428475]/30' 
                              : 'bg-[#FFF4E1]/10 text-[#FFF4E1]/60 hover:bg-[#FFF4E1]/20'
                            }
                            disabled:opacity-50
                          `}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#FFF4E1]/30 mt-2 flex items-center gap-1">
                      <FontAwesomeIcon icon={faInfoCircle} />
                      Each page will have 2 psychologically-themed images
                    </p>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !topic.trim() || !description.trim()}
                    className="w-full btn-neon justify-center py-3.5 mt-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                        Generating Survey...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-2" />
                        Generate Survey
                        <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                      </>
                    )}
                  </button>

                  {/* Info */}
                  <div className="flex items-center gap-2 p-3 bg-[#428475]/10 rounded-xl border border-[#428475]/20">
                    <FontAwesomeIcon icon={faUserMd} className="text-[#89D7B7] text-sm flex-shrink-0" />
                    <p className="text-xs text-[#FFF4E1]/50">
                      Images are generated like <span className="text-[#89D7B7]">Psychological context</span> for expert analysis
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GenerateQuizModal;