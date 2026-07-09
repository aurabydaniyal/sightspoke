import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faShieldAlt, faDatabase, faTrash, 
  faExclamationTriangle, faCheckCircle, faRefresh,
  faFileExport, faImage, faClock, faBell,
  faServer, faChartLine, faUsers, faMessage,
  faDownload, faUpload, faGear, faLock
} from '@fortawesome/free-solid-svg-icons';
import { adminApi } from '../../api/axiosConfig';
import { useAlert } from '../common/CustomAlert';

const Settings = () => {
  const { success, error, warning, info, confirm } = useAlert();
  
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalQuizzes: 0,
    totalImages: 0,
    totalResponses: 0,
    totalChats: 0,
    totalParticipants: 0,
    totalTokens: 0
  });

  // ============================================================
  // LOAD STATS
  // ============================================================
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const quizzesRes = await adminApi.get('/quizzes');
      const quizzes = quizzesRes.data;
      
      const imagesRes = await adminApi.get('/images');
      const images = imagesRes.data;
      
      let totalResponses = 0;
      let totalChats = 0;
      let totalParticipants = 0;
      let totalTokens = 0;
      
      for (const quiz of quizzes) {
        try {
          const responsesRes = await adminApi.get(`/quizzes/${quiz.id}/responses`);
          totalResponses += responsesRes.data.length;
          
          const uniqueTokens = new Set(responsesRes.data.map(r => r.participant_token));
          totalParticipants += uniqueTokens.size;
          
          try {
            const tokensRes = await adminApi.get(`/tokens/${quiz.id}`);
            totalTokens += tokensRes.data.length;
          } catch (e) {}
          
          try {
            const chatRes = await adminApi.get(`/ai/chat-logs/${quiz.id}`);
            totalChats += chatRes.data.length;
          } catch (e) {}
        } catch (e) {}
      }
      
      setStats({
        totalQuizzes: quizzes.length,
        totalImages: images.length,
        totalResponses: totalResponses,
        totalChats: totalChats,
        totalParticipants: totalParticipants,
        totalTokens: totalTokens
      });
    } catch (err) {
      error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // ACTION HANDLERS
  // ============================================================
  const handleRefresh = () => {
    loadStats();
    success('Stats refreshed!');
  };

  const handleExportAll = async () => {
    info('Exporting all data...');
    try {
      const quizzesRes = await adminApi.get('/quizzes');
      const allData = [];
      for (const quiz of quizzesRes.data) {
        try {
          const res = await adminApi.get(`/quizzes/${quiz.id}/responses`);
          allData.push({
            quiz: quiz,
            responses: res.data
          });
        } catch (e) {}
      }
      
      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sightspoke_export_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      success('Data exported successfully!');
    } catch (err) {
      error('Failed to export data');
    }
  };

  const handleClearChats = async () => {
    const confirmed = await confirm(
      'This will permanently delete all chat logs. This action cannot be undone.',
      'Clear All Chat Logs'
    );
    if (!confirmed) return;
    
    try {
      const quizzesRes = await adminApi.get('/quizzes');
      for (const quiz of quizzesRes.data) {
        // You'd need a new endpoint to delete all chats for a quiz
        // For now, show a message
      }
      warning('This feature requires a backend endpoint to delete all chat logs.');
    } catch (err) {
      error('Failed to clear chat logs');
    }
  };

  const handleDeleteAll = async () => {
    const confirmed = await confirm(
      '⚠️ This will permanently delete ALL quizzes, responses, chats, and insights. This action CANNOT be undone!',
      'Delete All Data'
    );
    if (!confirmed) return;
    
    const doubleConfirmed = await confirm(
      'Are you absolutely sure? This is irreversible!',
      'Final Confirmation'
    );
    if (!doubleConfirmed) return;
    
    warning('This feature requires a backend endpoint to delete all data.');
  };

  // ============================================================
  // STATS CARDS
  // ============================================================
  const statCards = [
    { label: 'Total Quizzes', value: stats.totalQuizzes, icon: faServer, color: '#428475' },
    { label: 'Images', value: stats.totalImages, icon: faImage, color: '#89D7B7' },
    { label: 'Responses', value: stats.totalResponses, icon: faCheckCircle, color: '#1A312C' },
    { label: 'Chat Messages', value: stats.totalChats, icon: faMessage, color: '#428475' },
    { label: 'Participants', value: stats.totalParticipants, icon: faUsers, color: '#89D7B7' },
    { label: 'Tokens', value: stats.totalTokens, icon: faLock, color: '#428475' },
  ];

  // ============================================================
  // SETTING SECTIONS
  // ============================================================
  const settingsSections = [
    {
      title: 'Data Management',
      icon: faDatabase,
      color: '#428475',
      items: [
        {
          label: 'Export All Data',
          description: 'Download all quiz data as JSON',
          icon: faDownload,
          action: handleExportAll,
          variant: 'primary'
        },
        {
          label: 'Refresh Statistics',
          description: 'Update all dashboard numbers',
          icon: faRefresh,
          action: handleRefresh,
          variant: 'secondary'
        }
      ]
    },
    {
      title: 'Maintenance',
      icon: faGear,
      color: '#89D7B7',
      items: [
        {
          label: 'Clear Chat Logs',
          description: 'Remove all chat history (affects AI insights)',
          icon: faTrash,
          action: handleClearChats,
          variant: 'warning'
        }
      ]
    },
    {
      title: 'Danger Zone',
      icon: faExclamationTriangle,
      color: '#EF4444',
      items: [
        {
          label: 'Delete All Data',
          description: 'Permanently delete everything',
          icon: faTrash,
          action: handleDeleteAll,
          variant: 'danger'
        }
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* ============================================================
           HEADER
      ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1A312C] flex items-center gap-3">
            <FontAwesomeIcon icon={faGear} className="text-[#428475]" />
            Settings
          </h1>
          <p className="text-[#1A312C]/50 text-sm">
            Manage your SightSpoke instance and data
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#1A312C]/40">
          <FontAwesomeIcon icon={faClock} />
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* ============================================================
           STATS OVERVIEW
      ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="glass-card p-4 text-center hover:border-[#428475]/20 transition-all duration-300 hover:shadow-lg"
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
              style={{ background: `${stat.color}15` }}
            >
              <FontAwesomeIcon icon={stat.icon} style={{ color: stat.color }} className="text-lg" />
            </div>
            <p className="text-xl font-bold text-[#1A312C]">{stat.value}</p>
            <p className="text-xs text-[#1A312C]/50">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ============================================================
           SETTINGS SECTIONS
      ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsSections.map((section, sectionIndex) => (
          <div 
            key={sectionIndex} 
            className="glass-card p-6 hover:border-[#428475]/10 transition-all duration-300"
            style={{
              borderColor: section.color + '30',
              borderWidth: '1px',
            }}
          >
            <h3 className="font-semibold text-[#1A312C] flex items-center gap-2 mb-4 pb-3 border-b border-[#428475]/10">
              <FontAwesomeIcon icon={section.icon} style={{ color: section.color }} />
              {section.title}
            </h3>
            
            <div className="space-y-3">
              {section.items.map((item, itemIndex) => (
                <div 
                  key={itemIndex} 
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg transition-all duration-200"
                  style={{
                    background: item.variant === 'danger' 
                      ? 'rgba(239, 68, 68, 0.05)' 
                      : item.variant === 'warning'
                      ? 'rgba(245, 158, 11, 0.05)'
                      : 'rgba(66, 132, 117, 0.05)',
                    border: item.variant === 'danger' 
                      ? '1px solid rgba(239, 68, 68, 0.15)' 
                      : item.variant === 'warning'
                      ? '1px solid rgba(245, 158, 11, 0.15)'
                      : '1px solid rgba(66, 132, 117, 0.08)',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FontAwesomeIcon 
                        icon={item.icon} 
                        style={{ 
                          color: item.variant === 'danger' ? '#EF4444' : 
                                 item.variant === 'warning' ? '#F59E0B' : '#428475' 
                        }}
                        className="text-sm"
                      />
                      <p className="text-sm font-medium text-[#1A312C]">{item.label}</p>
                    </div>
                    <p className="text-xs text-[#1A312C]/40 mt-0.5">{item.description}</p>
                  </div>
                  
                  {/* ✅ UNIFORM BUTTON SIZE */}
                  <button
                    onClick={item.action}
                    className={`
                      flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      transition-all duration-200 whitespace-nowrap min-w-[100px] h-[40px]
                      ${item.variant === 'danger' 
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20' 
                        : item.variant === 'warning'
                        ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/20'
                        : 'bg-[#428475]/10 text-[#428475] hover:bg-[#428475]/20 border border-[#428475]/20'
                      }
                    `}
                  >
                    <FontAwesomeIcon icon={item.icon} className="text-sm" />
                    {item.label}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ============================================================
           FOOTER - API ENDPOINTS REFERENCE
      ============================================================ */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-[#1A312C] flex items-center gap-2 mb-4">
          <FontAwesomeIcon icon={faShieldAlt} className="text-[#428475]" />
          Available Endpoints
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            { label: 'Quizzes', icon: faServer },
            { label: 'Images', icon: faImage },
            { label: 'Tokens', icon: faLock },
            { label: 'Export', icon: faFileExport },
            { label: 'AI Insights', icon: faChartLine },
            { label: 'Chat Logs', icon: faMessage },
          ].map((item, index) => (
            <div 
              key={index} 
              className="p-3 bg-[#428475]/5 rounded-lg text-center hover:bg-[#428475]/10 transition-colors"
            >
              <FontAwesomeIcon icon={item.icon} className="text-[#428475] text-lg mb-1" />
              <p className="text-xs font-medium text-[#1A312C]/70">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;