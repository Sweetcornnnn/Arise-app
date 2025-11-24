import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api, { setAuthToken } from "../api";
import { useStore } from "../store";
import { Link, useNavigate } from "react-router-dom";
import LevelProgress from "../components/LevelProgress";
import QuestNotif from "../components/QuestNotif.jsx";
import { xpToLevel } from "../utils/xp";

export default function Dashboard() {
  const user = useStore((s) => s.user);
  const setAuth = useStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/profile");
        setProfile(res.data.user);
      } catch (e) {
        console.error("Failed to fetch profile:", e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function logout() {
    setAuth(null, null);
    setAuthToken(null);
    navigate('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-bg text-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const xp = profile?.xp ?? user?.xp ?? 0;
  const { level, progress } = xpToLevel(xp);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-bg text-white p-6">
      <QuestNotif />
      <motion.header
        className="flex justify-between items-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="quest-title text-4xl"
          whileHover={{ scale: 1.05 }}
        >
          DASHBOARD
        </motion.h1>
        <div className="flex items-center gap-4">
          <nav className="flex space-x-6">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link to="/workouts" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold">
                WORKOUTS
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1 }}>
              <Link to="/chat" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold">
                CHAT
              </Link>
            </motion.div>
          </nav>
          <motion.button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-all duration-300 font-semibold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            LOGOUT
          </motion.button>
        </div>
      </motion.header>

      <motion.section
        className="card p-6 mb-8 animate-fade-in"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <motion.h2
              className="text-2xl font-bold mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Welcome, {profile?.username || user?.username}
            </motion.h2>
            <motion.p
              className="description-text text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Level {level} • <span className="xp-text">{xp} XP</span>
            </motion.p>
          </div>
          <motion.div
            className="w-1/2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <LevelProgress level={level} progress={progress} />
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="card p-6 mb-8 animate-slide-up"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <motion.h3
          className="quest-title text-2xl mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          STATS OVERVIEW
        </motion.h3>
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            className="text-center card p-4 animate-pulse"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl mb-2">🚶</div>
            <div className="xp-text text-xl font-bold">12,345</div>
            <div className="description-text text-sm">Steps</div>
          </motion.div>
          <motion.div
            className="text-center card p-4 animate-pulse"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl mb-2">🔥</div>
            <div className="xp-text text-xl font-bold">567</div>
            <div className="description-text text-sm">Calories</div>
          </motion.div>
          <motion.div
            className="text-center card p-4 animate-pulse"
            whileHover={{ scale: 1.05 }}
          >
            <div className="text-3xl mb-2">🏃</div>
            <div className="xp-text text-xl font-bold">8.9 km</div>
            <div className="description-text text-sm">Distance</div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        className="animate-slide-up"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.5 }}
      >
        <motion.h3
          className="quest-title text-2xl mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          QUICK ACTIONS
        </motion.h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            className="card p-6 text-center animate-border-pulse"
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 232, 255, 0.6)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/quest" className="block">
              <div className="text-4xl mb-4">🎯</div>
              <div className="xp-text text-xl font-bold mb-2">DAILY QUEST</div>
              <div className="description-text">Complete your mission</div>
            </Link>
          </motion.div>
          <motion.div
            className="card p-6 text-center animate-border-pulse"
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 232, 255, 0.6)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/workouts" className="block">
              <div className="text-4xl mb-4">🗒️</div>
              <div className="xp-text text-xl font-bold mb-2">LOG WORKOUT</div>
              <div className="description-text">Track your progress</div>
            </Link>
          </motion.div>
          <motion.div
            className="card p-6 text-center animate-border-pulse"
            whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(0, 232, 255, 0.6)" }}
            whileTap={{ scale: 0.95 }}
          >
            <Link to="/challenges" className="block">
              <div className="text-4xl mb-4">❤️‍🔥</div>
              <div className="xp-text text-xl font-bold mb-2">CHALLENGES</div>
              <div className="description-text">Test our Limits</div>
            </Link>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
