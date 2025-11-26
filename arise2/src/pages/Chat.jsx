import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import io from "socket.io-client";
import api from "../api";
import { useStore } from "../store";
import { Link } from "react-router-dom";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001");

export default function Chat() {
  const user = useStore(s => s.user);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEnd = useRef(null);

  useEffect(() => {
    (async () => {
      const res = await api.get("/messages");
      setMessages(res.data.messages || []);
    })();

    socket.on("new_message", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off("new_message");
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage() {
    if (!text.trim()) return;
    socket.emit("send_message", {
      senderId: user?.id,
      senderName: user?.username,
      content: text
    });
    setText("");
  }

  return (
    <div className="page--chat">
      <div className="chat__container">
      <motion.header
        className="chat__header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="quest-title"
          whileHover={{ scale: 1.05 }}
        >
          CHATROOM
        </motion.h1>
        <nav className="flex space-x-6">
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link to="/home" className="nav-link">
              DASHBOARD
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.1 }}>
            <Link to="/workouts" className="nav-link">
              WORKOUTS
            </Link>
          </motion.div>
        </nav>
      </motion.header>
      <motion.div
        className="chat__messages"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            className="chat__message"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
          >
            <div className="chat__meta">
              <span className="text-neon-cyan font-semibold">{msg.senderName || "anon"}</span> · <span className="text-xs">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className="chat__bubble">{msg.content}</div>
          </motion.div>
        ))}
        <div ref={messagesEnd} />
      </motion.div>

      <motion.div
        className="chat__input-row"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <motion.input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          className="chat__input"
          placeholder="Say something..."
          whileFocus={{ scale: 1.02 }}
        />
        <motion.button
          onClick={sendMessage}
          className="btn--primary chat__send"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          SEND
        </motion.button>
      </motion.div>
      </div>
    </div>
  );
}
