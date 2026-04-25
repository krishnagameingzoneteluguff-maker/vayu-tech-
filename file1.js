import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const app = express();
app.use(cors());
app.use(express.json());

// ===== DB =====
mongoose.connect("mongodb://127.0.0.1:27017/tracker");

// ===== MODELS =====
const User = mongoose.model("User", {
  email: String,
  password: String,
});

const Task = mongoose.model("Task", {
  userId: String,
  title: String,
  completed: Boolean,
  date: String,
  streak: { type: Number, default: 0 },
  lastCompleted: String,
});

// ===== AUTH =====
const protect = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, "SECRET");
    req.user = decoded;
    next();
  } catch {
    res.sendStatus(401);
  }
};

// ===== LOGIN =====
app.post("/register", async (req, res) => {
  const hash = await bcrypt.hash(req.body.password, 10);
  const user = await User.create({ email: req.body.email, password: hash });
  res.json(user);
});

app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  const match = await bcrypt.compare(req.body.password, user.password);

  if (!match) return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign({ id: user._id }, "SECRET");
  res.json({ token });
});

// ===== TASKS =====
app.get("/tasks", protect, async (req, res) => {
  const tasks = await Task.find({ userId: req.user.id });
  res.json(tasks);
});

app.post("/tasks", protect, async (req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const task = await Task.create({
    title: req.body.title,
    userId: req.user.id,
    completed: false,
    date: today,
  });

  res.json(task);
});

app.put("/tasks/:id", protect, async (req, res) => {
  const task = await Task.findById(req.params.id);

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0];

  if (!task.completed) {
    if (task.lastCompleted === yesterday) task.streak += 1;
    else task.streak = 1;

    task.lastCompleted = today;
  }

  task.completed = !task.completed;
  await task.save();

  res.json(task);
});

app.delete("/tasks/:id", protect, async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.json({ msg: "Deleted" });
});

app.listen(5000, () => console.log("Server running"));
