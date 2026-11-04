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
nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});
