# Complete WorkoutStartModal Examples

## 1. Minimal Working Example

```tsx
import React, { useState } from "react";
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";

export function SimpleExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Start Workout
      </button>

      <WorkoutStartModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={(session) => {
          console.log("✓ Workout completed in", session.estimatedDuration / 1000, "seconds");
          setIsOpen(false);
        }}
        workoutId="simple-workout"
        type="workout"
      />
    </>
  );
}
```

---

## 2. Quest Page Example (Full Implementation)

```tsx
import React, { useState } from "react";
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";
import api from "../api";

export default function QuestPage() {
  const [quest, setQuest] = useState({
    id: "quest-1",
    title: "Daily Push-ups",
    description: "100 push-ups"
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [sessionData, setSessionData] = useState(null);

  // When user starts quest → open modal with timer
  const handleStartQuest = () => {
    setShowModal(true);
  };

  // When timer finishes naturally → complete quest in backend
  const handleModalComplete = async (session) => {
    console.log("Timer finished! Session:", session);
    
    setSessionData(session);
    setShowModal(false);

    try {
      // Complete quest in backend
      await api.post(`/quests/complete/${quest.id}`, {
        sessionId: session.id,
        duration: session.estimatedDuration
      });
      
      setIsCompleted(true);
      console.log("✓ Quest completed in backend!");
    } catch (error) {
      console.error("Failed to complete quest:", error);
    }
  };

  // When user cancels mid-timer
  const handleModalCancel = (session) => {
    console.log("Quest cancelled:", session);
    setShowModal(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{quest.title}</h1>
      <p className="text-gray-600 mb-6">{quest.description}</p>

      {!isCompleted ? (
        <button
          onClick={handleStartQuest}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          ▶ START QUEST
        </button>
      ) : (
        <div className="p-4 bg-green-100 border border-green-400 rounded-lg">
          <h2 className="text-xl font-bold text-green-800">🎉 Quest Completed!</h2>
          <p className="text-green-700 mt-2">
            Duration: {(sessionData.estimatedDuration / 1000).toFixed(0)}s
          </p>
        </div>
      )}

      {/* Modal Integration */}
      <WorkoutStartModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={handleModalComplete}
        onCancel={handleModalCancel}
        workoutId={quest.id}
        type="quest"
        title={`Start ${quest.title}`}
      />
    </div>
  );
}
```

---

## 3. Workout Page Example (Full Implementation)

```tsx
import React, { useState } from "react";
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";
import api from "../api";

export default function WorkoutPage() {
  // Form state
  const [workoutName, setWorkoutName] = useState("");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [workouts, setWorkouts] = useState([]);
  const [message, setMessage] = useState("");

  // Step 1: User fills form and clicks "Start"
  const handleStartWorkout = () => {
    if (!workoutName.trim()) {
      setMessage("Please enter a workout name");
      return;
    }
    setShowModal(true);
    setIsLogging(true);
  };

  // Step 2: Timer finishes → log workout
  const handleModalComplete = async (session) => {
    console.log("Workout timer finished! Session:", session);
    
    setShowModal(false);

    try {
      // Log workout to backend
      const response = await api.post("/workouts", {
        name: workoutName,
        sets: parseInt(sets),
        reps: parseInt(reps),
        duration: Math.round(session.estimatedDuration / 60000) // Convert ms to minutes
      });

      // Add to list
      setWorkouts([response.data, ...workouts]);
      
      // Reset form
      setWorkoutName("");
      setSets(3);
      setReps(10);
      setIsLogging(false);
      
      setMessage(`✓ ${workoutName} logged successfully!`);
      setTimeout(() => setMessage(""), 3000);

      console.log("✓ Workout logged in backend!");
    } catch (error) {
      console.error("Failed to log workout:", error);
      setMessage("Error logging workout");
      setIsLogging(false);
    }
  };

  // Step 3: User cancels timer
  const handleModalCancel = (session) => {
    console.log("Workout cancelled:", session);
    setShowModal(false);
    setIsLogging(false);
    setMessage("Workout cancelled - not logged");
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Log a Workout</h1>

      {/* Form */}
      <div className="space-y-4 mb-8 p-6 bg-gray-50 rounded-lg">
        <div>
          <label className="block text-sm font-semibold mb-2">Workout Name</label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g., Chest Day, Morning Run"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLogging}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Sets</label>
            <input
              type="number"
              value={sets}
              onChange={(e) => setSets(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLogging}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Reps</label>
            <input
              type="number"
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLogging}
            />
          </div>
        </div>

        {message && (
          <p className={message.includes("✓") ? "text-green-600" : "text-red-600"}>
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleStartWorkout}
            disabled={isLogging}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
          >
            ▶ START WORKOUT
          </button>
          <button
            disabled={isLogging}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400"
          >
            LOG DIRECTLY
          </button>
        </div>
      </div>

      {/* Recent Workouts List */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Workouts</h2>
        {workouts.length === 0 ? (
          <p className="text-gray-500">No workouts yet. Start one above!</p>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <div key={workout.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{workout.name}</h3>
                <p className="text-sm text-gray-600">
                  Sets: {workout.sets} | Reps: {workout.reps} | Duration: {workout.duration}m
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Integration */}
      <WorkoutStartModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setIsLogging(false);
        }}
        onComplete={handleModalComplete}
        onCancel={handleModalCancel}
        workoutId={`${workoutName}-${Date.now()}`}
        type="workout"
        title={`Start ${workoutName}`}
      />
    </div>
  );
}
```

---

## 4. Advanced: With Session Persistence

```tsx
import React, { useState, useEffect } from "react";
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";
import api from "../api";

interface WorkoutSession {
  id: string;
  workoutId: string;
  startTime: number;
  endTime: number;
  duration: number;
  completed: boolean;
  notes?: string;
}

export function AdvancedWorkoutExample() {
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState({ total: 0, avgDuration: 0 });

  // Load sessions from API on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await api.get("/workouts/sessions");
      setSessions(response.data.sessions);
      calculateStats(response.data.sessions);
    } catch (error) {
      console.error("Failed to load sessions:", error);
    }
  };

  const calculateStats = (allSessions: WorkoutSession[]) => {
    const completed = allSessions.filter(s => s.completed);
    const total = completed.length;
    const avgDuration = total > 0
      ? completed.reduce((sum, s) => sum + s.duration, 0) / total
      : 0;

    setStats({ total, avgDuration });
  };

  const handleModalComplete = async (session) => {
    // Save session to backend with analytics
    try {
      const response = await api.post("/workouts/sessions", {
        sessionId: session.id,
        estimatedDuration: session.estimatedDuration,
        actualDuration: Date.now() - session.startTime,
        completed: true
      });

      // Update local state
      setSessions([response.data, ...sessions]);
      calculateStats([response.data, ...sessions]);
      
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-gray-600">Total Workouts</p>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-gray-600">Avg Duration</p>
          <p className="text-3xl font-bold">{stats.avgDuration.toFixed(0)}m</p>
        </div>
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold"
      >
        ▶ START WORKOUT
      </button>

      {/* Modal */}
      <WorkoutStartModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={handleModalComplete}
        workoutId={`session-${Date.now()}`}
        type="workout"
      />

      {/* Session History */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Workout History</h2>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="p-4 border rounded-lg">
              <div className="flex justify-between">
                <p className="font-semibold">{session.workoutId}</p>
                <p className="text-sm text-gray-600">
                  {(session.duration / 60000).toFixed(1)}m
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(session.startTime).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 5. Edge Cases & Error Handling

```tsx
import React, { useState } from "react";
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";

export function ErrorHandlingExample() {
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleModalComplete = async (session) => {
    setIsProcessing(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Handle potential errors
      if (Math.random() > 0.9) {
        throw new Error("Network error");
      }

      console.log("✓ Workout saved successfully");
      setShowModal(false);
    } catch (err) {
      setError(`Failed: ${err.message}`);
      // Don't close modal - let user try again
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      <button onClick={() => setShowModal(true)}>Start Workout</button>

      <WorkoutStartModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setError("");
        }}
        onComplete={handleModalComplete}
        workoutId="test"
        type="workout"
      />

      {isProcessing && <p>Saving...</p>}
    </div>
  );
}
```

---

## 6. Styling Customization

```tsx
// If you want to customize colors, update the component's className attributes

// Default colors in WorkoutStartModal:
// - Primary: bg-green-600 (START button)
// - Secondary: bg-card-bg (modal background)
// - Accent: border-neon-cyan (borders)
// - Alert: border-red-500 (CANCEL button)

// To customize, modify these classes in WorkoutStartModal.tsx:
export const WorkoutStartModal = ({ ... }) => {
  return (
    <>
      {/* Change this for different START button color: */}
      <motion.button
        className="bg-green-600 to-green-500"  // ← Modify here
      />

      {/* Change this for different modal background: */}
      <div className="card w-full max-w-md"  // ← Uses .card class
      />

      {/* Change this for different accent color: */}
      <motion.input
        className="border-neon-cyan"  // ← Modify here
      />
    </>
  );
};
```

---

## Testing These Examples

1. Copy one example into a new component file
2. Update imports to match your project structure
3. Run: `npm run dev`
4. Test the modal with various time inputs
5. Try cancelling, reloading, etc.

Each example builds on the previous one with more features!
