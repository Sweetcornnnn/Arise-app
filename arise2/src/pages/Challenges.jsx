import React from 'react';
import WorkoutPreviewModal from '../components/WorkoutPreviewModal.jsx';

// Challenges.jsx
// "Home Workout - No Equipment" selection screen
// - Responsive 2-3 column grid
// - Image placeholders (gradient + SVG) with overlay title
// - Rounded cards, soft shadows, energetic palette

const CATEGORIES = [
  { key: 'fullbody', label: 'Full Body', asset: '/assets/fullbody.svg' },
  { key: 'abs', label: 'Abs', asset: '/assets/abs.svg' },
  { key: 'chest', label: 'Chest', asset: '/assets/chest.svg' },
  { key: 'arms', label: 'Arms', asset: '/assets/arms.svg' },
  { key: 'legs', label: 'Legs', asset: '/assets/legs.svg' },
  { key: 'shoulders_back', label: 'Shoulders & Back', asset: '/assets/shoulders_back.svg' },
  { key: 'butt', label: 'Butt', asset: '/assets/butt.svg' },
  { key: 'stretching', label: 'Stretching', asset: '/assets/stretching.svg' },
  { key: 'fatburn', label: 'Fat Burn', asset: '/assets/fatburn.svg' },
];

export default function Challenges() {
  return (
    <div className="page--challenges">
      <header className="challenges__header">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Choose Your Workout</h1>
        <p className="challenges__subtitle">No Equipment Needed</p>
      </header>

      <main className="challenges__main">
        <section className="challenges__grid">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              aria-label={`Choose ${cat.label} workout`}
              className="challenge__card"
              onClick={() => window.dispatchEvent(new CustomEvent('openWorkoutPreview', { detail: cat }))}
            >
              {/* Image placeholder (top portion) */}
              <div className="challenge__media">
                <img src={cat.asset} alt={cat.label} className="w-full h-full object-cover" />
              </div>

              {/* Title overlay - bottom gradient bar */}
              <div className="challenge__overlay">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="challenge__label">{cat.label}</div>
                    <div className="challenge__meta">Quick • No equipment</div>
                  </div>
                  <div className="ml-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      className="w-5 h-5 opacity-90"
                    >
                      <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Subtle info area */}
              <div className="challenge__info">
                <div className="text-sm text-gray-300 font-semibold">{cat.label} Workout</div>
                <div className="challenge__meta">{Math.floor(10 + Math.random() * 30)} min • Beginner</div>
              </div>
            </button>
          ))}
        </section>

        <footer className="mt-8 text-center text-xs text-gray-400">
          Built for quick at-home sessions — tap a card to preview or start.
        </footer>
      </main>

      {/* Mount the workout preview modal so it can open when cards dispatch events */}
      <WorkoutPreviewModal />
    </div>
  );
}
