const input = document.getElementById("systeminput");
const list = document.getElementById("sys-land");

function createItem(text) {
  const li = document.createElement("li");

  const span = document.createElement("span");
  span.className = "item-text";
  span.textContent = text;

  const del = document.createElement("button");
  del.className = "del-btn";
  del.type = "button";
  del.textContent = "×";
  del.setAttribute("aria-label", "Delete " + text);

  li.append(span, del);
  return li;
}

function setupSidebar() {
  const input = document.getElementById("systeminput");
  const list = document.getElementById("sys-land");

  Array.from(list.children).forEach((li) => {
    li.replaceWith(createItem(li.textContent.trim()));
  });
}

function addsys() {
  const text = input.value.trim();
  if (!text) return;

  list.appendChild(createItem(text));
  list.scrollTop = list.scrollHeight;
  input.value = "";
  input.focus();
}

list.addEventListener("click", (e) => {
  if (e.target.classList.contains("del-btn")) {
    e.target.closest("li").remove();
  }
});

document.getElementById("addbtn").addEventListener("click", addsys);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addsys();
});

function createTask(text) {
  const li = document.createElement("li");
  li.className = "task";

  const check = document.createElement("input");
  check.type = "checkbox";
  check.setAttribute("aria-label", "mark as done");

  const span = document.createElement("span");
  span.className = "task-text";
  span.textContent = text;

  const del = document.createElement("button");
  del.className = "task-del";
  del.type = "button";
  del.textContent = "X";
  del.setAttribute("aria-label", "Delete task");

  li.append(check, span, del);
  return li;
}

function setupTasks() {
  const input = document.getElementById("maininput");
  const list = document.getElementById("main-list");

  function addTask() {
    const text = input.value.trim();
    if (!text) return;

    const task = createTask(text);
    const firstDone = list.querySelector(".task.done");
    list.insertBefore(task, firstDone);
    task.scrollIntoView({ block: "nearest" });
    input.value = "";
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.isComposing) addTask();
  });

  list.addEventListener("click", (e) => {
    if (e.target.classList.contains("task-del")) {
      e.target.closest(".task").remove();
    }
  });

  list.addEventListener("change", (e) => {
    if (e.target.type !== "checkbox") return;

    const task = e.target.closest(".task");
    task.classList.toggle("done", e.target.checked);

    if (e.target.checked) {
      list.appendChild(task);
    } else {
      const firstDone = list.querySelector(".task.done");
      list.insertBefore(task, firstDone);
    }
  });
}

setupSidebar();
setupTasks();
