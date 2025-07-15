// main.js
console.log("MineWatch site active.");

// Highlight active nav link
document.querySelectorAll("nav a").forEach(a => {
  if (a.href === location.href) a.classList.add("active");
});

// Cameras page — add hover styling and click logging
const cams = document.querySelectorAll("#cameras a"); // adjust selector
cams.forEach(c => {
  c.addEventListener("mouseenter", () => c.classList.add("hovered"));
  c.addEventListener("mouseleave", () => c.classList.remove("hovered"));
  c.addEventListener("click", e => console.log("Selected camera:", c.textContent));
});

// Guestbook — prevent empty submission
const form = document.querySelector("form");
if (form) {
  form.addEventListener("submit", e => {
    const name = form.querySelector("input[name='name']").value.trim();
    const msg = form.querySelector("textarea[name='message']").value.trim();
    if (!name || !msg) {
      e.preventDefault();
      alert("Name and message are required!");
    }
  });
}

// Camera view page — toggle chat visibility
const chat = document.querySelector("#chat");
if (chat) {
  const btn = document.createElement("button");
  btn.textContent = "Toggle Chat";
  document.body.insertBefore(btn, chat);
  btn.addEventListener("click", () => {
    chat.style.display = chat.style.display === "none" ? "" : "none";
  });
}id