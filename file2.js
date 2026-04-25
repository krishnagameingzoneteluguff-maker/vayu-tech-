import { useEffect, useState } from "react";

const API = "http://localhost:5000";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const token = localStorage.getItem("token");

  const fetchTasks = async () => {
    const res = await fetch(API + "/tasks", {
      headers: { Authorization: token },
    });
    const data = await res.json();
    setTasks(data);
  };

  useEffect(() => {
    if (token) {
      fetchTasks();

      // 🔔 Reminder
      Notification.requestPermission();
      setTimeout(() => {
        new Notification("Reminder 🔥", {
          body: "Complete your tasks today!",
        });
      }, 3000);
    }
  }, []);

  const login = async () => {
    const res = await fetch(API + "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    localStorage.setItem("token", data.token);
    window.location.reload();
  };

  const register = async () => {
    await fetch(API + "/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    login();
  };

  const addTask = async () => {
    await fetch(API + "/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ title }),
    });
    setTitle("");
    fetchTasks();
  };

  const toggle = async (id) => {
    await fetch(API + "/tasks/" + id, {
      method: "PUT",
      headers: { Authorization: token },
    });
    fetchTasks();
  };

  const del = async (id) => {
    await fetch(API + "/tasks/" + id, {
      method: "DELETE",
      headers: { Authorization: token },
    });
    fetchTasks();
  };

  const completed = tasks.filter(t => t.completed).length;
  const percent = tasks.length ? (completed / tasks.length) * 100 : 0;

  // ===== LOGIN SCREEN =====
  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Login</h2>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />
        <br /><br />
        <button onClick={login}>Login</button>
        <button onClick={register}>Register</button>
      </div>
    );
  }

  // ===== DASHBOARD =====
  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Daily Tracker 🔥</h2>

      <p>Progress: {percent.toFixed(0)}%</p>

      <div style={{ background: "#ddd", height: 10 }}>
        <div style={{ background: "blue", width: percent + "%", height: 10 }} />
      </div>

      <br />

      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Add task"
      />
      <button onClick={addTask}>Add</button>

      <br /><br />

      {tasks.map(t => (
        <div key={t._id}>
          <span onClick={() => toggle(t._id)}>
            {t.completed ? "✅" : "⬜"} {t.title}
          </span>
          <span> 🔥{t.streak}</span>
          <button onClick={() => del(t._id)}>❌</button>
        </div>
      ))}
    </div>
  );
}
