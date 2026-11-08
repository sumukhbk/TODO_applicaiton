/* ===================== helpers ===================== */
async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error("Request failed (" + res.status + ")");
  return res.status === 204 ? null : res.json();
}

function showError() {
  alert(
    "Could not reach the server. Make sure it is running (node server.js).",
  );
}

/* ===================== Sidebar: systems ===================== */
function createItem(system) {
  const li = document.createElement("li");
  li.dataset.id = system.id;

  const span = document.createElement("span");
  span.className = "item-text";
  span.textContent = system.text;

  const del = document.createElement("button");
  del.className = "del-btn";
  del.type = "button";
  del.textContent = "×";
  del.setAttribute("aria-label", "Delete " + system.text);

  li.append(span, del);
  return li;
}

async function setupSidebar() {
  const input = document.getElementById("systeminput");
  const list = document.getElementById("sys-land");

  try {
    const systems = await api("/api/systems");
    systems.forEach((s) => list.appendChild(createItem(s)));
  } catch {
    showError();
  }

  async function addItem() {
    const text = input.value.trim();
    if (!text) return;
    input.value = ""; // clear first so a double Enter can't add it twice

    try {
      const system = await api("/api/systems", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      list.appendChild(createItem(system));
      list.scrollTop = list.scrollHeight;
      input.focus();
    } catch {
      input.value = text; // give the text back so nothing is lost
      showError();
    }
  }

  list.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("del-btn")) return;
    const li = e.target.closest("li");
    try {
      await api("/api/systems/" + li.dataset.id, { method: "DELETE" });
      li.remove();
    } catch {
      showError();
    }
  });

  document.getElementById("addbtn").addEventListener("click", addItem);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addItem();
  });
}

/* ===================== Main: tasks ===================== */
function createTask(task) {
  const li = document.createElement("li");
  li.className = "task" + (task.done ? " done" : "");
  li.dataset.id = task.id;

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = task.done;
  check.setAttribute("aria-label", "Mark as done");

  const span = document.createElement("span");
  span.className = "task-text";
  span.textContent = task.text;

  const del = document.createElement("button");
  del.className = "task-del";
  del.type = "button";
  del.textContent = "×";
  del.setAttribute("aria-label", "Delete task");

  li.append(check, span, del);
  return li;
}

async function setupTasks() {
  const input = document.getElementById("maininput");
  const list = document.getElementById("main-list");

  // completed tasks always sit at the bottom
  function placeTask(taskEl, done) {
    taskEl.classList.toggle("done", done);
    if (done) {
      list.appendChild(taskEl);
    } else {
      list.insertBefore(taskEl, list.querySelector(".task.done"));
    }
  }

  try {
    const tasks = await api("/api/tasks"); // already sorted by the server
    tasks.forEach((t) => list.appendChild(createTask(t)));
  } catch {
    showError();
  }

  async function addTask() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";

    try {
      const task = await api("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      const el = createTask(task);
      list.insertBefore(el, list.querySelector(".task.done")); // above completed ones
      el.scrollIntoView({ block: "nearest" });
    } catch {
      input.value = text;
      showError();
    }
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) addTask();
  });

  list.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("task-del")) return;
    const el = e.target.closest(".task");
    try {
      await api("/api/tasks/" + el.dataset.id, { method: "DELETE" });
      el.remove();
    } catch {
      showError();
    }
  });

  list.addEventListener("change", async (e) => {
    if (e.target.type !== "checkbox") return;
    const el = e.target.closest(".task");
    const done = e.target.checked;

    placeTask(el, done); // update the screen right away
    try {
      await api("/api/tasks/" + el.dataset.id, {
        method: "PATCH",
        body: JSON.stringify({ done }),
      });
    } catch {
      e.target.checked = !done; // server failed: undo the change
      placeTask(el, !done);
      showError();
    }
  });
}

setupSidebar();
setupTasks();
