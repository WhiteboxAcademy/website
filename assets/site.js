// TODO: paste the email provider's form action here. The sign-up forms stay
// hidden, and the YouTube and GitHub links show instead, until this is set.
// The provider must accept a plain form POST with a field named "email".
const SIGNUP_ACTION = "";

if (SIGNUP_ACTION) {
  document.querySelectorAll("[data-signup]").forEach((form) => {
    form.action = SIGNUP_ACTION;
    form.hidden = false;
  });
  document.querySelectorAll("[data-follow]").forEach((el) => {
    el.hidden = true;
  });
}

const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".site-nav");

function setMenu(open) {
  nav.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.textContent = open ? "Close" : "Menu";
}

menuButton.addEventListener("click", () => setMenu(!nav.classList.contains("open")));

// Looping animations each have a Pause button, so nothing has to keep moving.
document.querySelectorAll("[data-pause]").forEach((button) => {
  const figure = button.closest("[data-motion]");
  button.hidden = false;
  button.addEventListener("click", () => {
    const paused = figure.classList.toggle("is-paused");
    button.setAttribute("aria-pressed", String(paused));
    button.textContent = paused ? "Play" : "Pause";
  });
});
nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

// On a chapter page of the agent course, remember in this browser that it was opened, so the course page can show
// "Pick up at". Only the chapter numbers are kept, and nothing is sent anywhere.
(() => {
  const match = location.pathname.match(/^\/courses\/build-an-ai-agent\/(\d\d)-[^/]+\/?$/);
  if (!match) return;
  try {
    const key = "whitebox-agent-progress";
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    const opened = new Set(Array.isArray(saved.opened) ? saved.opened : []);
    opened.add(Number(match[1]));
    localStorage.setItem(key, JSON.stringify({ opened: [...opened].sort((a, b) => a - b) }));
  } catch {
    // Storage blocked or full: the course page just shows "Not started".
  }
})();
