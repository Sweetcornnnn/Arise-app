# WorkoutStartModal - Quick Reference

## Component Location
```
src/components/WorkoutStartModal.tsx
```

## Basic Usage

### Import
```tsx
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";
```

### Minimal Example
```jsx
function MyPage() {
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = (sessionData) => {
    console.log("Workout finished:", sessionData);
    setIsOpen(false);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Start Workout</button>

      <WorkoutStartModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onComplete={handleComplete}
        workoutId="workout-123"
        type="workout"
      />
    </>
  );
}
```

---

## Props Reference

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | boolean | ✅ | Show/hide modal |
| `onClose` | function | ✅ | Called when user closes without starting |
| `onComplete` | function | ✅ | Called when timer finishes |
| `onCancel` | function | ❌ | Called when user cancels mid-timer |
| `workoutId` | string | ✅ | Unique identifier |
| `type` | "workout" \| "quest" | ✅ | Activity type |
| `title` | string | ❌ | Modal header (auto-generated if omitted) |

---

## Session Data (Returned in onComplete/onCancel)

```typescript
{
  id: "quest-123-1700000000000",
  type: "quest",
  startTime: 1700000000000,
  estimatedDuration: 1800000,      // milliseconds
  endTime: 1700000010000,           // only set after completion
  isActive: false
}
```

---

## Time Input Formats

| Input | Result |
|-------|--------|
| `30` | 30 minutes |
| `1:30` | 1 min 30 sec |
| `1:30:45` | 1h 30m 45s |
| `0:45` | 45 seconds |

---

## Key Features

✅ **Persistent Sessions** - localStorage tracks active workouts  
✅ **Auto-Invalidation** - Unfinished sessions invalidated on reload  
✅ **Time Parsing** - Multiple input formats supported  
✅ **Live Countdown** - hh:mm:ss display with progress bar  
✅ **Cancel Anytime** - Red cancel button stops timer  
✅ **Callback Handlers** - Full control over completion flow  

---

## Example: Quest Integration

```jsx
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";

export default function Quest() {
  const [showModal, setShowModal] = useState(false);
  const [quest, setQuest] = useState(null);

  const handleStart = () => setShowModal(true);

  const handleComplete = async (sessionData) => {
    // Timer finished! Now complete the quest
    await api.post(`/quests/complete/${user.id}`, {
      questId: quest.id,
      sessionId: sessionData.id
    });
    setShowModal(false);
  };

  return (
    <div>
      <button onClick={handleStart}>▶ START QUEST</button>

      <WorkoutStartModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={handleComplete}
        workoutId={quest?.id}
        type="quest"
        title={`Start ${quest?.title}`}
      />
    </div>
  );
}
```

---

## Example: Workout Integration

```jsx
import { WorkoutStartModal } from "../components/WorkoutStartModal.tsx";

export default function Workout() {
  const [showModal, setShowModal] = useState(false);
  const [workoutName, setWorkoutName] = useState("");

  const handleStart = () => setShowModal(true);

  const handleComplete = async (sessionData) => {
    // Timer finished! Log the workout
    await api.post("/workouts", {
      name: workoutName,
      duration: Math.round(sessionData.estimatedDuration / 60000)
    });
    setShowModal(false);
  };

  return (
    <div>
      <input 
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        placeholder="Workout name"
      />
      <button onClick={handleStart}>▶ START WORKOUT</button>

      <WorkoutStartModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onComplete={handleComplete}
        workoutId={`${user.id}-${Date.now()}`}
        type="workout"
      />
    </div>
  );
}
```

---

## localStorage Details

**Storage Key:** `"activeWorkoutSession"`

**When Active:**
```json
{
  "isActive": true,
  "startTime": 1700000000000,
  "estimatedDuration": 1800000
}
```

**When Reload Detected:**
- Session is marked `isActive: false`
- `onCancel()` is called automatically
- User sees "Unfinished workout detected and invalidated"

---

## Styling Classes Used

- `.card` - Modal background
- `.quest-title` - Large heading
- `.description-text` - Body text
- `.xp-text` - Cyan/accent color
- `.neon-cyan` - Cyan border color
- `.glow-cyan` - Glow effect
- Framer Motion for animations

---

## Files to Update

When deploying, replace:
1. `src/pages/Quest.jsx` ← Use `Quest-Updated.jsx`
2. `src/pages/Workout.jsx` ← Use `Workout-Updated.jsx`
3. Add `src/components/WorkoutStartModal.tsx` (new file)

---

## Troubleshooting

**Q: Modal won't close after timer finishes?**  
A: Ensure `setShowModal(false)` is called inside `handleComplete()`

**Q: localStorage showing "undefined"?**  
A: Check browser DevTools → Application → LocalStorage

**Q: Timer keeps counting after cancel?**  
A: Component calls `clearInterval()` in `handleCancel()` - verify it's being called

**Q: TypeScript errors on import?**  
A: Ensure file is `.tsx` extension and import has `.tsx` in path

---

## Performance Notes

- Timer updates localStorage every 1 second (minimal overhead)
- Only stores ~200 bytes in localStorage
- Cleanup happens automatically on completion
- No background tasks after modal closes

---

## Future Enhancements

- Add pause/resume functionality
- Notification when timer hits milestones (10s, 1m remaining)
- Voice/sound alerts
- Leaderboard integration
- Recovery mode if session lost mid-workout
