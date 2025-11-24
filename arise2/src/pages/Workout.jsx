import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "../api.js";
import { useStore } from "../store.js";
import { Link } from "react-router-dom";
import { WorkoutStartModal } from "../components/WorkoutStartModal.jsx";

export default function Workout() {
  const user = useStore((s) => s.user);
  const token = useStore((s) => s.token);
  const setAuth = useStore((s) => s.setAuth);

  const [name, setName] = useState("");
  const [sets, setSets] = useState(0);
  const [reps, setReps] = useState(0);
  const [duration, setDuration] = useState(0);
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // WorkoutStartModal state
  const [showStartModal, setShowStartModal] = useState(false);
  const [workoutInProgress, setWorkoutInProgress] = useState(false);
  const [currentWorkoutName, setCurrentWorkoutName] = useState("");

  // Toast component (top-right notifications)
  function Toast({ message, type = "success" }) {
    const bgColor = type === "success" ? "bg-green-600" : "bg-red-600";
    return (
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`fixed top-4 right-4 p-4 rounded-lg text-white ${bgColor} shadow-lg z-50`}
      >
        {message}
      </motion.div>
    );
  }

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/workouts");
        setWorkouts(res.data.workouts || []);
      } catch (e) {
        console.error("Failed to fetch workouts:", e);
        setError("Failed to load workouts");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /**
   * Handle form submission to create a new workout entry
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    // clear any previous toast
    setToast(null);

    // Validate inputs
    if (!name.trim()) {
      setError("Please enter a workout name");
      return;
    }

    // Immediately log the workout (manual log), do not open the modal.
    // Mark as `loggedOnly` so UI can indicate it was only logged and not completed via timer.
    setCurrentWorkoutName(name);
    await logWorkoutToBackend(true);
  }

  /**
   * Called when the workout timer finishes naturally
   * This is where we actually log the workout in the backend
   */
  async function handleModalComplete(sessionData) {
    console.log("Workout timer finished, logging workout:", sessionData);
    
    setShowStartModal(false);

    // Now log the workout in the backend
    await logWorkoutToBackend(false);
  }

  /**
   * Called when user cancels the workout mid-timer
   */
  function handleModalCancel(sessionData) {
    console.log("Workout cancelled:", sessionData);
    setWorkoutInProgress(false);
    setShowStartModal(false);
    setToast({ message: "Workout cancelled - not logged", type: "error" });
  }

  /**
   * Actually log the workout to the backend
   */
  async function logWorkoutToBackend(loggedOnly = false) {
    try {
      const res = await api.post("/workouts", {
        name,
        sets: Number(sets),
        reps: Number(reps),
        duration: Number(duration)
      });
      // Support multiple backend response shapes (res.data or res.data.workout)
      const raw = (res && res.data && (res.data.workout || res.data)) || res;
      // Normalize workout object and ensure createdAt exists so date renders reliably
      const nowIso = new Date().toISOString();
      const newWorkout = {
        id: raw?.id || `local-${Date.now()}`,
        name: raw?.name ?? name,
        sets: raw?.sets ?? Number(sets),
        reps: raw?.reps ?? Number(reps),
        duration: raw?.duration ?? Number(duration),
        createdAt: raw?.createdAt ?? raw?.created_at ?? nowIso,
        // Local flag to indicate this was manually logged (not completed via modal timer)
        loggedOnly: !!loggedOnly,
        ...raw,
      };

      setWorkouts((w) => [newWorkout, ...w]);
      // Show top-right toast like Quest page
      setToast({ message: loggedOnly ? "🏷️ Workout logged (manual)" : "🎉 Workout logged successfully!", type: "success" });
      setName("");
      setSets(0);
      setReps(0);
      setDuration(0);
      setWorkoutInProgress(false);

      try {
        const profileRes = await api.get("/profile");
        setAuth(token, profileRes.data.user);
      } catch (e) {
        console.error("Could not refresh profile:", e);
      }

      // Auto-dismiss toast after 3 seconds
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      console.error(e);
      const errMsg = e?.response?.data?.error || "Failed to log workout";
      setError(errMsg);
      setToast({ message: errMsg, type: "error" });
      setWorkoutInProgress(false);
    }
  }

  /**
   * Handle opening the modal for a new workout
   */
  const handleStartWorkout = () => {
    if (!name.trim()) {
      setError("Please enter a workout name first");
      return;
    }
    setCurrentWorkoutName(name);
    setWorkoutInProgress(true);
    setShowStartModal(true);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-bg text-white p-6 animate-fade-in">
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
          WORKOUTS
        </motion.h1>
        <nav className="flex space-x-6">
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link to="/home" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold">
              DASHBOARD
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link to="/chat" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300 font-semibold">
              CHAT
            </Link>
          </motion.div>
        </nav>
      </motion.header>

      <motion.section
        className="card p-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.h2
          className="quest-title text-2xl mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          LOG A WORKOUT
        </motion.h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="Workout name (e.g., Morning Run, Chest Day)"
            className="w-full p-3 rounded-lg bg-card-bg border border-neon-cyan focus:border-glow-cyan transition-all duration-300 text-white"
            required
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            disabled={workoutInProgress}
          />
          <motion.div
            className="grid grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              placeholder="Sets"
              className="p-3 rounded-lg bg-card-bg border border-neon-cyan focus:border-glow-cyan transition-all duration-300 text-white"
              disabled={workoutInProgress}
            />
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder="Reps"
              className="p-3 rounded-lg bg-card-bg border border-neon-cyan focus:border-glow-cyan transition-all duration-300 text-white"
              disabled={workoutInProgress}
            />
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Duration (min)"
              className="p-3 rounded-lg bg-card-bg border border-neon-cyan focus:border-glow-cyan transition-all duration-300 text-white"
              disabled={workoutInProgress}
            />
          </motion.div>
          {error && (
            <motion.p
              className="text-red-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ⚠️ {error}
            </motion.p>
          )}
          {/* success is shown via top-right toast */}
          <motion.div
            className="flex gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <motion.button
              type="button"
              onClick={handleStartWorkout}
              disabled={workoutInProgress || !name.trim()}
              className="flex-1 px-6 py-3 rounded-lg font-bold bg-gradient-to-r from-green-600 to-green-500 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ▶ START WORKOUT
            </motion.button>
            <motion.button
              type="submit"
              disabled={workoutInProgress}
              className="flex-1 px-6 py-3 rounded-lg font-bold hover:shadow-glow-cyan transition-all duration-300 animate-glow disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LOG WORKOUT
            </motion.button>
          </motion.div>
        </form>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.h3
          className="quest-title text-2xl mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          RECENT WORKOUTS
        </motion.h3>
        <div className="space-y-4">
          {workouts.length === 0 && (
            <motion.p
              className="description-text text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              No workouts logged yet. Start one above!
            </motion.p>
          )}
          {workouts.map((w, index) => (
            <motion.div
              key={w.id}
              className="card p-4 flex justify-between items-start animate-slide-up"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div>
                <strong className="text-lg">{w.name}</strong>
                <div className="description-text text-sm mt-1">
                  Sets: <span className="xp-text">{w.sets}</span> | Reps: <span className="xp-text">{w.reps}</span> | Duration: <span className="xp-text">{w.duration}m</span>
                </div>
                {w.loggedOnly && (
                  <div className="mt-2 inline-block px-2 py-1 text-xs rounded bg-yellow-700 text-yellow-100 font-semibold">LOGGED</div>
                )}
              </div>
              <div className="text-xs description-text">
                {(() => {
                  try {
                    if (!w?.createdAt) return "—";
                    const d = new Date(w.createdAt);
                    if (isNaN(d.getTime())) return String(w.createdAt);
                    return d.toLocaleDateString();
                  } catch (err) {
                    return String(w.createdAt || "—");
                  }
                })()}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* WorkoutStartModal Integration */}
      <WorkoutStartModal
        isOpen={showStartModal}
        onClose={() => {
          setShowStartModal(false);
          setWorkoutInProgress(false);
        }}
        onComplete={handleModalComplete}
        onCancel={handleModalCancel}
        workoutId={`${user?.id}-${Date.now()}`}
        type="workout"
        title={`Start ${currentWorkoutName || "Workout"}`}
      />

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
