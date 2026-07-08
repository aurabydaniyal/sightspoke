import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBrain, faFileAlt, faChartBar, faClock, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../api/axiosConfig';
import { useAlert } from '../components/common/CustomAlert';

const AIInsightsPage = () => {
  const { error } = useAlert();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get('/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#428475] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A312C] flex items-center gap-3">
          <FontAwesomeIcon icon={faBrain} className="text-[#428475]" />
          AI Insights
        </h1>
        <p className="text-[#1A312C]/50 text-sm">
          AI-powered insights from your quizzes
        </p>
      </div>

      {quizzes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-[#1A312C] mb-2">No Quizzes Yet</h3>
          <p className="text-[#1A312C]/50 mb-4">Create a quiz to start getting AI insights</p>
          <button
            onClick={() => navigate('/admin/quizzes/create')}
            className="btn-neon"
          >
            Create Quiz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="glass-card p-6 hover:border-[#428475]/30 transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/admin/quizzes/${quiz.id}/details`)}
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-[#1A312C] text-lg line-clamp-1">
                  {quiz.title}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  quiz.is_published 
                    ? 'bg-[#89D7B7] text-[#1A312C]' 
                    : 'bg-[#1A312C]/10 text-[#1A312C]/60'
                }`}>
                  {quiz.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              
              <p className="text-[#1A312C]/50 text-sm line-clamp-2 mb-4">
                {quiz.description || 'No description'}
              </p>

              <div className="flex items-center gap-4 text-xs text-[#1A312C]/40 mb-4">
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faFileAlt} /> {quiz.pages?.length || 0} pages
                </span>
                <span className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faChartBar} /> 0 responses
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[#428475] font-medium flex items-center gap-1">
                  <FontAwesomeIcon icon={faBrain} className="text-[#89D7B7]" />
                  AI Ready
                </span>
                <span className="text-[#428475] group-hover:translate-x-1 transition-transform duration-300">
                  <FontAwesomeIcon icon={faArrowRight} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIInsightsPage;