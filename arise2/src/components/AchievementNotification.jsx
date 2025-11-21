import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AchievementNotification({ achievement, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <div className="card p-6 max-w-sm animate-achievement-slide">
          <div className="flex items-center gap-4">
            <div className="text-4xl animate-pulse">🏆</div>
            <div>
              <div className="xp-text text-lg font-bold">Achievement Unlocked!</div>
              <div className="description-text">{achievement.title}</div>
              <div className="text-sm text-cyan-400">+{achievement.xp} XP</div>
            </div>
          </div>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 w-4 h-4 bg-neon-cyan rounded-full animate-glow"
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
