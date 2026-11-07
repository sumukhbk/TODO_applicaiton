const input = document.getElementById("systeminput");
const list = document.getElementById("sys-land");

// Builds one item: text on the left, delete button on the right
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

// Convert the items already written in the HTML
Array.from(list.children).forEach((li) => {
  li.replaceWith(createItem(li.textContent.trim()));
});

function addsys() {
  const text = input.value.trim();
  if (!text) return;

  list.appendChild(createItem(text)); // uses createItem, so the × is included
  list.scrollTop = list.scrollHeight;
  input.value = "";
  input.focus();
}

// One listener handles delete clicks for all items
list.addEventListener("click", (e) => {
  if (e.target.classList.contains("del-btn")) {
    e.target.closest("li").remove();
  }
});

document.getElementById("addbtn").addEventListener("click", addsys);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addsys();
});
