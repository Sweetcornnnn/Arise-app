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
    <div className="min-h-screen bg-gradient-to-br from-dark-navy to-dark-bg text-white p-6 animate-fade-in">
      <header className="max-w-4xl mx-auto mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Choose Your Workout</h1>
        <p className="mt-2 text-gray-600 text-sm sm:text-base">No Equipment Needed</p>
      </header>

      

      <main className="max-w-4xl mx-auto">
        <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              aria-label={`Choose ${cat.label} workout`}
              className="group relative overflow-hidden rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-red-300 transform transition hover:scale-105 bg-white"
              onClick={() => window.dispatchEvent(new CustomEvent('openWorkoutPreview', { detail: cat }))}
            >
              {/* Image placeholder (top portion) */}
              <div className="h-36 sm:h-40 md:h-44 bg-black flex items-center justify-center">
                <img src={cat.asset} alt={cat.label} className="w-full h-full object-cover opacity-95" />
              </div>

              {/* Title overlay - bottom gradient bar */}
              <div className="absolute left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white text-base font-bold leading-tight">{cat.label}</div>
                    <div className="text-red-200 text-xs">Quick • No equipment</div>
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

              {/* Subtle white card area for spacing (keeps tall card feel on small screens) */}
              <div className="bg-white p-3 sm:p-4">
                <div className="text-sm text-gray-700 font-semibold">{cat.label} Workout</div>
                <div className="text-xs text-gray-400 mt-1">{Math.floor(10 + Math.random() * 30)} min • Beginner</div>
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
