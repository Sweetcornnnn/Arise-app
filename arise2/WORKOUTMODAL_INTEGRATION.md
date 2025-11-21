# WorkoutStartModal - Integration Guide

## Overview
`WorkoutStartModal` is a reusable React component that manages workout/quest timing with localStorage persistence. It ensures workouts are only marked as completed if the timer finishes naturally while the app is open.

---

## File Locations
- **Component**: `src/components/WorkoutStartModal.tsx`
- **Updated Quest Page**: `src/pages/Quest-Updated.jsx` (replaces Quest.jsx)
- **Updated Workout Page**: `src/pages/Workout-Updated.jsx` (replaces Workout.jsx)

---

## Component API

### Props
```typescript
interface WorkoutStartModalProps {
  isOpen: boolean;                    // Controls modal visibility
  onClose: () => void;                // Called when user closes without starting
  onComplete: (sessionData) => void;  // Called when timer finishes naturally
  onCancel?: (sessionData) => void;   // Called when user cancels mid-workout
  workoutId: string;                  // Unique identifier (quest.id, user-timestamp, etc)
  type: "workout" | "quest";          // Activity type
  title?: string;                     // Modal header (default: "Start Daily Quest" or "Start Workout")
}
```

### Session Data Structure
```typescript
interface WorkoutSession {
  id: string;                    // Unique session ID
  type: "workout" | "quest";     // Activity type
  startTime: number;             // Timestamp when started
  estimatedDuration: number;     // Duration in milliseconds
  endTime?: number;              // Timestamp when completed/cancelled
  isActive: boolean;             // Whether session is currently active
}
```

---

## Key Features

### 1. **Time Input Parsing**
Accepts multiple formats:
- `30` → 30 minutes
- `1:30` → 1 minute 30 seconds
- `1:30:45` → 1 hour 30 minutes 45 seconds

### 2. **localStorage Persistence**
- Stores active session with key: `"activeWorkoutSession"`
- Automatically invalidates unfinished sessions on page reload
- Session data includes timestamps for backend validation

### 3. **Automatic Invalidation**
- On page load, checks if an unfinished session exists in localStorage
- If found, immediately invalidates it and calls `onCancel()`
- Ensures workouts can't be "completed" after user closes the app

### 4. **Countdown Display**
- Live countdown timer with hh:mm:ss format
- Animated progress bar
- Timer updates localStorage every second

---

## Integration Example: Quest.jsx

### 1. **Import the component**
```jsx
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";
```

### 2. **Add state for modal management**
```jsx
const [showStartModal, setShowStartModal] = useState(false);
const [questInProgress, setQuestInProgress] = useState(false);
```

### 3. **Create handlers**
```jsx
// Open modal when user clicks "Start Quest"
const handleOpenStartModal = () => {
  setShowStartModal(true);
};

// When timer finishes
const handleModalComplete = async (sessionData) => {
  console.log("Quest completed:", sessionData);
  setShowStartModal(false);
  setQuestInProgress(false);
  
  // Now actually complete the quest in backend
  await handleCompleteQuest();
};

// When user cancels
const handleModalCancel = (sessionData) => {
  console.log("Quest cancelled:", sessionData);
  setQuestInProgress(false);
  setShowStartModal(false);
};
```

### 4. **Replace the complete button**
```jsx
// OLD (direct completion):
<button onClick={handleComplete}>✓ COMPLETE</button>

// NEW (with modal timer):
<button onClick={handleOpenStartModal} disabled={questInProgress}>
  ▶ START QUEST
</button>
```

### 5. **Add modal to JSX**
```jsx
<WorkoutStartModal
  isOpen={showStartModal}
  onClose={() => {
    setShowStartModal(false);
    setQuestInProgress(false);
  }}
  onComplete={handleModalComplete}
  onCancel={handleModalCancel}
  workoutId={quest?.id || ""}
  type="quest"
  title={`Start ${quest?.title || "Quest"}`}
/>
```

---

## Integration Example: Workout.jsx

### 1. **Import the component**
```jsx
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";
```

### 2. **Add state**
```jsx
const [showStartModal, setShowStartModal] = useState(false);
const [workoutInProgress, setWorkoutInProgress] = useState(false);
const [currentWorkoutName, setCurrentWorkoutName] = useState("");
```

### 3. **Create handlers**
```jsx
// When timer finishes
const handleModalComplete = async (sessionData) => {
  console.log("Workout timer finished:", sessionData);
  setShowStartModal(false);
  
  // Log the workout to backend
  await logWorkoutToBackend();
};

// When user cancels
const handleModalCancel = (sessionData) => {
  console.log("Workout cancelled:", sessionData);
  setWorkoutInProgress(false);
  setShowStartModal(false);
  setError("Workout cancelled - not logged");
};

// Open modal before logging
const handleStartWorkout = () => {
  if (!name.trim()) {
    setError("Please enter a workout name first");
    return;
  }
  setCurrentWorkoutName(name);
  setWorkoutInProgress(true);
  setShowStartModal(true);
};
```

### 4. **Update form submission**
```jsx
// Before: Log workout immediately
// After: Open timer modal first

const handleSubmit = (e) => {
  e.preventDefault();
  if (!name.trim()) {
    setError("Please enter a workout name");
    return;
  }
  
  // Just set state - don't log yet
  setCurrentWorkoutName(name);
  setShowStartModal(true);
};
```

### 5. **Add two buttons**
```jsx
<button type="button" onClick={handleStartWorkout}>
  ▶ START WORKOUT
</button>
<button type="submit">
  LOG WORKOUT (without timer)
</button>
```

### 6. **Add modal to JSX**
```jsx
<WorkoutStartModal
  isOpen={showStartModal}
  onClose={() => {
    setShowStartModal(false);
    setWorkoutInProgress(false);
  }}
  onComplete={handleModalComplete}
  onCancel={handleModalCancel}
  workoutId={`${user?.id}-${Date.now()}`}
  type="workout"
  title={`Start ${currentWorkoutName || "Workout"}`}
/>
```

---

## Backend Considerations

### Storing Session Data
You may want to store the session data from `onComplete()` for analytics:

```jsx
const handleModalComplete = async (sessionData) => {
  // Optional: Send session metadata to backend
  try {
    await api.post("/workouts/session", {
      workoutId: workout.id,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      estimatedDuration: sessionData.estimatedDuration,
      completed: true
    });
  } catch (e) {
    console.error("Could not save session metadata:", e);
  }
  
  // Then complete the workout
  await logWorkoutToBackend();
};
```

---

## localStorage Structure

When a workout/quest is active, localStorage contains:

```json
{
  "activeWorkoutSession": {
    "id": "quest-12345-1700000000000",
    "type": "quest",
    "startTime": 1700000000000,
    "estimatedDuration": 1800000,
    "isActive": true
  }
}
```

On page reload, if `isActive: true`, it's automatically invalidated:
```json
{
  "activeWorkoutSession": {
    "id": "quest-12345-1700000000000",
    "type": "quest",
    "startTime": 1700000000000,
    "estimatedDuration": 1800000,
    "endTime": 1700000005000,
    "isActive": false
  }
}
```

---

## UI Components

### Modal States

**Before Starting:**
- Time input field (with format examples)
- "START" and "CLOSE" buttons
- Input validation with error messages

**During Countdown:**
- Large hh:mm:ss display
- Animated progress bar
- "CANCEL WORKOUT/QUEST" button (red)
- Disabled time input

### Styling
- Uses TailwindCSS classes from your existing theme
- `.card` - Card background
- `.quest-title` - Title styling
- `.description-text` - Body text
- `.xp-text` - XP color (cyan)
- `.neon-cyan` - Cyan accent color
- Framer Motion animations for smooth transitions

---

## Testing Checklist

- [ ] Modal opens when "Start" button clicked
- [ ] Time input accepts all three formats (30, 1:30, 1:30:45)
- [ ] Timer counts down correctly
- [ ] Closing tab/reloading invalidates unfinished session
- [ ] Finishing timer calls `onComplete()`
- [ ] Clicking "Cancel" calls `onCancel()` and invalidates session
- [ ] localStorage is cleaned up after completion
- [ ] Parent component receives session data correctly
- [ ] UI is responsive on mobile

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Modal doesn't close after completion | Check that `onComplete()` calls `setShowStartModal(false)` |
| Timer keeps running after cancel | `clearInterval()` is called in `handleCancel()` |
| localStorage not clearing | Check that `clearSessionFromStorage()` is called |
| Unfinished workout not invalidated on reload | Verify `checkForUnfinishedSession()` runs on mount |
| TypeScript errors | Ensure `tsconfig.json` supports `.tsx` files and strict mode |

---

## Migration Steps

1. **Add the WorkoutStartModal.tsx component** to `src/components/`
2. **Update Quest.jsx** - Add modal state and handlers, replace complete button
3. **Update Workout.jsx** - Add modal state, modify form submission flow
4. **Test both pages** for modal functionality and timer accuracy
5. **Verify localStorage** persists session data correctly
6. **Test page reload** during active workout to verify invalidation

---

## Additional Notes

- Component uses React 19+ features (no class components)
- Framer Motion for smooth animations
- TypeScript for type safety
- Tailwind CSS for styling
- No external timer libraries (pure setTimeout/setInterval)
- Self-contained localStorage management
- Flexible for future extensions (e.g., pausing timer, notifications)
