const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./arise.db', (err) => {
  if (err) console.error('Database connection error:', err.message);
  else console.log('Connected to arise.db');
});

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    passwordHash TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT,
    sets INTEGER,
    reps INTEGER,
    duration INTEGER,
    date TEXT DEFAULT CURRENT_DATE,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    name TEXT,
    calories INTEGER,
    date TEXT DEFAULT CURRENT_DATE,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    key TEXT,
    name TEXT,
    earnedAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER,
    senderName TEXT,
    content TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    title TEXT,
    description TEXT,
    baseReps INTEGER DEFAULT 10,
    baseDuration INTEGER DEFAULT 20,
    questDate TEXT,
    completed INTEGER DEFAULT 0,
    completedAt TEXT,
    quote TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`);
});

// Middleware
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: "missing auth" });
  
  const token = auth.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "invalid token" });
  }
}

// Auth
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: "missing fields" });
  }
  
  if (username.length < 4 || username.length > 20) {
    return res.status(400).json({ error: "Username must be 4-20 characters." });
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: "Username can only have letters, numbers, and underscores." });
  }
  
  if (password.length < 8 || password.length > 20) {
    return res.status(400).json({ error: "Password must be 8-20 characters." });
  }
  
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return res.status(400).json({ error: "Password needs uppercase, lowercase, number, and special char." });
  }
  
  const hash = await bcrypt.hash(password, 10);
  db.run(
    `INSERT INTO users (username, passwordHash) VALUES (?, ?)`,
    [username, hash],
    function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      const user = { id: this.lastID, username };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ token, user });
    }
  );
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(400).json({ error: "invalid credentials" });
    
    const ok = await bcrypt.compare(password, row.passwordHash);
    if (!ok) return res.status(400).json({ error: "invalid credentials" });
    
    const user = { id: row.id, username: row.username, xp: row.xp, level: row.level };
    const token = jwt.sign(user, JWT_SECRET);
    res.json({ token, user });
  });
});

app.get("/api/profile", authMiddleware, (req, res) => {
  db.get(
    `SELECT id, username, xp, level, streak FROM users WHERE id = ?`,
    [req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ user: row });
    }
  );
});

// Workouts
app.post("/api/workouts", authMiddleware, (req, res) => {
  const { name, sets = 0, reps = 0, duration = 0 } = req.body;
  const uid = req.user.id;
  
  db.run(
    `INSERT INTO workouts (userId, name, sets, reps, duration) VALUES (?, ?, ?, ?, ?)`,
    [uid, name, sets, reps, duration],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      const xpGain = 15 + sets * 1 + Math.floor(reps * 0.1);
      db.run(`UPDATE users SET xp = xp + ? WHERE id = ?`, [xpGain, uid], (uerr) => {
        if (uerr) console.error(uerr);
      });
      
      res.json({ id: this.lastID, name, sets, reps, duration });
    }
  );
});

app.get("/api/workouts", authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM workouts WHERE userId = ? ORDER BY createdAt DESC LIMIT 200`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ workouts: rows });
    }
  );
});

// Meals
app.post("/api/meals", authMiddleware, (req, res) => {
  const { name, calories = 0 } = req.body;
  const uid = req.user.id;
  
  db.run(
    `INSERT INTO meals (userId, name, calories) VALUES (?, ?, ?)`,
    [uid, name, calories],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.run(`UPDATE users SET xp = xp + ? WHERE id = ?`, [5, uid]);
      res.json({ id: this.lastID, name, calories });
    }
  );
});

app.get("/api/meals", authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM meals WHERE userId = ? ORDER BY createdAt DESC LIMIT 200`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ meals: rows });
    }
  );
});

// Achievements
app.get("/api/achievements", authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM achievements WHERE userId = ? ORDER BY earnedAt DESC`,
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ achievements: rows });
    }
  );
});

// Messages
app.get("/api/messages", (req, res) => {
  db.all(
    `SELECT * FROM messages ORDER BY createdAt DESC LIMIT 100`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ messages: rows.reverse() });
    }
  );
});

// Quests
const QUEST_POOL = [
  { title: "Morning Run", description: "Start your day with a run", baseReps: 5, baseDuration: 20, quote: "A mile a day keeps the fatigue away." },
  { title: "Strength Training", description: "Build muscle and power", baseReps: 15, baseDuration: 30, quote: "Strength comes from overcoming what you thought you couldn't." },
  { title: "Cardio Blast", description: "Pump up your heart rate", baseReps: 20, baseDuration: 25, quote: "You can't win if you don't try." },
  { title: "Flexibility & Stretch", description: "Improve your range of motion", baseReps: 10, baseDuration: 15, quote: "Flexibility is the foundation of fitness." },
  { title: "HIIT Workout", description: "High intensity, high reward", baseReps: 30, baseDuration: 20, quote: "The pain today is the strength tomorrow." },
];

app.get("/api/quests/today/:userId", authMiddleware, (req, res) => {
  const uid = parseInt(req.params.userId);
  const today = new Date().toISOString().split('T')[0];
  
  db.get(
    `SELECT q.*, u.level, u.xp FROM quests q 
     JOIN users u ON q.userId = u.id 
     WHERE q.userId = ? AND q.questDate = ?`,
    [uid, today],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (!row) {
        const quest = QUEST_POOL[Math.floor(Math.random() * QUEST_POOL.length)];
        db.run(
          `INSERT INTO quests (userId, title, description, baseReps, baseDuration, questDate, quote) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uid, quest.title, quest.description, quest.baseReps, quest.baseDuration, today, quest.quote],
          function(err2) {
            if (err2) return res.status(500).json({ error: err2.message });
            
            db.get(
              `SELECT q.*, u.level, u.xp FROM quests q 
               JOIN users u ON q.userId = u.id 
               WHERE q.id = ?`,
              [this.lastID],
              (err3, newRow) => {
                if (err3) return res.status(500).json({ error: err3.message });
                
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(0, 0, 0, 0);
                
                res.json({ quest: newRow, nextUnlock: tomorrow.getTime() });
              }
            );
          }
        );
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        res.json({ quest: row, nextUnlock: tomorrow.getTime() });
      }
    }
  );
});

app.put("/api/quests/update/:userId", authMiddleware, (req, res) => {
  const uid = parseInt(req.params.userId);
  const { questId, title, description, baseReps, baseDuration } = req.body;
  
  db.run(
    `UPDATE quests SET title = ?, description = ?, baseReps = ?, baseDuration = ? 
     WHERE id = ? AND userId = ?`,
    [title, description, baseReps, baseDuration, questId, uid],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "quest not found" });
      res.json({ message: "quest updated" });
    }
  );
});

app.post("/api/quests/complete/:userId", authMiddleware, (req, res) => {
  const uid = parseInt(req.params.userId);
  const { questId } = req.body;
  
  db.run(
    `UPDATE quests SET completed = 1, completedAt = CURRENT_TIMESTAMP 
     WHERE id = ? AND userId = ?`,
    [questId, uid],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "quest not found" });
      
      db.run(`UPDATE users SET xp = xp + ? WHERE id = ?`, [50, uid], (uerr) => {
        if (uerr) console.error(uerr);
      });
      
      res.json({ message: "quest completed! +50 xp" });
    }
  );
});

// Socket.io Chat
io.on("connection", (socket) => {
  socket.on("send_message", (data) => {
    db.run(
      `INSERT INTO messages (senderId, senderName, content) VALUES (?, ?, ?)`,
      [data.senderId || null, data.senderName || "anon", data.content],
      function(err) {
        if (err) return console.error(err);
        const msg = {
          id: this.lastID,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
          createdAt: new Date().toISOString()
        };
        io.emit("new_message", msg);
      }
    );
  });

  socket.on("disconnect", () => {
    // user disconnected
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));