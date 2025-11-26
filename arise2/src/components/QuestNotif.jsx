import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../api.js';
import { useStore } from '../store.js';

export default function QuestNotif() {
  const user = useStore((s) => s.user);
  const queuedFromStore = useStore((s) => s.showQuestNotifQueued);
  const setQueuedInStore = useStore((s) => s.setShowQuestNotifQueued);
  // Debug immediate store snapshot on mount if needed
  useEffect(() => {
    try {
      const snapshot = useStore.getState();
      console.debug('QuestNotif: mounted snapshot', {
        queued: snapshot.showQuestNotifQueued,
        user: snapshot.user?.id ?? null,
      });
      // If the queued flag was set before this component mounted, handle it immediately
      if (snapshot.showQuestNotifQueued) {
        try { snapshot.setShowQuestNotifQueued(false); } catch (e) {}
        setForceShowRequest(true);
        console.debug('QuestNotif: handled pre-mount queued flag');
      }
    } catch (e) {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [quest, setQuest] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forceShowRequest, setForceShowRequest] = useState(false);
  const navigate = useNavigate();

  // Listen for explicit login event so we can show notif immediately
  useEffect(() => {
    const handler = () => {
      console.debug('QuestNotif: received app:showQuestNotif event');
      setForceShowRequest(true);
    };
    window.addEventListener('app:showQuestNotif', handler);
    return () => window.removeEventListener('app:showQuestNotif', handler);
  }, []);

  // React to store-queued request (set by setAuth/login). Clear it immediately.
  useEffect(() => {
    if (queuedFromStore) {
      console.debug('QuestNotif: detected queuedFromStore flag');
      // clear the queued flag to avoid repeats
      try { setQueuedInStore(false); } catch (e) {}
      setForceShowRequest(true);
    }
  }, [queuedFromStore, setQueuedInStore]);

  useEffect(() => {
    // Run when user.id becomes available or when a force show was requested
    let cancelled = false;

    async function runCheck() {
      try {
        const userId = user?.id;
        if (!userId) return;

        const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const seenKey = `questNotifSeen:${userId}:${today}`;
        const remindKey = `questNotifRemind:${userId}`;

        const sessionFlagInner = (() => { try { return sessionStorage.getItem('showQuestNotif'); } catch (e) { return null; }})();
        const seenToday = localStorage.getItem(seenKey);
        const remindAt = localStorage.getItem(remindKey);
        const now = Date.now();

        let shouldShow = false;
        if (sessionFlagInner) {
          shouldShow = true;
          try { sessionStorage.removeItem('showQuestNotif'); } catch (e) {}
        } else if (!seenToday) {
          if (!remindAt) shouldShow = true;
          else if (now >= Number(remindAt)) {
            shouldShow = true;
            try { localStorage.removeItem(remindKey); } catch (e) {}
          }
        }

        console.debug('QuestNotif: check result', { userId, shouldShow, seenToday, remindAt, forceShowRequest });
        if (shouldShow || forceShowRequest) {
          // reset force flag
          setForceShowRequest(false);
          if (!cancelled) await fetchQuest();
        }
      } catch (e) {
        console.error('QuestNotif trigger failed', e);
      }
    }

    // If forceShowRequest is true but user.id missing, wait up to 5s for user.id
    if (forceShowRequest && !user?.id) {
      const start = Date.now();
      const poll = setInterval(() => {
        if (user?.id) {
          clearInterval(poll);
          runCheck();
        } else if (Date.now() - start > 5000) {
          clearInterval(poll);
          console.debug('QuestNotif: user.id not available after 5s while waiting for force show');
          setForceShowRequest(false);
        }
      }, 250);
      return () => { cancelled = true; clearInterval(poll); };
    }

    runCheck();
    return () => { cancelled = true; };
  }, [user?.id, forceShowRequest]);

  async function fetchQuest() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/quests/today/${user.id}`);
      const q = res?.data?.quest || res?.data || null;
      if (q) {
        setQuest(q);
        // play a subtle sound and open with animation
        playOpenSound();
        setOpen(true);
        // mark as shown for today so it doesn't repeat
        try {
          const today = new Date().toISOString().slice(0, 10);
          const seenKey = `questNotifSeen:${user?.id}:${today}`;
          localStorage.setItem(seenKey, '1');
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to fetch quest for notification', err);
    } finally {
      setLoading(false);
    }
  }

  function playOpenSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(880, ctx.currentTime);
      g.gain.setValueAtTime(0.001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.26);
    } catch (e) {
      // ignore audio errors (autoplay policies may block it)
    }
  }

  function remindLater(minutes = 60) {
    try {
      const remindKey = `questNotifRemind:${user?.id}`;
      const when = Date.now() + minutes * 60 * 1000;
      localStorage.setItem(remindKey, String(when));
      // close modal for now
      setOpen(false);
    } catch (e) {
      setOpen(false);
    }
  }

  if (!open || !quest) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal__backdrop"
        onClick={() => setOpen(false)}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22, duration: 0.45 }}
        className="modal modal__dialog quest-notif-modal"
      >
        <div className="modal__header">
          <h3 className="quest-title">Today's Quest</h3>
          <button onClick={() => setOpen(false)} className="btn--secondary">✕</button>
        </div>

        <div className="mb-4">
          <div className="quest-title quest-title-lg">{quest.title}</div>
          <div className="description-text quest-desc">{quest.description}</div>
        </div>

        <div className="btn-row">
          <button
            className="btn--primary flex-1"
            onClick={() => {
              setOpen(false);
              navigate('/quest');
            }}
          >
            Open Quest
          </button>

          <button
            className="btn--secondary"
            onClick={() => setOpen(false)}
          >
            Dismiss
          </button>

          <button
            className="btn--secondary btn--remind"
            onClick={() => remindLater(60)}
          >
            Remind me later
          </button>
        </div>
      </motion.div>
    </>
  );
}
