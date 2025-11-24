import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * WorkoutStartModal Component
 *
 * A reusable modal for starting workouts or quests with a countdown timer.
 * Features:
 * - Time input (minutes or hh:mm format)
 * - Persistent localStorage session tracking
 * - Automatic invalidation on page reload/close if timer hasn't finished
 * - Countdown display once started
 * - Callback handlers for completion and cancellation
 *
 * Props:
 * - isOpen: boolean - Controls modal visibility
 * - onClose: () => void - Called when user closes modal without starting
 * - onComplete: (sessionData) => void - Called when timer finishes naturally
 * - onCancel: (sessionData) => void - Called when user cancels mid-workout
 * - workoutId: string - Unique identifier for the workout/quest
 * - type: "workout" | "quest" - Type of activity
 */

const STORAGE_KEY = "activeWorkoutSession";

export const WorkoutStartModal = ({
  isOpen,
  onClose,
  onComplete,
  onCancel,
  workoutId,
  type,
  title = type === "quest" ? "Start Daily Quest" : "Start Workout",
}) => {
  // State management
  const [timeInput, setTimeInput] = useState("30"); // Default 30 minutes
  const [isStarted, setIsStarted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [error, setError] = useState("");

  const timerRef = useRef(null);
  const sessionRef = useRef(null);

  /**
   * Initialize modal on mount
   * Check for any unfinished sessions from localStorage
   */
  useEffect(() => {
    checkForUnfinishedSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /**
   * Format time display: hh:mm:ss
   */
  const formatTimeDisplay = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  /**
   * Parse user input (both "30" and "1:30" formats)
   * Returns duration in milliseconds
   */
  const parseTimeInput = (input) => {
    const trimmed = input.trim();

    // Handle hh:mm or mm:ss format
    if (trimmed.includes(":")) {
      const parts = trimmed.split(":");
      if (parts.length === 2) {
        const [mins, secs] = parts.map((p) => parseInt(p, 10));
        if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) {
          return null;
        }
        return (mins * 60 + secs) * 1000;
      }
      if (parts.length === 3) {
        const [hours, mins, secs] = parts.map((p) => parseInt(p, 10));
        if (isNaN(hours) || isNaN(mins) || isNaN(secs) || hours < 0 || mins < 0 || secs < 0 || mins >= 60 || secs >= 60) {
          return null;
        }
        return (hours * 3600 + mins * 60 + secs) * 1000;
      }
    }

    // Handle simple number format (minutes)
    const minutes = parseInt(trimmed, 10);
    if (isNaN(minutes) || minutes <= 0) {
      return null;
    }
    return minutes * 60 * 1000;
  };

  /**
   * Check localStorage for unfinished session on page load
   * If found, invalidate it automatically
   */
  const checkForUnfinishedSession = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        // If session was still active, it means user reloaded/closed app
        if (session.isActive) {
          console.warn("Unfinished workout/quest detected and invalidated:", session.id);
          // Automatically invalidate the session
          invalidateSession(session);
        }
      }
    } catch (e) {
      console.error("Error checking localStorage:", e);
    }
  };

  /**
   * Invalidate a session (user closed app/reloaded before completing)
   */
  const invalidateSession = (session) => {
    session.isActive = false;
    session.endTime = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    // Notify parent if onCancel provided
    if (onCancel) {
      onCancel(session);
    }
  };

  /**
   * Save session to localStorage
   */
  const saveSessionToStorage = (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    sessionRef.current = session;
  };

  /**
   * Clear session from localStorage
   */
  const clearSessionFromStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionRef.current = null;
  };

  /**
   * Start the workout/quest timer
   */
  const handleStart = () => {
    setError("");

    const durationMs = parseTimeInput(timeInput);
    if (durationMs === null || durationMs <= 0) {
      setError("Invalid time format. Use minutes (e.g., 30) or hh:mm:ss format.");
      return;
    }

    if (durationMs > 12 * 3600 * 1000) {
      // 12 hours max
      setError("Maximum duration is 12 hours.");
      return;
    }

    // Create session object
    const session = {
      id: `${type}-${workoutId}-${Date.now()}`,
      type,
      startTime: Date.now(),
      estimatedDuration: durationMs,
      isActive: true,
    };

    // Save to storage
    saveSessionToStorage(session);
    setRemainingMs(durationMs);
    setIsStarted(true);

    // Start countdown timer
    startCountdown(session, durationMs);
  };

  /**
   * Start the countdown timer
   */
  const startCountdown = (session, durationMs) => {
    let timeLeft = durationMs;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      timeLeft -= 1000;
      setRemainingMs(Math.max(0, timeLeft));

      // Update localStorage every second with remaining time
      const updatedSession = { ...session, estimatedDuration: Math.max(0, timeLeft) };
      saveSessionToStorage(updatedSession);

      // Timer finished
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        handleTimerComplete(session);
      }
    }, 1000);
  };

  /**
   * Called when timer naturally completes
   */
  const handleTimerComplete = (session) => {
    session.isActive = false;
    session.endTime = Date.now();

    // Save final state
    saveSessionToStorage(session);

    // Notify parent
    onComplete(session);

    // Reset modal
    setTimeout(() => {
      resetModal();
    }, 500);
  };

  /**
   * Handle user cancellation during workout
   */
  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const session = sessionRef.current;
    if (session) {
      session.isActive = false;
      session.endTime = Date.now();
      invalidateSession(session);
    }

    resetModal();
  };

  /**
   * Handle closing modal without starting
   */
  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    resetModal();
    onClose();
  };

  /**
   * Reset modal to initial state
   */
  const resetModal = () => {
    setIsStarted(false);
    setIsMinimized(false);
    setTimeInput("30");
    setRemainingMs(0);
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - only show when not minimized */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={!isStarted ? handleClose : undefined}
              className="fixed inset-0 bg-black bg-opacity-70 z-40 backdrop-blur-sm"
            />
          )}

          {/* Minimized Widget - appears in bottom-right corner */}
          {isMinimized && isStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed bottom-4 right-4 z-50"
            >
              <div className="card p-4 rounded-lg shadow-xl border border-neon-cyan bg-gradient-to-br from-card-bg to-card-bg/80 min-w-fit">
                <div className="flex items-center gap-4">
                  {/* Pulsing indicator */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex-shrink-0"
                  >
                    <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-lg shadow-neon-cyan" />
                  </motion.div>

                  {/* Timer display */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg xp-text">
                      {formatTimeDisplay(remainingMs)}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {type === "quest" ? "Quest" : "Workout"}
                    </span>
                  </div>

                  {/* Restore button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMinimized(false)}
                    className="flex-shrink-0 px-3 py-1 rounded bg-neon-cyan/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-card-bg transition-all duration-300 text-xs font-bold"
                  >
                    ▲ RESTORE
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Modal */}
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="card w-full max-w-md p-8 rounded-lg shadow-2xl border border-neon-cyan">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <motion.h2 className="quest-title text-2xl">{title}</motion.h2>
                  <div className="flex gap-2">
                    {/* Minimize button */}
                    {isStarted && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMinimized(true)}
                        title="Minimize to continue using the app"
                        className="text-2xl text-soft-gray hover:text-neon-cyan transition cursor-pointer"
                      >
                        ━
                      </motion.button>
                    )}
                    {/* Close button */}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={!isStarted ? handleClose : undefined}
                      disabled={isStarted && !isMinimized}
                      className={`text-2xl ${isStarted && !isMinimized ? "text-gray-600 cursor-not-allowed" : "text-soft-gray hover:text-red-500 transition cursor-pointer"}`}
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>

                {!isStarted ? (
                // Initial state: Time input
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="description-text mb-4">
                    How long do you estimate this {type} will take?
                  </p>

                  <div className="mb-6">
                    <label className="block text-sm text-gray-300 mb-2">
                      Time (minutes or hh:mm:ss)
                    </label>
                    <motion.input
                      type="text"
                      value={timeInput}
                      onChange={(e) => {
                        setTimeInput(e.target.value);
                        setError("");
                      }}
                      onKeyPress={(e) => e.key === "Enter" && handleStart()}
                      placeholder="30 or 1:30 or 1:30:45"
                      className="w-full p-3 rounded-lg bg-card-bg border border-neon-cyan focus:border-glow-cyan outline-none transition-all duration-300 text-white text-center text-lg font-semibold"
                      whileFocus={{ scale: 1.02 }}
                      disabled={isStarted}
                    />
                    <p className="text-xs text-gray-400 mt-1">Examples: 30, 1:30, 1:30:45</p>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-400 text-sm mb-4"
                    >
                      ⚠️ {error}
                    </motion.p>
                  )}

                  {/* Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStart}
                      className="flex-1 px-4 py-3 rounded-lg font-bold bg-gradient-to-r from-green-600 to-green-500 hover:shadow-lg transition-all duration-300"
                    >
                      ▶ START
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 rounded-lg font-bold border border-soft-gray text-soft-gray hover:text-red-400 hover:border-red-400 transition-all duration-300"
                    >
                      CLOSE
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                // Timer state: Countdown display
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="description-text text-center mb-6">
                    {type === "quest" ? "Quest" : "Workout"} in progress...
                  </p>

                  {/* Large countdown timer */}
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mb-8 p-6 bg-gradient-to-br from-neon-cyan/20 to-purple-600/20 rounded-lg border border-neon-cyan text-center"
                  >
                    <div className="text-xs text-gray-300 mb-2">REMAINING TIME</div>
                    <div className="text-5xl font-bold xp-text font-mono">
                      {formatTimeDisplay(remainingMs)}
                    </div>
                  </motion.div>

                  {/* Progress bar */}
                  <div className="mb-6 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-neon-cyan to-purple-600"
                      initial={{ width: "100%" }}
                      animate={{ width: `${((sessionRef.current?.estimatedDuration || 1) / ((sessionRef.current?.startTime || Date.now()) + (sessionRef.current?.estimatedDuration || 1) - Date.now())) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </div>

                  <p className="description-text text-center text-sm mb-6">
                    ⏱️ Keep the app open until the timer completes
                  </p>

                  {/* Cancel button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="w-full px-4 py-3 rounded-lg font-bold border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-all duration-300"
                  >
                    ✕ CANCEL {type === "quest" ? "QUEST" : "WORKOUT"}
                  </motion.button>
                </motion.div>
              )}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default WorkoutStartModal;
