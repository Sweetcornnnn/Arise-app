import React, { useState } from "react";
import { motion } from "framer-motion";
import api, { setAuthToken } from "../api";
import { useNavigate, Link } from "react-router-dom";
import { useStore } from "../store";

export default function Login() {
  const navigate = useNavigate();
  const setAuth = useStore((s) => s.setAuth);

  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    console.log('Login: submit() called, username=', username);

    try {
      console.log('Login: posting to /login...');
      const res = await api.post("/login", { username, password });
      console.log('Login: API response received', res.data);
      const { token, user } = res.data;
      console.log('Login: calling setAuth with user.id=', user?.id);
      setAuth(token, user);
      
      try {
        
        const { setShowQuestNotifQueued } = require('../store.js');
       
      } catch (e) {
        
      }
      setAuthToken(token);
        
        try {
          useStore.getState().setShowQuestNotifQueued(true);
          console.log('Login: setShowQuestNotifQueued(true) called successfully');
        } catch (e) {
          console.error('Login: failed to set store flag', e);
        }

      
      try {
        sessionStorage.setItem('showQuestNotif', '1');
        console.log('Login: sessionStorage.showQuestNotif set to 1');
      } catch (e) {
        console.error('Login: sessionStorage failed', e);
      }

      
      try {
        window.dispatchEvent(new Event('app:showQuestNotif'));
        console.log('Login: window event dispatched app:showQuestNotif');
      } catch (e) {
        console.error('Login: event dispatch failed', e);
      }

      console.log('Login: about to navigate to /home');
      
      navigate("/home");
    } catch (err) {
      console.error('Login: caught error in submit', err?.response?.data || err);
      setError(err?.response?.data?.error || "Login failed. Please check your credentials.");
    }
  }

  return (
    <div className="page--auth">
      <motion.form
        onSubmit={submit}
        className="auth-card animate-fade-in"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="quest-title auth-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          LOGIN
        </motion.h2>
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
            <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="form-input"
            required
          />
        </motion.div>
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
            <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="form-input"
            required
          />
        </motion.div>
        {error && (
          <motion.p
            className="text-red-400 mb-4 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
        <motion.button
          type="submit"
          className="w-full btn--primary"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          LOGIN
        </motion.button>
        <motion.div
          className="mt-6 text-center description-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p>Don't have an account? <Link to="/register" className="link-neon">Register here</Link></p>
        </motion.div>
      </motion.form>
    </div>
  );
}
