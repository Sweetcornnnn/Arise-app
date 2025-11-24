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
              className="fixed inset-0 bg-black/60 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />

            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
            >
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="h-56 bg-black">
                  <img src={cat.asset} alt={cat.label} className="w-full h-full object-cover" />
                </div>

                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{cat.label}</h3>
                      <p className="text-sm text-gray-500 mt-1">No equipment • Quick session</p>
                    </div>
                    <button onClick={close} className="text-gray-400">✕</button>
                  </div>

                  <div className="mt-4 text-gray-700">
                    <p className="font-semibold">What to do</p>
                    <p className="text-sm mt-2">Perform the listed bodyweight moves focusing on control and full range of motion. Scale intensity by reps/tempo.</p>

                    <p className="font-semibold mt-4">Expected effect</p>
                    <p className="text-sm mt-2">Improved strength, endurance, and mobility. Small XP reward on completion.</p>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={() => setShowStart(true)}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold hover:scale-105 transition"
                    >
                      ▶ Start Workout
                    </button>
                    <button
                      onClick={() => close()}
                      className="px-4 py-3 border rounded-lg text-gray-700"
                    >
                      Close
                    </button>
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
