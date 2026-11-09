// Shows the learner's own progress on the course page, from the chapters they've opened in this browser.
// site.js saves them under PROGRESS_KEY on every chapter page. Nothing is sent anywhere, and with nothing
// saved (a new visitor, a private window, blocked storage) the page shows "Not started".
const PROGRESS_KEY = "whitebox-agent-progress";

function readProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return Array.isArray(saved.opened) ? saved.opened.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

// Every chapter, in order, from the curriculum's own links: { number, title, href, part }.
const parts = [...document.querySelectorAll("[data-part]")];
const chapters = [];
parts.forEach((part, partIndex) => {
  part.querySelectorAll(".chapter-links a").forEach((link) => {
    const match = link.getAttribute("href").match(/\/(\d\d)-[^/]+\/$/);
    if (match) chapters.push({ number: Number(match[1]), title: link.textContent, href: link.getAttribute("href"), part: partIndex });
  });
});
const last = chapters[chapters.length - 1];
const opened = readProgress();
const furthest = chapters.filter((c) => opened.includes(c.number)).pop();

const label = furthest ? `Chapter ${furthest.number} of ${last.number}` : "Not started";
const finished = furthest === last;
const next = finished
  ? { title: "Your final project", href: "/courses/build-an-ai-agent/final-project/" }
  : furthest || chapters[0];
const lead = finished ? "Next:" : furthest ? "Pick up at" : "Start with";
const go = finished ? "Roll for your final project" : furthest ? `Continue chapter ${String(furthest.number).padStart(2, "0")}` : "Start chapter 00";

parts.forEach((part, index) => {
  const status = part.querySelector(".status");
  const state = !furthest || index > furthest.part ? "todo" : index < furthest.part || (finished && index === furthest.part) ? "done" : "here";
  status.className = `status ${state}`;
  status.textContent = { done: "Done", here: "You’re here", todo: "To do" }[state];
});

document.querySelectorAll("[data-progress-label]").forEach((el) => { el.textContent = label; });
document.querySelectorAll("[data-next-lead]").forEach((el) => { el.textContent = lead; });
document.querySelectorAll("[data-next]").forEach((el) => {
  el.textContent = next.title;
  el.href = next.href;
});
document.querySelectorAll("[data-go]").forEach((el) => {
  el.textContent = go;
  el.href = next.href;
});

const bar = document.querySelector("[data-progress-bar]");
bar.style.width = `${furthest ? (furthest.number / last.number) * 100 : 0}%`;
bar.parentElement.setAttribute("aria-label", label);
