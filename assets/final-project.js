// The final-project roll. It must give exactly what final-project/roll.py gives in the course repo:
// SHA-256 of "name|time|first|second", the first 4 bytes big-endian, mod the number of ideas at the chosen level.
// Nothing here is sent anywhere. The GitHub buttons are plain links the learner chooses to open.
(() => {
  const REPO = "https://github.com/WhiteboxAcademy/BuildAnAgentFramework";
  const NEW_DISCUSSION = REPO + "/discussions/new";
  const TIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/;
  const LEVELS = [["any", "Any"], ["starter", "Starter"], ["intermediate", "Intermediate"], ["advanced", "Advanced"]];
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let data = null;
  let level = "any";
  let rolling = false;
  let last = null;

  // ---- The roll ----
  const normName = (s) => s.toLowerCase().trim().split(/\s+/).join(" ");
  const nowUtc = () => new Date().toISOString().slice(0, 19) + "Z";
  const validTime = (t) => TIME.test(t) && new Date(t).toISOString().slice(0, 19) + "Z" === t;

  async function pick(rawName, time, first, second, lvl) {
    const name = normName(rawName);
    const input = `${name}|${time}|${first}|${second}`;
    const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
    const u32 = new DataView(digest.buffer).getUint32(0, false);
    const pool = data.ideas.filter((idea) => lvl === "any" || idea.level === lvl);
    const index = u32 % pool.length;
    const hex = [...digest].map((b) => b.toString(16).padStart(2, "0")).join("");
    return { name, input, hex, u32, poolLength: pool.length, index, idea: pool[index] };
  }
  window.whiteboxRoll = (name, time, first, second, lvl = "any") => pick(name, time, first, second, lvl).then((r) => r.idea.number);

  // ---- Small helpers ----
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    Object.assign(node, props);
    for (const child of children) node.append(child);
    return node;
  }
  // Text with `backticks` becomes text with <code>, without ever parsing HTML.
  function withCode(text) {
    const frag = document.createDocumentFragment();
    String(text).split("`").forEach((part, i) => frag.append(i % 2 ? el("code", { textContent: part }) : part));
    return frag;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const shellQuote = (s) => '"' + s.replace(/[\\"$`]/g, (c) => "\\" + c) + '"';
  const display = (s) => s.trim().split(/\s+/).join(" ");
  async function copy(text, button) {
    const label = button.textContent;
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Copied";
    } catch {
      button.textContent = "Select it to copy";
    }
    setTimeout(() => { button.textContent = label; }, 2000);
  }
  function discussionLink(fields) {
    const params = new URLSearchParams({ category: "final-projects", ...fields });
    return NEW_DISCUSSION + "?" + params.toString();
  }

  // ---- Dice ----
  function drawDie(die, face) {
    die.replaceChildren(...Array.from({ length: 9 }, (_, i) => el("i", { className: face && PIPS[face].includes(i) ? "on" : "" })));
    if (face) die.dataset.face = face; else delete die.dataset.face;
  }
  function showDice(a, b) {
    drawDie(document.querySelector(".fp-die-a"), a);
    drawDie(document.querySelector(".fp-die-b"), b);
    const [btnA, btnB] = document.querySelectorAll(".fp-diebtn");
    btnA.setAttribute("aria-label", "Roll the dice. " + (a ? "First die shows " + a : "First die not rolled yet"));
    btnB.setAttribute("aria-label", "Roll the dice. " + (b ? "Second die shows " + b : "Second die not rolled yet"));
  }

  // ---- The workings panel ----
  function showCalc(r) {
    const rows = r ? [
      ["name", '"' + r.name + '"'], ["time", r.time], ["input", '"' + r.input + '"'], ["sha256", r.hex.slice(0, 32) + "…"],
      ["uint32", r.hex.slice(0, 8) + " → " + r.u32], ["pool", r.level + " · " + r.poolLength + " ideas"],
      ["index", r.u32 + " % " + r.poolLength + " = " + r.index], ["idea", "pool[" + r.index + "] → #" + r.idea.number],
    ] : [
      ["name", "lower case, trimmed, single spaces"], ["time", "UTC to the second, e.g. 2026-11-09T14:32:07Z"],
      ["input", "name|time|first|second"], ["sha256", "SHA-256 of the UTF-8 input"], ["uint32", "bytes 0–3, big-endian"],
      ["pool", "ideas at your level (Any = all " + data.ideas.length + ")"], ["index", "uint32 % pool length"], ["idea", "pool[index]"],
    ];
    const calc = $("calc");
    calc.classList.toggle("idle", !r);
    calc.replaceChildren(...rows.map(([k, v], i) =>
      el("div", {}, el("dt", { textContent: k }), el("dd", { textContent: v, className: r && i === rows.length - 1 ? "pick" : "" }))));
  }

  // ---- Levels ----
  function drawLevels() {
    const counts = (id) => id === "any" ? data.ideas.length : data.ideas.filter((i) => i.level === id).length;
    $("levels").replaceChildren(...LEVELS.map(([id, label]) => {
      const input = el("input", { type: "radio", name: "level", value: id, checked: id === level });
      input.addEventListener("change", () => { level = id; describeLevel(); });
      return el("label", {}, input, el("span", { className: "fp-opt" }, el("b", { textContent: label }), el("small", { textContent: counts(id) + " ideas" })));
    }));
    describeLevel();
  }
  function describeLevel() {
    $("level-msg").textContent = level === "any" ? "Any idea from all " + data.ideas.length + "." : data.levels[level];
  }

  // ---- Rolling ----
  function setRolling(on) {
    rolling = on;
    $("roll-form").classList.toggle("rolling", on);
    $("roll-button").textContent = on ? "Rolling…" : (last ? "Roll again" : "Roll the dice");
    $("dice-cap").textContent = on ? "ROLLING…" : (last ? "CLICK THE DICE TO ROLL AGAIN" : "CLICK EITHER DIE TO ROLL");
  }

  async function roll() {
    if (rolling || !data) return;
    const nameInput = $("learner-name");
    const timeInput = $("roll-time");
    const chosenA = Number($("die-a").value) || 0;
    const chosenB = Number($("die-b").value) || 0;
    const t = timeInput.value.trim();
    const nameOk = normName(nameInput.value) !== "";
    const timeOk = t === "" || validTime(t);
    const diceOk = t === "" || (chosenA && chosenB);
    nameInput.classList.toggle("error", !nameOk);
    $("name-msg").classList.toggle("error", !nameOk);
    $("name-msg").textContent = nameOk ? "Your name is part of the roll, with the time and the dice." : "Add your name to roll.";
    timeInput.classList.toggle("error", !timeOk || !diceOk);
    $("time-msg").classList.toggle("error", !timeOk || !diceOk);
    $("time-msg").textContent = !timeOk ? "Use exactly this form: 2026-11-09T14:32:07Z" : !diceOk ? "To replay a roll, set both dice as well." : "Leave it empty to use the time now.";
    if (!nameOk) { nameInput.focus(); return; }
    if (!timeOk || !diceOk) { $("replay").open = true; timeInput.focus(); return; }

    const random = () => 1 + Math.floor(Math.random() * 6);
    const time = t || nowUtc();
    const a = chosenA || random();
    const b = chosenB || random();
    setRolling(true);
    if (!reduceMotion) {
      for (let n = 0; n < 9; n++) {
        showDice(random(), random());
        await new Promise((done) => setTimeout(done, 80));
      }
    }
    const r = await pick(nameInput.value, time, a, b, level);
    last = { ...r, time, a, b, level, shown: display(nameInput.value) };
    showDice(a, b);
    setRolling(false);
    showResult(last);
  }

  function showResult(r) {
    const idea = r.idea;
    showCalc(r);
    $("empty").hidden = true;
    const result = $("result");
    result.hidden = false;
    result.style.animation = "none"; void result.offsetWidth; result.style.animation = "";
    $("r-owner").textContent = r.shown.toUpperCase() + "’S PROJECT";
    $("r-number").textContent = "IDEA #" + idea.number;
    $("r-level").textContent = cap(idea.level).toUpperCase() + (r.level === "any" ? " · ROLLED FROM ANY" : "");
    $("r-group").textContent = idea.group;
    $("r-title").textContent = idea.name;
    $("r-what").replaceChildren(withCode(idea.what + "."));
    $("r-builds").textContent = idea.builds_on;
    $("r-eval").replaceChildren(withCode(idea.eval_idea));
    $("r-harder").replaceChildren(withCode(idea.harder));
    $("r-twists").replaceChildren(...data.twists.filter((tw) => idea.twists.includes(tw.number)).map((tw) =>
      el("li", {}, el("b", { textContent: tw.number }), el("span", {}, withCode(tw.twist)))));
    $("r-rolled").replaceChildren("Rolled at ", el("strong", { textContent: r.time }), ` · dice ${r.a} and ${r.b}`);
    const command = `python3 roll.py ${shellQuote(r.shown)} ${r.a} ${r.b}` + (r.level === "any" ? "" : " " + r.level) + ` --at ${r.time}`;
    $("r-command").textContent = command;
    const rollLine = `${r.shown} · dice ${r.a} and ${r.b} · ${r.level} · ${r.time} → ${idea.number}: ${idea.name}`;
    const title = `[Final project] ${idea.number}: ${idea.name}`;
    $("r-entry").textContent = `${title}\n\nWhere it comes from: A roll on the course page\nYour roll: ${rollLine}\nTo see it again: ${command}`;
    $("post-roll").href = discussionLink({ title, start: "A roll on the course page", roll: rollLine });
    last.command = command;
    $("r-title").focus({ preventScroll: true });
    result.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  // ---- Your own idea ----
  function ownEntry() {
    const v = (id) => $(id).value.trim();
    const name = v("o-name");
    const lines = [["What it does", v("o-what")], ["Harder version", v("o-harder")], ["Builds on", v("o-builds")],
      ["Eval", v("o-eval")], ["Level", v("o-level") ? cap(v("o-level")) : ""]].filter(([, text]) => text);
    const idea = [name, ...lines.map(([k, text]) => `${k}: ${text}`)].join("\n");
    return { ready: name !== "" && v("o-what") !== "", title: `[Final project] My own idea: ${name}`, idea };
  }
  function updateOwn() {
    const e = ownEntry();
    const post = $("post-own");
    post.setAttribute("aria-disabled", String(!e.ready));
    post.href = e.ready ? discussionLink({ title: e.title, start: "My own idea", idea: e.idea }) : "#";
    $("own-msg").classList.remove("error");
    $("own-msg").textContent = "The page never posts anything. You post from your own GitHub account.";
  }

  // ---- Wiring ----
  async function start() {
    showDice(0, 0);
    try {
      const response = await fetch("projects.json");
      if (!response.ok) throw new Error(response.status);
      data = await response.json();
    } catch {
      $("empty").textContent = "The project ideas didn’t load. Reload the page, or roll with roll.py from the course code.";
      return;
    }
    document.querySelectorAll("[data-total]").forEach((n) => { n.textContent = data.ideas.length; });
    drawLevels();
    showCalc(null);
    $("roll-form").addEventListener("submit", (event) => { event.preventDefault(); roll(); });
    document.querySelectorAll(".fp-diebtn").forEach((b) => b.addEventListener("click", roll));
    $("roll-again").addEventListener("click", () => { $("roll-time").value = ""; roll(); });
    $("copy-command").addEventListener("click", (event) => copy(last.command, event.currentTarget));
    $("record").addEventListener("change", (event) => { $("record-body").hidden = !event.currentTarget.checked; });
    $("copy-roll").addEventListener("click", (event) => copy($("r-entry").textContent, event.currentTarget));
    $("own-form").addEventListener("input", updateOwn);
    $("own-form").addEventListener("submit", (event) => event.preventDefault());
    $("copy-own").addEventListener("click", (event) => {
      const e = ownEntry();
      if (!e.ready) {
        $("own-msg").classList.add("error");
        $("own-msg").textContent = "Add a name and what it does first.";
        return;
      }
      copy(`${e.title}\n\nWhere it comes from: My own idea\n${e.idea}`, event.currentTarget);
    });
    updateOwn();
  }
  start();
})();
