import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartBar, faImage, faUsers } from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import toast from 'react-hot-toast';

const QuizInsights = () => {
  const { id } = useParams();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, [id]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const response = await adminApi.get(`/quizzes/${id}/insights`);
      setInsights(response.data);
    } catch (error) {
      toast.error('Failed to load insights');
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

  if (!insights || insights.total_responses === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <FontAwesomeIcon icon={faChartBar} className="text-4xl text-[#428475]/30 mb-4" />
        <h3 className="text-xl font-semibold text-[#1A312C] mb-2">No Data Yet</h3>
        <p className="text-[#1A312C]/50">Wait for participants to complete the quiz.</p>
      </div>
    );
  }

  const stats = Object.values(insights.image_stats);
  const sortedStats = stats.sort((a, b) => b.selection_count - a.selection_count);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 text-center">
          <FontAwesomeIcon icon={faUsers} className="text-2xl text-[#428475] mb-2" />
          <p className="text-2xl font-bold text-[#1A312C]">{insights.total_responses}</p>
          <p className="text-sm text-[#1A312C]/50">Total Responses</p>
        </div>
        <div className="glass-card p-4 text-center">
          <FontAwesomeIcon icon={faImage} className="text-2xl text-[#428475] mb-2" />
          <p className="text-2xl font-bold text-[#1A312C]">{stats.length}</p>
          <p className="text-sm text-[#1A312C]/50">Images Analyzed</p>
        </div>
        <div className="glass-card p-4 text-center">
          <FontAwesomeIcon icon={faChartBar} className="text-2xl text-[#428475] mb-2" />
          <p className="text-2xl font-bold text-[#1A312C]">
            {sortedStats[0]?.percentage || 0}%
          </p>
          <p className="text-sm text-[#1A312C]/50">Most Selected</p>
        </div>
      </div>

      {/* Image Selection Chart */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-[#1A312C] mb-4">Image Selection Distribution</h3>
        <div className="space-y-3">
          {sortedStats.map((stat, index) => (
            <motion.div
              key={stat.filename}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={`http://localhost:8000${stat.url}`}
                  alt={stat.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23428475" stroke-width="1"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpath d="M21 15l-5-5L5 21"/%3E%3C/svg%3E';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#1A312C] font-medium truncate max-w-[150px]">
                    {stat.filename}
                  </span>
                  <span className="text-[#428475] font-semibold">
                    {stat.selection_count} ({stat.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-[#1A312C]/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stat.percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05 }}
                    className="h-full rounded-full"
                    style={{ background: `hsl(${170 + index * 30}, 60%, 50%)` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizInsights;