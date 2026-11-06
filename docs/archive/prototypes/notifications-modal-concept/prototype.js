const announcements = [
  {
    title: "Mise à jour de l’espace viewer",
    body: "Ce texte est un exemple de démonstration, sans lien avec une annonce publiée. Le détail conserve le texte brut fourni et n’ajoute aucun lien ni action métier.\n\nCette seconde ligne permet d’observer la lecture d’un contenu plus long dans le modal.",
  },
  {
    title: "Informations sur les récompenses",
    body: "Contenu fictif de démonstration. Dans le produit, ce texte serait remplacé par le corps brut de l’annonce sélectionnée.",
  },
];

const trigger = document.querySelector("#notification-trigger");
const menu = document.querySelector("#notification-menu");
const list = document.querySelector("#announcement-list");
const backdrop = document.querySelector("#modal-backdrop");
const dialog = document.querySelector("#announcement-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogBody = document.querySelector("#dialog-body");
const closeButton = document.querySelector("#dialog-close");
const appShell = document.querySelector("#app-shell");
const demoStateButtons = [...document.querySelectorAll("[data-state]")];
let activeAnnouncementButton = null;
let refreshTimer = null;
let menuState = "ready";

function focusableInDialog() {
  return [...dialog.querySelectorAll('button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')]
    .filter((element) => element.getClientRects().length > 0);
}

function renderAnnouncementList() {
  list.replaceChildren();
  list.setAttribute("aria-busy", "false");

  if (menuState === "empty") {
    list.innerHTML = '<p class="state-message" role="status"><strong>Aucune annonce</strong>Aucune annonce à afficher pour le moment.</p>';
    return;
  }

  if (menuState === "error") {
    list.innerHTML = '<div class="state-message" role="alert"><strong>Impossible d’actualiser les annonces</strong>Une erreur temporaire empêche le chargement de la liste.</div>';
    const retry = document.createElement("button");
    retry.type = "button";
    retry.className = "retry-button";
    retry.textContent = "Réessayer";
    retry.addEventListener("click", refreshAnnouncements);
    list.append(retry);
    return;
  }

  if (menuState === "unavailable") {
    list.innerHTML = '<p class="state-message" role="alert"><strong>Session viewer indisponible</strong>Reconnecte-toi pour consulter les annonces. Aucun contenu protégé n’est affiché.</p>';
    return;
  }

  list.replaceChildren(...announcements.map((announcement, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "announcement";
    button.dataset.announcement = String(index);
    button.setAttribute("aria-haspopup", "dialog");
    button.innerHTML = `<span class="announcement-symbol${index ? " cyan" : ""}" aria-hidden="true">${index ? "↗" : "✦"}</span><span class="announcement-copy"><strong></strong><small>Exemple de contenu pour ce prototype</small></span><span class="chevron" aria-hidden="true">›</span>`;
    button.querySelector("strong").textContent = announcement.title;
    return button;
  }));
}

function refreshAnnouncements() {
  window.clearTimeout(refreshTimer);
  list.setAttribute("aria-busy", "true");
  list.innerHTML = '<p class="loading-note" role="status">Actualisation des annonces…</p>';
  refreshTimer = window.setTimeout(renderAnnouncementList, 220);
}

function setMenuOpen(open) {
  menu.hidden = !open;
  trigger.setAttribute("aria-expanded", String(open));
  if (open) refreshAnnouncements();
  else {
    window.clearTimeout(refreshTimer);
    list.setAttribute("aria-busy", "false");
  }
}

function setDemoState(state) {
  menuState = state;
  demoStateButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.state === state));
  });
  if (!menu.hidden) refreshAnnouncements();
}

function openAnnouncement(button, announcement) {
  activeAnnouncementButton = button;
  dialogTitle.textContent = announcement.title;
  dialogBody.textContent = announcement.body;
  menu.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  window.clearTimeout(refreshTimer);
  appShell.setAttribute("inert", "");
  appShell.classList.add("is-modal-open");
  document.body.classList.add("modal-open");
  backdrop.hidden = false;
  dialog.focus();
}

function closeAnnouncement() {
  backdrop.hidden = true;
  appShell.removeAttribute("inert");
  appShell.classList.remove("is-modal-open");
  document.body.classList.remove("modal-open");
  if (activeAnnouncementButton?.isConnected) activeAnnouncementButton.focus();
  else trigger.focus();
}

trigger.addEventListener("click", () => setMenuOpen(menu.hidden));
trigger.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" && menu.hidden) {
    event.preventDefault();
    setMenuOpen(true);
    window.setTimeout(() => menu.querySelector(".announcement")?.focus(), 240);
  }
});
menu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-announcement]");
  if (button) openAnnouncement(button, announcements[Number(button.dataset.announcement)]);
});
menu.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    trigger.focus();
  }
});
closeButton.addEventListener("click", closeAnnouncement);
demoStateButtons.forEach((button) => {
  button.addEventListener("click", () => setDemoState(button.dataset.state));
});
document.addEventListener("keydown", (event) => {
  if (backdrop.hidden) {
    if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault();
      setMenuOpen(false);
      trigger.focus();
    }
    return;
  }
  if (event.key === "Escape") {
    event.preventDefault();
    closeAnnouncement();
    return;
  }
  if (event.key !== "Tab") return;

  const focusable = focusableInDialog();
  if (!focusable.length) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
    event.preventDefault();
    first.focus();
  }
});
