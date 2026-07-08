import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBolt, 
  faHome, 
  faFileAlt, 
  faImages, 
  faLink, 
  faDownload, 
  faCog, 
  faUser, 
  faSignOutAlt,
  faBars,
  faTimes,
  faBrain  // ✅ ADD THIS
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const menuItems = [
    { path: '/admin/dashboard', icon: faHome, label: 'Dashboard' },
    { path: '/admin/quizzes', icon: faFileAlt, label: 'Quizzes' },
    { path: '/admin/images', icon: faImages, label: 'Images' },
    { path: '/admin/tokens', icon: faLink, label: 'Tokens' },
    { path: '/admin/export', icon: faDownload, label: 'Export' },
    { path: '/admin/ai', icon: faBrain, label: 'AI Insights' },  // ✅ ADD THIS
    { path: '/admin/settings', icon: faCog, label: 'Settings' },
  ];

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-cream">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1A312C] p-4 flex items-center justify-between">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="text-white text-2xl focus:outline-none"
        >
          <FontAwesomeIcon icon={isOpen ? faTimes : faBars} />
        </button>
        <div className="flex items-center gap-2 text-white">
          <FontAwesomeIcon icon={faBolt} className="text-[#89D7B7]" />
          <span className="font-bold text-lg">SightSpoke</span>
        </div>
        <div className="w-8"></div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-[#1A312C] z-50
          flex flex-col shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 transition-transform duration-300
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-[#428475]/20 flex items-center gap-3">
          <FontAwesomeIcon icon={faBolt} className="text-[#89D7B7] text-3xl" />
          <span className="text-white font-bold text-2xl tracking-tight">SightSpoke</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                ${isActive(item.path) 
                  ? 'bg-[#428475] text-white shadow-lg shadow-[#428475]/20' 
                  : 'text-white/70 hover:bg-[#428475]/20 hover:text-white'
                }
              `}
              onClick={() => setIsOpen(false)}
            >
              <FontAwesomeIcon icon={item.icon} className="w-5" />
              <span className="font-medium">{item.label}</span>
              {isActive(item.path) && (
                <motion.div
                  layoutId="active-indicator"
                  className="ml-auto w-1.5 h-6 bg-[#89D7B7] rounded-full"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-[#428475]/20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#428475]/10">
            <div className="w-10 h-10 rounded-full bg-[#428475] flex items-center justify-center text-white font-bold">
              A
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Admin</p>
              <p className="text-white/50 text-xs">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-[#428475]/20 transition-all duration-300 border border-white/10 hover:border-[#428475]/30"
          >
            <FontAwesomeIcon icon={faSignOutAlt} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className={`
        lg:ml-72 min-h-screen transition-all duration-300
        ${isOpen ? 'lg:ml-72' : 'lg:ml-72'}
        pt-16 lg:pt-0
      `}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Sidebar;