import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
  
  const [timeInput, setTimeInput] = useState("30"); 
  const [isStarted, setIsStarted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [remainingMs, setRemainingMs] = useState(0);
  const [error, setError] = useState("");

  const timerRef = useRef(null);
  const sessionRef = useRef(null);

  
  useEffect(() => {
    checkForUnfinishedSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  
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

  
  const parseTimeInput = (input) => {
    const trimmed = input.trim();

    
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

    
    const minutes = parseInt(trimmed, 10);
    if (isNaN(minutes) || minutes <= 0) {
      return null;
    }
    return minutes * 60 * 1000;
  };

  
  const checkForUnfinishedSession = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        
        if (session.isActive) {
          console.warn("Unfinished workout/quest detected and invalidated:", session.id);
          
          invalidateSession(session);
        }
      }
    } catch (e) {
      console.error("Error checking localStorage:", e);
    }
  };

  
  const invalidateSession = (session) => {
    session.isActive = false;
    session.endTime = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

    
    if (onCancel) {
      onCancel(session);
    }
  };

  
  const saveSessionToStorage = (session) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    sessionRef.current = session;
  };

  
  const clearSessionFromStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionRef.current = null;
  };

  
  const handleStart = () => {
    setError("");

    const durationMs = parseTimeInput(timeInput);
    if (durationMs === null || durationMs <= 0) {
      setError("Invalid time format. Use minutes (e.g., 30) or hh:mm:ss format.");
      return;
    }

    if (durationMs > 12 * 3600 * 1000) {
      
      setError("Maximum duration is 12 hours.");
      return;
    }

    
    const session = {
      id: `${type}-${workoutId}-${Date.now()}`,
      type,
      startTime: Date.now(),
      estimatedDuration: durationMs,
      isActive: true,
    };

    
    saveSessionToStorage(session);
    setRemainingMs(durationMs);
    setIsStarted(true);

    
    startCountdown(session, durationMs);
  };

  
  const startCountdown = (session, durationMs) => {
    let timeLeft = durationMs;

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      timeLeft -= 1000;
      setRemainingMs(Math.max(0, timeLeft));

      
      const updatedSession = { ...session, estimatedDuration: Math.max(0, timeLeft) };
      saveSessionToStorage(updatedSession);

      
      if (timeLeft <= 0) {
        clearInterval(timerRef.current);
        handleTimerComplete(session);
      }
    }, 1000);
  };

  
  const handleTimerComplete = (session) => {
    session.isActive = false;
    session.endTime = Date.now();

    
    saveSessionToStorage(session);

    
    onComplete(session);

    
    setTimeout(() => {
      resetModal();
    }, 500);
  };

  
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

  
  const handleClose = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    resetModal();
    onClose();
  };

  
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
          
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={!isStarted ? handleClose : undefined}
              className="modal__backdrop"
            />
          )}

          
          {isMinimized && isStarted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="floating-widget"
            >
              <div className="card floating-widget__card">
                <div className="flex items-center gap-4">
                  
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="flex-shrink-0"
                  >
                    <div className="w-3 h-3 rounded-full bg-neon-cyan shadow-lg shadow-neon-cyan" />
                  </motion.div>

                  
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg xp-text">
                      {formatTimeDisplay(remainingMs)}
                    </span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {type === "quest" ? "Quest" : "Workout"}
                    </span>
                  </div>

                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMinimized(false)}
                    className="restore-button"
                  >
                    ▲ RESTORE
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="modal"
            >
              <div className="card modal__dialog">
                
                <div className="modal__header">
                  <motion.h2 className="modal__title">{title}</motion.h2>
                  <div className="flex gap-2">
                    
                    {isStarted && (
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsMinimized(true)}
                        title="Minimize to continue using the app"
                        className="modal__minimize"
                      >
                        ━
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={!isStarted ? handleClose : undefined}
                      disabled={isStarted && !isMinimized}
                      className={`text-2xl modal__close ${isStarted && !isMinimized ? "text-gray-600 cursor-not-allowed" : "text-soft-gray hover:text-red-500 transition cursor-pointer"}`}
                    >
                      ✕
                    </motion.button>
                  </div>
                </div>

                {!isStarted ? (
                
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
                      className="time-input"
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

                  
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStart}
                      className="flex-1 btn--primary"
                    >
                      ▶ START
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleClose}
                      className="flex-1 btn--secondary"
                    >
                      CLOSE
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <p className="description-text text-center mb-6">
                    {type === "quest" ? "Quest" : "Workout"} in progress...
                  </p>

                  
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="mb-8 p-6 modal__progress-card text-center"
                  >
                    <div className="text-xs text-gray-300 mb-2">REMAINING TIME</div>
                    <div className="text-5xl font-bold xp-text font-mono">
                      {formatTimeDisplay(remainingMs)}
                    </div>
                  </motion.div>

                  
                  <div className="mb-6">
                    <div className="progress">
                      <motion.div
                        className="progress__bar"
                        initial={{ width: "100%" }}
                        animate={{ width: `${((sessionRef.current?.estimatedDuration || 1) / ((sessionRef.current?.startTime || Date.now()) + (sessionRef.current?.estimatedDuration || 1) - Date.now())) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                      />
                    </div>
                  </div>

                  <p className="description-text text-center text-sm mb-6">
                    ⏱️ Keep the app open until the timer completes
                  </p>

                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancel}
                    className="w-full btn--danger"
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
