import React from 'react';
import { motion } from 'framer-motion';

export default function LevelProgress({ progress = 0, level = 1 }) {
  const pct = Math.min(1, Math.max(0, progress));

  return (
    <div className="level-progress animate-fade-in">
      <div className="level-progress-header">
        <div className="description-text">Level {level}</div>
        <div className="xp-text level-progress-xp">{Math.round(pct * 100)}%</div>
      </div>
      <div className="progress level-progress-bar">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="progress__bar"
        />
      </div>
      <div className="level-progress-label">XP Progress</div>
    </div>
  );
}
