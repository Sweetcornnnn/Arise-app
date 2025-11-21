import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const validateUsername = (value) => {
    if (value.length < 4 || value.length > 20) {
      return 'Username must be 4-20 characters.';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return 'Username can only have letters, numbers, and underscores.';
    }
    return '';
  };

  const validatePassword = (value) => {
    if (value.length < 8 || value.length > 20) {
      return 'Password must be 8-20 characters.';
    }
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return 'Password needs uppercase, lowercase, number, and special character.';
    }
    return '';
  };

  async function handleSignup(e) {
    e.preventDefault();
    const userErr = validateUsername(username);
    const passErr = validatePassword(password);

    setUsernameError(userErr);
    setPasswordError(passErr);
    setError('');
    setSuccess('');

    if (userErr || passErr) return;

    try {
      const res = await axios.post('http://localhost:3001/api/register', {
        username,
        password
      });
      setSuccess('Registration successful! Redirecting...');
      localStorage.setItem('user', JSON.stringify(res.data));
      setUsername('');
      setPassword('');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark-navy to-dark-bg text-white p-6">
      <motion.div
        className="card p-8 w-96 animate-fade-in"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h2
          className="quest-title text-3xl mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          SIGN UP
        </motion.h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm mb-2 font-semibold">Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg bg-card-bg border border-neon-cyan focus:border-glow-cyan transition-all duration-300"
              required
            />
            {usernameError && <p className="text-red-400 text-sm mt-1">{usernameError}</p>}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm mb-2 font-semibold">Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-card-bg border border-neon-cyan focus:border-glow-cyan transition-all duration-300"
              required
            />
            {passwordError && <p className="text-red-400 text-sm mt-1">{passwordError}</p>}
          </motion.div>

          {error && (
            <motion.p
              className="text-red-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}
          {success && (
            <motion.p
              className="text-green-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {success}
            </motion.p>
          )}

          <motion.button
            type="submit"
            className="w-full p-3 rounded-lg bg-gradient-to-r from-neon-cyan to-cyan-400 text-dark-navy font-bold hover:shadow-glow-cyan transition-all duration-300 animate-glow"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            SIGN UP
          </motion.button>
        </form>

        <motion.p
          className="mt-6 text-center description-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Already have an account? <Link to="/" className="text-neon-cyan hover:text-cyan-400 transition-colors duration-300">Log in</Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
