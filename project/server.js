const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ---------- storage ---------- */
let db = { systems: [], tasks: [] };
let writeQueue = Promise.resolve();

async function load() {
  try {
    db = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    // first run: start with your three example systems
    db = {
      systems: ["x1t", "xts", "xtt"].map((text) => ({
        id: randomUUID(),
        text,
      })),
      tasks: [],
    };
    await save();
  }
}

// writes are queued one at a time and go through a temp file,
// so a crash mid-write can't leave a half-written data.json
function save() {
  writeQueue = writeQueue
    .catch(() => {})
    .then(async () => {
      const tmp = DATA_FILE + ".tmp";
      await fs.writeFile(tmp, JSON.stringify(db, null, 2));
      await fs.rename(tmp, DATA_FILE);
    });
  return writeQueue;
}

/* ---------- helpers ---------- */
function cleanText(value) {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= 200 ? text : null;
}

// open tasks first (in order), completed tasks last (in order completed)
function sortedTasks() {
  const open = db.tasks.filter((t) => !t.done).sort((a, b) => a.rank - b.rank);
  const done = db.tasks
    .filter((t) => t.done)
    .sort((a, b) => a.doneAt - b.doneAt);
  return [...open, ...done];
}

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

/* ---------- systems (sidebar) ---------- */
app.get("/api/systems", (req, res) => res.json(db.systems));

app.post(
  "/api/systems",
  wrap(async (req, res) => {
    const text = cleanText(req.body.text);
    if (!text)
      return res
        .status(400)
        .json({ error: "Text is required (max 200 characters)." });

    const system = { id: randomUUID(), text };
    db.systems.push(system);
    await save();
    res.status(201).json(system);
  }),
);

app.delete(
  "/api/systems/:id",
  wrap(async (req, res) => {
    const before = db.systems.length;
    db.systems = db.systems.filter((s) => s.id !== req.params.id);
    if (db.systems.length === before)
      return res.status(404).json({ error: "Not found." });
    await save();
    res.status(204).end();
  }),
);

/* ---------- tasks (main) ---------- */
app.get("/api/tasks", (req, res) => res.json(sortedTasks()));

app.post(
  "/api/tasks",
  wrap(async (req, res) => {
    const text = cleanText(req.body.text);
    if (!text)
      return res
        .status(400)
        .json({ error: "Text is required (max 200 characters)." });

    const task = {
      id: randomUUID(),
      text,
      done: false,
      rank: Date.now(),
      doneAt: null,
    };
    db.tasks.push(task);
    await save();
    res.status(201).json(task);
  }),
);

app.patch(
  "/api/tasks/:id",
  wrap(async (req, res) => {
    const task = db.tasks.find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Not found." });
    if (typeof req.body.done !== "boolean") {
      return res.status(400).json({ error: "'done' must be true or false." });
    }

    if (req.body.done && !task.done) {
      task.done = true;
      task.doneAt = Date.now(); // goes to the end of the completed group
    } else if (!req.body.done && task.done) {
      task.done = false;
      task.doneAt = null;
      task.rank = Date.now(); // goes just above the completed tasks
    }
    await save();
    res.json(task);
  }),
);

app.delete(
  "/api/tasks/:id",
  wrap(async (req, res) => {
    const before = db.tasks.length;
    db.tasks = db.tasks.filter((t) => t.id !== req.params.id);
    if (db.tasks.length === before)
      return res.status(404).json({ error: "Not found." });
    await save();
    res.status(204).end();
  }),
);

/* ---------- errors + start ---------- */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Server error." });
});

load()
  .then(() =>
    app.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`)),
  )
  .catch((err) => {
    console.error("Could not read data.json:", err.message);
    process.exit(1);
  });
