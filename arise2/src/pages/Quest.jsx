import React, { useEffect, useState, useRef } from "react";
import api from "../api.js";
import { useStore } from "../store.js";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import LevelProgress from "../components/LevelProgress.jsx";
import { xpToLevel } from "../utils/xp.js";
import { WorkoutStartModal } from "../components/WorkoutStartModal.jsx";

function formatTime(ms) {
  if (ms <= 0) return "0s";
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) return `${hours}h ${mins}m ${String(secs).padStart(2, "0")}s`;
  if (mins > 0) return `${mins}m ${String(secs).padStart(2, "0")}s`;
  return `${secs}s`;
}

function Toast({ message, type = "success" }) {
  const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
  return (
    <motion.div
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`fixed top-4 right-4 p-4 rounded-lg text-white ${bgColor} shadow-lg`}
    >
      {message}
    </motion.div>
  );
}

export default function Quest() {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quest, setQuest] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", baseReps: 0, baseDuration: 0 });
  const [countdownMs, setCountdownMs] = useState(0);
  const timerRef = useRef(null);
  const [completeMsg, setCompleteMsg] = useState("");
  const [toast, setToast] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [isRestDay, setIsRestDay] = useState(false);

  const [showStartModal, setShowStartModal] = useState(false);
  const [questInProgress, setQuestInProgress] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      navigate("/");
    }
  }, [token, user, navigate]);

  useEffect(() => {
    fetchQuest();
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (toast) {
      const timeout = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  async function fetchQuest() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/quests/today/${user.id}`);

      
      if (res.data && res.data.restDay) {
        setQuest(null);
        setIsRestDay(true);
        const nextUnlock = res.data.nextUnlock || getTomorrowMidnight();
        startCountdown(nextUnlock);
      } else {
        const q = res.data.quest || res.data;
        setIsRestDay(false);
        setQuest(q);
        setForm({
          title: q?.title || "",
          description: q?.description || "",
          baseReps: q?.baseReps ?? 0,
          baseDuration: q?.baseDuration ?? 0,
        });

        const nextUnlock = res.data.nextUnlock || q?.nextUnlock || getTomorrowMidnight();
        startCountdown(nextUnlock);
      }
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to load quest");
    } finally {
      setLoading(false);
    }
  }

  function getTomorrowMidnight() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return tomorrow.getTime();
  }

  function startCountdown(nextUnlockTs) {
    clearInterval(timerRef.current);
    const update = () => {
      const now = Date.now();
      const ms = nextUnlockTs - now;
      setCountdownMs(ms);
      if (ms <= 0) {
        fetchQuest();
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
  }

  function scaledValue(value, level) {
    const mult = 1 + Math.max(0, level - 1) * 0.1;
    return Math.round(value * mult);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.put(`/quests/update/${user.id}`, {
        questId: quest.id,
        title: form.title,
        description: form.description,
        baseReps: Number(form.baseReps),
        baseDuration: Number(form.baseDuration),
      });
      setEditing(false);
      setToast({ message: "Quest updated!", type: "success" });
      await fetchQuest();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to update quest");
      setToast({ message: "Error updating quest", type: "error" });
    }
  }

  function playSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      
    }
  }

  
  const handleOpenStartModal = () => {
    setShowStartModal(true);
    setQuestInProgress(true);
  };

  
  const handleModalComplete = async (sessionData) => {
    console.log("Quest timer finished, completing quest:", sessionData);
    
    setShowStartModal(false);
    setQuestInProgress(false);

    
    await handleCompleteQuest();
  };

  
  const handleModalCancel = (sessionData) => {
    console.log("Quest cancelled:", sessionData);
    setQuestInProgress(false);
    setShowStartModal(false);
    setToast({ message: "Quest cancelled", type: "error" });
  };

  
  async function handleCompleteQuest() {
    setError("");
    try {
      playSound();
      const res = await api.post(`/quests/complete/${user.id}`, { questId: quest.id });
      setCompleteMsg(res.data.message || "Quest complete!");
      setToast({ message: "🎉 Quest completed!", type: "success" });
      
      try {
        const profileRes = await api.get('/profile');
        useStore.getState().setAuth(token, profileRes.data.user);
      } catch (e) {
        console.error('Could not refresh profile', e);
      }
      setTimeout(() => navigate('/home'), 2500);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || "Failed to complete quest");
      setToast({ message: "Error completing quest", type: "error" });
    }
  }

  if (loading) 
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );

  if (error) return <div className="min-h-screen p-6 bg-gray-900 text-white"><p className="text-red-400">{error}</p></div>;
  if (!quest && !isRestDay) return <div className="min-h-screen p-6 bg-gray-900 text-white">No quest found.</div>;

  const xp = quest.xp ?? user?.xp ?? 0;
  const levelInfo = xpToLevel(xp);
  const level = levelInfo.level;
  const progress = levelInfo.progress;

  const scaledReps = scaledValue(quest.baseReps ?? 10, level);
  const scaledDuration = scaledValue(quest.baseDuration ?? 20, level);

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-bg text-white p-6">
      <div className="max-w-3xl mx-auto">
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
                  CHATROOM
                </motion.h1>
                <nav className="flex space-x-6">
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <Link to="/home" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold">
                      DASHBOARD
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }}>
                    <Link to="/workouts" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold">
                      WORKOUTS
                    </Link>
                  </motion.div>
                </nav>
              </motion.header>

        {!isOpen && (
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="w-full mb-4 p-4 bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            📋 Open Daily Quest
          </motion.button>
        )}

        <motion.div
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0, height: isOpen ? "auto" : 0 }}
          transition={{ duration: 0.4 }}
          style={{ overflow: "hidden" }}
        >
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-6 mb-6 animate-fade-in"
            >
              {/* If it's a rest day show a friendly rest message; otherwise show the quest */}
              {isRestDay ? (
                <div className="text-center py-8">
                  <motion.h2 className="quest-title text-2xl mb-4">Rest Day</motion.h2>
                  <p className="description-text mb-4">Today is a rest day. Take time to recover — light walking, stretching, and hydration are recommended.</p>
                  <div className="mb-4">
                    <div className="text-sm description-text mb-2">Next quest in</div>
                    <div className="text-xl font-mono xp-text">{formatTime(countdownMs)}</div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 rounded font-semibold bg-gray-800 hover:bg-gray-700 transition"
                  >
                    Close
                  </motion.button>
                </div>
              ) : (
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <motion.h2
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="quest-title text-2xl"
                    >
                      {quest.title}
                    </motion.h2>
                  </div>

                  {/* Media: gif or video guide */}
                  {quest.mediaUrl && (
                    <div className="mb-4 w-full max-h-64 overflow-hidden rounded">
                      {quest.mediaType === 'video' ? (
                        <video
                          src={quest.mediaUrl}
                          controls
                          className="w-full h-auto rounded bg-black"
                          preload="metadata"
                        />
                      ) : (
                        <img src={quest.mediaUrl} alt={quest.title + ' guide'} className="w-full h-auto rounded object-cover" />
                      )}
                    </div>
                  )}

                  <p className="description-text mb-4">{quest.description}</p>

                  {/* Clear instructions and expected effect */}
                  <div className="mb-4 p-4 bg-gray-800 rounded border border-gray-700">
                    <div className="font-semibold mb-2">Instructions</div>
                    <div className="text-sm text-gray-300 mb-2">{quest.instructions || `Perform the exercise for ${scaledDuration} minutes following good form. Adjust intensity to match your fitness.`}</div>
                    <div className="text-xs text-gray-400">Expected effect: {`Improved ${quest.title.toLowerCase()}, better endurance/strength and a small XP reward.`}</div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mb-4"
                  >
                    <div className="text-sm description-text mb-2">Difficulty (scales with level)</div>
                    <div className="flex gap-3 mt-1 flex-wrap">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="card px-3 py-2"
                      >
                        💪 Reps: <span className="xp-text">{scaledReps}</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="card px-3 py-2"
                      >
                        ⏱️ Duration: <span className="xp-text">{scaledDuration}m</span>
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="card px-3 py-2 text-yellow-300 font-semibold animate-pulse"
                      >
                        ⏳ {formatTime(countdownMs)}
                      </motion.div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="mb-4"
                  >
                    <LevelProgress level={level} progress={progress} />
                  </motion.div>

                  {!completeMsg && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="flex gap-3 flex-wrap"
                    >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenStartModal}
                    disabled={questInProgress || !quest}
                    className="px-4 py-2 rounded font-semibold hover:shadow-glow-cyan transition-all duration-300 animate-glow disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ▶ START QUEST
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setEditing((s) => !s)}
                    className="px-4 py-2 rounded font-semibold hover:shadow-glow-cyan transition-all duration-300 animate-glow"
                  >
                    {editing ? '✕ CANCEL' : '✎ EDIT'}
                  </motion.button>
                    </motion.div>
                  )}

                  {completeMsg && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="mt-4 p-4 bg-gradient-to-r from-green-800 to-green-700 rounded-lg border border-green-500"
                    >
                      <motion.div
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="font-semibold text-lg"
                      >
                        🎉 {completeMsg}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-sm text-gray-200 mt-2"
                      >
                        Redirecting...
                      </motion.div>
                    </motion.div>
                  )}
                </div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="w-40 text-right card p-4 animate-slide-up"
                >
                  <div className="text-sm description-text">Level</div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-4xl font-bold xp-text animate-pulse"
                  >
                    {level}
                  </motion.div>
                </motion.div>
              </div>
              )}


              {editing && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleUpdate}
                  className="mt-4 bg-gray-900 p-4 rounded border border-gray-700"
                >
                  <label className="block text-sm text-gray-300 mb-2">Title</label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 mb-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <label className="block text-sm text-gray-300 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 mb-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Reps</label>
                      <input
                        type="number"
                        value={form.baseReps}
                        onChange={(e) => setForm({ ...form, baseReps: e.target.value })}
                        className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Duration (min)</label>
                      <input
                        type="number"
                        value={form.baseDuration}
                        onChange={(e) => setForm({ ...form, baseDuration: e.target.value })}
                        className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="px-3 py-1 rounded font-semibold hover:shadow-glow-cyan transition-all duration-300 animate-glow"
                  >
                    SAVE
                  </motion.button>
                  </div>
                </motion.form>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 description-text text-sm italic"
              >
                💭 <span className="xp-text">{quest?.quote || 'Keep grinding!'}</span>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* WorkoutStartModal Integration */}
      <WorkoutStartModal
        isOpen={showStartModal}
        onClose={() => {
          setShowStartModal(false);
          setQuestInProgress(false);
        }}
        onComplete={handleModalComplete}
        onCancel={handleModalCancel}
        workoutId={quest?.id || ""}
        type="quest"
        title={`Start ${quest?.title || "Quest"}`}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
