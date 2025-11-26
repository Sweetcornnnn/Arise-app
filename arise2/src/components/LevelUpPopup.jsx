import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LevelUpPopup({ level, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal__backdrop flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          exit={{ scale: 0, rotate: 180 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="modal modal__dialog achievement-popup text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="achievement-star"
          >
            50
          </motion.div>
          <motion.h2
            className="quest-title achievement-title"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            LEVEL UP!
          </motion.h2>
          <div className="xp-text achievement-level">Level {level}</div>
          <div className="description-text achievement-desc">Congratulations! You've reached a new level.</div>
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(0, 184, 255, 0.7)', '0 0 0 10px rgba(0, 184, 255, 0)', '0 0 0 0 rgba(0, 184, 255, 0)'] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="achievement-bar"
          />
        </motion.div>
      </motion.div>
            className="mt-4 w-full h-2 bg-gradient-to-r from-neon-cyan to-cyan-400 rounded-full"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
