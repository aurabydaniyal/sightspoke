import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFileAlt, faUsers, faChartBar, faClock, faPlus,
  faChevronLeft, faChevronRight, faHome, faImage, 
  faLink, faDownload, faBrain, faGear
} from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/axiosConfig';
import toast from 'react-hot-toast';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalParticipants: 0,
    totalResponses: 0,
    avgTime: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [pieData, setPieData] = useState(null);
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const slideIntervalRef = useRef(null);
  const marqueeRef = useRef(null);

  // Quick Actions Buttons
  const quickActions = [
    { label: 'Dashboard', icon: faHome, path: '/admin/dashboard', color: '#428475' },
    { label: 'Quizzes', icon: faFileAlt, path: '/admin/quizzes', color: '#89D7B7' },
    { label: 'Images', icon: faImage, path: '/admin/images', color: '#1A312C' },
    { label: 'Tokens', icon: faLink, path: '/admin/tokens', color: '#428475' },
    { label: 'AI Insights', icon: faBrain, path: '/admin/ai', color: '#89D7B7' },
  ];

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (isAutoPlaying && stats.totalQuizzes > 0) {
      slideIntervalRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % 4);
      }, 3000);
    }
    return () => {
      if (slideIntervalRef.current) {
        clearInterval(slideIntervalRef.current);
      }
    };
  }, [isAutoPlaying, stats.totalQuizzes]);

  // ✅ Marquee Animation - Smooth Loop (FIXED)
  useEffect(() => {
    const marquee = marqueeRef.current;
    if (!marquee) return;
    
    // Get all buttons
    const items = marquee.querySelectorAll('button');
    if (items.length === 0) return;
    
    // Calculate width of one set of items (first 5 buttons)
    let totalWidth = 0;
    for (let i = 0; i < quickActions.length && i < items.length; i++) {
      totalWidth += items[i].offsetWidth + 12; // +12 for gap
    }
    
    // If width is 0, use fallback
    if (totalWidth === 0) {
      totalWidth = 800; // fallback width
    }
    
    let animationId = null;
    let startTime = null;
    const duration = 15000; // 15 seconds for full loop
    
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      
      const translateX = progress * totalWidth;
      marquee.style.transform = `translateX(-${translateX}px)`;
      
      animationId = requestAnimationFrame(animate);
    };
    
    // Start animation after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      animationId = requestAnimationFrame(animate);
    }, 200);
    
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      clearTimeout(timeoutId);
    };
  }, [quickActions]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const quizzesRes = await adminApi.get('/quizzes');
      const quizzes = quizzesRes.data;
      
      let allResponses = [];
      let totalParticipants = 0;
      let totalTime = 0;
      let responseCount = 0;
      
      for (const quiz of quizzes) {
        try {
          const responsesRes = await adminApi.get(`/quizzes/${quiz.id}/responses`);
          const responses = responsesRes.data;
          allResponses = [...allResponses, ...responses];
          responseCount += responses.length;
          
          const uniqueTokens = new Set(responses.map(r => r.participant_token));
          totalParticipants += uniqueTokens.size;
          
          for (const r of responses) {
            if (r.latency_ms) totalTime += r.latency_ms;
          }
        } catch (e) {}
      }
      
      const avgTime = responseCount > 0 ? (totalTime / responseCount / 1000).toFixed(1) : 0;
      
      setStats({
        totalQuizzes: quizzes.length,
        totalParticipants: totalParticipants,
        totalResponses: responseCount,
        avgTime: avgTime
      });
      
      const quizNames = quizzes.map(q => q.title || `Quiz ${q.id.slice(0,6)}`);
      const quizResponseCounts = await Promise.all(
        quizzes.map(async (q) => {
          try {
            const res = await adminApi.get(`/quizzes/${q.id}/responses`);
            return res.data.length;
          } catch { return 0; }
        })
      );
      
      setChartData({
        labels: quizNames,
        datasets: [
          {
            label: 'Responses',
            data: quizResponseCounts,
            backgroundColor: 'rgba(66, 132, 117, 0.6)',
            borderColor: '#428475',
            borderWidth: 2,
          }
        ]
      });
      
      const published = quizzes.filter(q => q.is_published).length;
      const draft = quizzes.length - published;
      setPieData({
        labels: ['Published', 'Draft'],
        datasets: [
          {
            data: [published, draft],
            backgroundColor: ['#89D7B7', '#428475'],
            borderColor: ['#89D7B7', '#428475'],
            borderWidth: 2,
            hoverBackgroundColor: ['#7BC8A8', '#3A7A6D'],
          }
        ]
      });
      
      const recent = allResponses
        .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
        .slice(0, 10)
        .map(r => ({
          action: `Response recorded for quiz`,
          time: new Date(r.submitted_at).toLocaleString(),
          type: 'info'
        }));
      
      setRecentActivity(recent.length > 0 ? recent : [
        { action: 'No activity yet', time: '—', type: 'info' }
      ]);
      
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 4);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + 4) % 4);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#428475] border-t-transparent" />
    </div>;
  }

  const statCards = [
    { 
      label: 'Total Quizzes', 
      value: stats.totalQuizzes, 
      icon: faFileAlt, 
      color: '#428475',
      bgColor: 'rgba(66, 132, 117, 0.15)',
      iconBg: 'rgba(66, 132, 117, 0.2)',
      gradient: 'from-[#428475] to-[#89D7B7]'
    },
    { 
      label: 'Participants', 
      value: stats.totalParticipants, 
      icon: faUsers, 
      color: '#89D7B7',
      bgColor: 'rgba(137, 215, 183, 0.15)',
      iconBg: 'rgba(137, 215, 183, 0.25)',
      gradient: 'from-[#89D7B7] to-[#428475]'
    },
    { 
      label: 'Responses', 
      value: stats.totalResponses, 
      icon: faChartBar, 
      color: '#1A312C',
      bgColor: 'rgba(26, 49, 44, 0.08)',
      iconBg: 'rgba(26, 49, 44, 0.15)',
      gradient: 'from-[#1A312C] to-[#428475]'
    },
    { 
      label: 'Avg. Time', 
      value: `${stats.avgTime}s`, 
      icon: faClock, 
      color: '#428475',
      bgColor: 'rgba(66, 132, 117, 0.15)',
      iconBg: 'rgba(66, 132, 117, 0.2)',
      gradient: 'from-[#428475] to-[#1A312C]'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A312C]">Dashboard</h1>
          <p className="text-[#1A312C]/60">Overview of your SightSpoke platform</p>
        </div>
        <button onClick={() => navigate('/admin/quizzes')} className="btn-neon">
          <FontAwesomeIcon icon={faPlus} /> New Quiz
        </button>
      </div>

      {/* Quick Actions - Marquee Loop Inside Box */}
      <div className="glass-card p-4 overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-[#1A312C]/50">Quick Actions</span>
          <div className="flex-1 h-px bg-[#428475]/10" />
        </div>
        
        <div className="relative overflow-hidden">
          <div 
            ref={marqueeRef}
            className="flex gap-3 whitespace-nowrap will-change-transform"
            style={{ display: 'flex', gap: '12px' }}
          >
            {/* Triple the items for seamless loop */}
            {[...quickActions, ...quickActions, ...quickActions].map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300
                  hover:scale-105 hover:shadow-lg flex-shrink-0
                  border border-white/10
                `}
                style={{
                  background: `rgba(26, 49, 44, 0.4)`,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderColor: `${action.color}30`,
                  minWidth: 'auto',
                }}
              >
                <FontAwesomeIcon icon={action.icon} style={{ color: action.color }} className="text-sm sm:text-base" />
                <span className="text-xs sm:text-sm font-medium text-white/90">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Auto-slide Stats Cards */}
      <div className="relative">
        <div className="block md:hidden">
          <div className="relative overflow-hidden rounded-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-6"
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: statCards[currentSlide].iconBg }}
                  >
                    <FontAwesomeIcon 
                      icon={statCards[currentSlide].icon} 
                      style={{ color: statCards[currentSlide].color }} 
                      className="text-2xl" 
                    />
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#1A312C]">
                      {statCards[currentSlide].value}
                    </p>
                    <p className="text-[#1A312C]/50 text-sm">
                      {statCards[currentSlide].label}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-1 w-full bg-[#1A312C]/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: statCards[currentSlide].color }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3, ease: 'linear' }}
                    key={currentSlide}
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-4">
              {statCards.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index ? 'w-6 bg-[#428475]' : 'w-2 bg-[#428475]/30'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={prevSlide}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow-lg flex items-center justify-center hover:bg-white transition-colors z-10"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-[#1A312C] text-sm" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow-lg flex items-center justify-center hover:bg-white transition-colors z-10"
            >
              <FontAwesomeIcon icon={faChevronRight} className="text-[#1A312C] text-sm" />
            </button>
          </div>
        </div>

        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 relative overflow-hidden group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-xl`} />
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: stat.iconBg }}
                >
                  <FontAwesomeIcon icon={stat.icon} style={{ color: stat.color }} className="text-xl" />
                </div>
                <div className="w-2 h-2 rounded-full" style={{ background: stat.color }} />
              </div>
              <p className="text-3xl font-bold text-[#1A312C]">{stat.value}</p>
              <p className="text-[#1A312C]/50 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-semibold text-[#1A312C] mb-4">Responses per Quiz</h3>
          {chartData && chartData.labels.length > 0 ? (
            <Bar 
              data={chartData} 
              options={{ 
                responsive: true, 
                plugins: { legend: { display: false } }, 
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } 
              }} 
              height={200} 
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-[#1A312C]/40">No quiz data available</div>
          )}
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-[#1A312C] mb-4">Quiz Status</h3>
          {pieData ? (
            <Pie 
              data={pieData} 
              options={{ 
                responsive: true, 
                plugins: { 
                  legend: { 
                    position: 'bottom',
                    labels: {
                      padding: 16,
                      usePointStyle: true,
                      pointStyle: 'circle',
                    }
                  } 
                },
                cutout: '60%',
              }} 
              height={200} 
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-[#1A312C]/40">No data</div>
          )}
        </div>
      </div>

      {/* Scrollable Recent Activity */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-[#1A312C] mb-4">Recent Activity</h3>
        <div className="max-h-48 overflow-y-auto space-y-3 pr-2">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 pb-3 border-b border-[#428475]/10 last:border-0 last:pb-0">
              <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0 bg-[#428475]" />
              <div>
                <p className="text-sm text-[#1A312C] font-medium">{activity.action}</p>
                <p className="text-xs text-[#1A312C]/40">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
        {recentActivity.length > 5 && (
          <p className="text-xs text-[#1A312C]/30 mt-3 text-center">
            Scroll to see more activity
          </p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;