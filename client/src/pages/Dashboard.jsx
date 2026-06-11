import React, { useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Award, Activity, Zap, Wifi, WifiOff, ArrowUpRight, History, LogIn, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { AuthContext } from '../context/AuthContext'; // adjust path if needed
import { signOut } from 'firebase/auth';
import { auth } from '../context/firebase'; // adjust path if needed

const SOCKET_SERVER_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ─── Auth User Button ────────────────────────────────────────────────────────

const AuthUserButton = () => {
  const { user: firebaseUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  if (!firebaseUser) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-2 px-4 py-2 rounded-full font-bold bg-green-600 hover:bg-green-700 text-white transition-colors text-sm shadow-sm"
      >
        <LogIn size={16} />
        Log in
      </button>
    );
  }

  // Derive initials from display name or email
  const initials = firebaseUser.displayName
    ? firebaseUser.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : firebaseUser.email?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex items-center gap-2">
      {/* User chip */}
      <div className="flex items-center gap-2 pl-1 pr-4 py-1 rounded-full border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md shadow-sm">
        {firebaseUser.photoURL ? (
          <img
            src={firebaseUser.photoURL}
            alt="profile"
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-700 dark:text-green-300 font-bold text-sm">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[160px] truncate">
          {firebaseUser.displayName || firebaseUser.email}
        </span>
      </div>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        title="Log out"
        className="flex items-center gap-1.5 px-3 py-2 rounded-full font-bold border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500/40 transition-colors text-sm backdrop-blur-md shadow-sm"
      >
        <LogOut size={15} />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isConnected, setConnectionStatus, updatePoints } = useAppStore();
  const [recentActivity, setRecentActivity] = useState([
    { id: 1, title: 'Plastic Disposal Verified', points: '+150', time: '2 hours ago', status: 'verified' },
    { id: 2, title: 'Daily Streak Bonus', points: '+50', time: '5 hours ago', status: 'bonus' },
  ]);

  // Real-Time Socket Connection
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, { withCredentials: true });

    socket.on('connect', () => {
      setConnectionStatus(true);
      socket.emit('join_user_room', user.id);
    });

    socket.on('disconnect', () => {
      setConnectionStatus(false);
    });

    socket.on('reward_issued', (data) => {
      updatePoints(data.newTotal);

      setRecentActivity(prev => [
        { id: Date.now(), title: 'Live: Report Verified!', points: `+${data.pointsEarned}`, time: 'Just now', status: 'verified' },
        ...prev.slice(0, 3)
      ]);

      if (Notification.permission === 'granted') {
        new Notification('EcoReward Update 🌍', { body: `+${data.pointsEarned} Points. ${data.message}` });
      }
    });

    return () => socket.disconnect();
  }, [user.id, setConnectionStatus, updatePoints]);

  // Framer Motion Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8 relative">

      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-10 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-40 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-8">

        {/* Header */}
        <motion.header
          variants={itemVars}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-800"
        >
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              Command Center
            </h1>
            <p className="text-gray-500 font-medium">
              Welcome back. Your environmental impact is growing.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Live Server Status */}
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full font-bold backdrop-blur-md transition-colors shadow-sm ${
              isConnected
                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}>
              {isConnected ? <Wifi size={18} className="animate-pulse" /> : <WifiOff size={18} />}
              <span>{isConnected ? 'Live Sync Active' : 'Offline Mode'}</span>
            </div>

            {/* Admin Button */}
            <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2 rounded-full font-bold border border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm backdrop-blur-md shadow-sm"
            >
              Admin
            </button>

            {/* Login / User chip */}
            <AuthUserButton />
          </div>
        </motion.header>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-6">

          {/* Hero Metric — Total Points */}
          <motion.div
            variants={itemVars}
            className="glass rounded-[2rem] p-8 md:col-span-6 lg:col-span-8 flex flex-col justify-between relative overflow-hidden group shadow-xl"
          >
            <div className="absolute -right-12 -top-12 opacity-5 text-green-500 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none">
              <Leaf size={240} />
            </div>

            <div className="z-10">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg text-green-500"><Zap size={20} /></div>
                <p className="text-sm uppercase tracking-widest text-gray-500 font-bold">Total Balance</p>
              </div>

              <AnimatePresence mode="popLayout">
                <motion.h2
                  key={user.points}
                  initial={{ y: -20, opacity: 0, scale: 1.1, filter: 'blur(4px)', color: '#22c55e' }}
                  animate={{ y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', color: '#16a34a' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-7xl sm:text-8xl font-black tracking-tighter text-gray-900 dark:text-white"
                >
                  {user.points.toLocaleString()}
                </motion.h2>
              </AnimatePresence>
            </div>

            <div className="mt-10 z-10 flex items-center space-x-4 bg-white/40 dark:bg-gray-900/40 w-fit px-5 py-3 rounded-2xl backdrop-blur-sm border border-white/20 dark:border-gray-700/50">
              <span className="text-2xl">🌳</span>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Equivalent to 4.2kg of CO2 saved</p>
                <p className="text-xs text-gray-500">Top 15% in your city</p>
              </div>
            </div>
          </motion.div>

          {/* Secondary Metric — Rank */}
          <motion.div
            variants={itemVars}
            className="glass rounded-[2rem] p-8 md:col-span-3 lg:col-span-4 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-500"><Award size={28} /></div>
                <ArrowUpRight className="text-gray-400" />
              </div>
              <p className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-1">Current Rank</p>
              <h3 className="text-4xl font-bold dark:text-white">Level {user.level}</h3>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                <span>Progress to Lvl {user.level + 1}</span>
                <span className="text-blue-500">65%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                  className="bg-blue-500 h-full rounded-full"
                />
              </div>
            </div>
          </motion.div>

          {/* Secondary Metric — Streak */}
          <motion.div
            variants={itemVars}
            className="glass rounded-[2rem] p-8 md:col-span-3 lg:col-span-4 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 shadow-lg relative overflow-hidden"
          >
            <div className="absolute -bottom-6 -right-6 text-9xl opacity-10 pointer-events-none">🔥</div>
            <div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-orange-500/20 rounded-2xl text-orange-500"><Activity size={28} /></div>
              </div>
              <p className="text-sm uppercase tracking-widest text-gray-500 font-bold mb-1">Active Streak</p>
              <h3 className="text-4xl font-bold dark:text-white flex items-center">
                {user.streak} Days
              </h3>
            </div>
            <p className="text-sm mt-6 text-orange-500 font-bold bg-orange-500/10 px-4 py-2 rounded-xl w-fit">
              1.2x Multiplier Active!
            </p>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            variants={itemVars}
            className="glass rounded-[2rem] p-8 md:col-span-6 lg:col-span-8 flex flex-col shadow-lg"
          >
            <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
              <h3 className="text-xl font-bold dark:text-white flex items-center space-x-2">
                <History className="text-gray-400" size={20} />
                <span>Recent Activity</span>
              </h3>
              <button className="text-sm text-green-500 font-bold hover:underline">View All</button>
            </div>

            <div className="space-y-4 flex-grow">
              <AnimatePresence>
                {recentActivity.map((activity) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-white/20 dark:border-gray-700/30"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-xs text-gray-500 font-medium">{activity.time}</p>
                    </div>
                    <div className="font-black text-green-500 bg-green-500/10 px-4 py-2 rounded-xl">
                      {activity.points}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;