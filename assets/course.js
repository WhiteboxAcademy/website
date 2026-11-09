// Fills in a course page's progress from <body data-parts-released="N">.
const released = Number(document.body.dataset.partsReleased);
const parts = [...document.querySelectorAll("[data-part]")];
const label = `${released} of ${parts.length} parts released`;
const nextPart = parts[released];
const next = nextPart
  ? `Part ${released}: ${nextPart.querySelector("h3").textContent}`
  : "All parts released";

parts.forEach((part, index) => {
  const status = part.querySelector(".status");
  const state = index < released ? "released" : index === released ? "next" : "coming";
  status.className = `status ${state}`;
  status.textContent = { released: "Released", next: "Up next", coming: "Coming" }[state];
});

document.querySelectorAll("[data-part] .chapter-links").forEach((links) => {
  links.hidden = parts.indexOf(links.closest("[data-part]")) >= released;
});

document.querySelectorAll("[data-progress-label]").forEach((el) => {
  el.textContent = label;
});
document.querySelectorAll("[data-next]").forEach((el) => {
  if (nextPart) {
    el.textContent = next;
  } else {
    el.parentElement.textContent = `All ${parts.length} parts are released.`;  // the whole "Up next: ..." sentence
  }
});

const bar = document.querySelector("[data-progress-bar]");
bar.style.width = `${(released / parts.length) * 100}%`;
bar.parentElement.setAttribute("aria-label", label);
