import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutStartModal } from './WorkoutStartModal.jsx';

export default function WorkoutPreviewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [cat, setCat] = useState(null);
  const [showStart, setShowStart] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      setCat(e.detail);
      setIsOpen(true);
    };
    window.addEventListener('openWorkoutPreview', handler);
    return () => window.removeEventListener('openWorkoutPreview', handler);
  }, []);

  const close = () => {
    setIsOpen(false);
    setCat(null);
  };

  if (!cat) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="modal__backdrop"
            />

            <motion.div
              className="preview-modal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="preview-card">
                <div className="preview-media">
                  <img src={cat.asset} alt={cat.label} className="w-full h-full object-cover" />
                </div>

                <div className="preview-body">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{cat.label}</h3>
                      <p className="text-sm text-gray-500 mt-1">No equipment • Quick session</p>
                    </div>
                    <button onClick={close} className="preview-close">✕</button>
                  </div>

                  <div className="mt-4 text-gray-700">
                    <p className="font-semibold">What to do</p>
                    <p className="text-sm mt-2">Perform the listed bodyweight moves focusing on control and full range of motion. Scale intensity by reps/tempo.</p>

                    <p className="font-semibold mt-4">Expected effect</p>
                    <p className="text-sm mt-2">Improved strength, endurance, and mobility. Small XP reward on completion.</p>
                  </div>

                  <div className="preview-actions">
                    <div className="preview-start">
                      <button
                        onClick={() => setShowStart(true)}
                        className="btn--primary"
                      >
                        ▶ Start Workout
                      </button>
                    </div>
                    <div>
                      <button
                        onClick={() => close()}
                        className="preview-close--secondary btn--secondary"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* When user clicks start in preview, open the existing WorkoutStartModal */}
      <WorkoutStartModal
        isOpen={showStart}
        onClose={() => setShowStart(false)}
        onComplete={() => {
          setShowStart(false);
          setIsOpen(false);
        }}
        onCancel={() => setShowStart(false)}
        workoutId={cat?.key || ''}
        type="workout"
        title={`Start ${cat?.label || 'Workout'}`}
      />
    </>
  );
}
