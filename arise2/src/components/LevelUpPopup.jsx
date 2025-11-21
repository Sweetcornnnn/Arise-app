import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LevelUpPopup({ level, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="card p-8 text-center max-w-md animate-achievement-slide"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="text-6xl mb-4"
          >
            ⭐
          </motion.div>
          <motion.h2
            className="quest-title text-3xl mb-4"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            LEVEL UP!
          </motion.h2>
          <div className="xp-text text-2xl font-bold mb-2">Level {level}</div>
          <div className="description-text">Congratulations! You've reached a new level.</div>
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(0, 184, 255, 0.7)', '0 0 0 10px rgba(0, 184, 255, 0)', '0 0 0 0 rgba(0, 184, 255, 0)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-4 w-full h-2 bg-gradient-to-r from-neon-cyan to-cyan-400 rounded-full"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
