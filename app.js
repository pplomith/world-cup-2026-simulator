const state = {
  bootstrap: null,
  engine: null,
  simulation: null,
  matches: new Map(),
  bracketStart: "round_of_32",
  loading: false,
  language: localStorage.getItem("wc26-language") === "en" ? "en" : "it",
  openMatchId: null,
};

function ensureLanguageControls() {
  let toggle = document.getElementById("languageToggle");
  let label = document.getElementById("languageToggleLabel");
  if (toggle && label) return { toggle, label };

  const topbar = document.querySelector(".topbar");
  const modelLive = document.querySelector(".model-live");
  if (!topbar) return { toggle: null, label: null };

  let actions = document.querySelector(".topbar-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "topbar-actions";
    topbar.appendChild(actions);
    if (modelLive) actions.appendChild(modelLive);
  }

  toggle = document.createElement("button");
  toggle.className = "language-toggle";
  toggle.id = "languageToggle";
  toggle.type = "button";
  toggle.innerHTML = `
    <span class="language-icon" aria-hidden="true">文</span>
    <span id="languageToggleLabel">EN</span>
  `;
  actions.insertBefore(toggle, actions.firstChild);
  label = toggle.querySelector("#languageToggleLabel");
  return { toggle, label };
}

const languageControls = ensureLanguageControls();

const elements = {
  simulateButton: document.getElementById("simulateButton"),
  languageToggle: languageControls.toggle,
  languageToggleLabel: languageControls.label,
  seedInput: document.getElementById("seedInput"),
  favoritesTrack: document.getElementById("favoritesTrack"),
  teamSearch: document.getElementById("teamSearch"),
  groupFilter: document.getElementById("groupFilter"),
  groupQuickFilters: document.getElementById("groupQuickFilters"),
  probabilityTableHead: document.getElementById("probabilityTableHead"),
  probabilityTableBody: document.getElementById("probabilityTableBody"),
  probabilityCount: document.getElementById("probabilityCount"),
  emptyState: document.getElementById("emptyState"),
  simulationContent: document.getElementById("simulationContent"),
  scenarioSeed: document.getElementById("scenarioSeed"),
  championFlag: document.getElementById("championFlag"),
  championName: document.getElementById("championName"),
  championRoute: document.getElementById("championRoute"),
  podium: document.getElementById("podium"),
  storyStats: document.getElementById("storyStats"),
  phaseNav: document.getElementById("phaseNav"),
  phaseProgress: document.getElementById("phaseProgress"),
  groupsGrid: document.getElementById("groupsGrid"),
  bracketGrid: document.getElementById("bracketGrid"),
  storylineGrid: document.getElementById("storylineGrid"),
  overlay: document.getElementById("simulationOverlay"),
  overlayStage: document.getElementById("overlayStage"),
  overlayDetail: document.getElementById("overlayDetail"),
  overlayProgress: document.getElementById("overlayProgress"),
  overlayPercent: document.getElementById("overlayPercent"),
  tournamentLoader: document.getElementById("tournamentLoader"),
  overlayJourneyProgress: document.getElementById("overlayJourneyProgress"),
  matchModal: document.getElementById("matchModal"),
  matchModalContent: document.getElementById("matchModalContent"),
  toast: document.getElementById("toast"),
};

const translations = {
  it: {
    "meta.description": "Simulatore AI del Mondiale FIFA 2026 basato su 100.000 simulazioni Monte Carlo.",
    "nav.aria": "Navigazione principale",
    "nav.overview": "Panoramica",
    "nav.probabilities": "Probabilità",
    "nav.groups": "Gironi",
    "nav.bracket": "Tabellone",
    "nav.modelLive": "MODELLO ATTIVO",
    "language.switch": "Passa alla lingua inglese",
    "hero.titleTop": "UNA COPPA,",
    "hero.titleBottom": "INFINITE STORIE.",
    "hero.description": "Una simulazione completa del Mondiale 2026, guidata dal modello calibrato e dal prior di 100.000 tornei Monte Carlo. Ogni click crea una nuova possibile storia.",
    "hero.buttonSmall": "GENERA UN NUOVO TORNEO",
    "hero.button": "SIMULA ORA",
    "hero.seed": "SEED OPZIONALE",
    "hero.seedPlaceholder": "Casuale",
    "hero.teams": "SQUADRE",
    "hero.matches": "PARTITE",
    "favorites.kicker": "PANORAMICA MODELLO",
    "favorites.title": "Le favorite prima del calcio d'inizio",
    "probabilities.kicker": "PRIMA DEL TORNEO",
    "probabilities.title": "Le percentuali di tutte le squadre",
    "probabilities.description": "Probabilità calcolate sulle 100.000 simulazioni prima del calcio d'inizio. I valori indicano la possibilità di raggiungere ogni turno.",
    "probabilities.search": "CERCA SQUADRA",
    "probabilities.searchPlaceholder": "Es. Spagna, Argentina...",
    "probabilities.group": "GIRONE",
    "probabilities.loading": "Caricamento delle probabilità Monte Carlo...",
    "probabilities.groupFilterAria": "Filtra per girone",
    "empty.kicker": "PRONTI AL CALCIO D'INIZIO",
    "empty.title": "Il tabellone aspetta la sua storia.",
    "empty.description": "Premi “Simula ora” per giocare tutte le 104 partite, definire le migliori terze e attraversare il tabellone ufficiale fino alla finale.",
    "story.kicker": "SIMULAZIONE COMPLETATA",
    "story.title": "Una nuova storia è stata scritta.",
    "story.scenario": "ID SCENARIO",
    "champion.label": "CAMPIONI DEL MONDO 2026",
    "champion.defaultRoute": "Una strada verso la gloria.",
    "groups.title": "Fase a gironi",
    "groups.description": "Prime due classificate e le otto migliori terze accedono al Round of 32.",
    "bracket.title": "Tabellone a eliminazione diretta",
    "bracket.description": "Seleziona il turno iniziale per vedere quel round e tutti i successivi. Clicca una partita per aprire i dati del modello.",
    "stories.title": "I momenti del torneo",
    "footer.description": "Modello ensemble, Dixon-Coles, Negative Binomial e prior Monte Carlo. Una simulazione rappresenta una possibilità, non una previsione certa.",
    "loader.live": "SIMULAZIONE IN CORSO",
    "loader.groups": "GIRONI",
    "loader.qualified": "QUALIFICATE",
    "loader.quarters": "QUARTI",
    "loader.semis": "SEMIFINALI",
    "loader.final": "FINALE",
    "loader.preparing": "Preparazione del torneo",
    "loader.loadingMatrices": "Caricamento delle matrici di probabilità...",
    "modal.close": "Chiudi",
    "modal.closeDetails": "Chiudi dettagli",
    "phase.groups.title": "Analisi dei gironi",
    "phase.groups.detail": "72 partite, 12 gruppi, 48 nazionali",
    "phase.tables.title": "Classifiche e migliori terze",
    "phase.tables.detail": "Applicazione dei tie-break ufficiali",
    "phase.r32.title": "Round of 32",
    "phase.r32.detail": "Composizione del tabellone FIFA",
    "phase.r16.title": "Round of 16",
    "phase.r16.detail": "Le possibilità iniziano a restringersi",
    "phase.qf.title": "Quarti di finale",
    "phase.qf.detail": "Otto squadre ancora in corsa",
    "phase.sf.title": "Semifinali",
    "phase.sf.detail": "Il trofeo è a due partite di distanza",
    "phase.finals.title": "Finali",
    "phase.finals.detail": "Titolo mondiale e finale per il terzo posto",
    "round.roundOf32": "Round of 32",
    "round.roundOf16": "Round of 16",
    "round.quarterFinals": "Quarti di finale",
    "round.semiFinals": "Semifinali",
    "round.finals": "3° posto e finale",
    "table.rank": "Pos.",
    "table.team": "Squadra",
    "table.first": "1° posto",
    "table.second": "2° posto",
    "table.third": "3° posto",
    "table.fourth": "4° posto",
    "table.roundOf16": "Ottavi",
    "table.quarters": "Quarti",
    "table.semiFinal": "Semifinale",
    "table.final": "Finale",
    "table.champion": "Campione",
    "filter.allGroups": "Tutti i gironi",
    "filter.all": "Tutti",
    "filter.group": "Gruppo {group}",
    "filter.empty": "Nessuna squadra corrisponde ai filtri selezionati.",
    "filter.groupSummary": "Girone {group}: probabilità di posizione e avanzamento",
    "filter.count": "{visible} di {total} squadre visualizzate",
    "error.model": "Impossibile caricare il modello: {message}",
    "loader.validating": "Convalida del tabellone",
    "loader.checking": "Controllo delle 32 squadre e dei percorsi a eliminazione diretta",
    "loader.ready": "La storia è pronta",
    "loader.champion": "{team} è campione del mondo",
    "penalties": "Rigori {a}-{b}",
    "champion.route": "Il percorso finale: {route}",
    "champion.newRoute": "Una nuova strada verso la gloria.",
    "champion.first": "CAMPIONE",
    "champion.second": "2°",
    "champion.third": "3°",
    "stats.totalGoals": "Gol totali",
    "stats.goalsPerMatch": "Gol / partita",
    "stats.shootouts": "Serie ai rigori",
    "stats.preTournamentChance": "Chance pre-torneo",
    "group.label": "Girone {group}",
    "group.finalTable": "CLASSIFICA FINALE",
    "group.team": "SQUADRA",
    "group.played": "G",
    "group.goalDifference": "DG",
    "group.points": "PT",
    "group.showMatches": "Vedi le 6 partite",
    "group.hideMatches": "Nascondi le partite",
    "match.openAria": "Apri i dettagli di {teamA} contro {teamB}",
    "match.worldFinal": "FINALE MONDIALE · ",
    "match.worldTitle": "Titolo di campione del mondo",
    "match.openStats": "Apri statistiche",
    "match.details": "DETTAGLI +",
    "bracket.podium": "PODIO",
    "bracket.knockout": "FASE A ELIMINAZIONE DIRETTA",
    "bracket.match": "PARTITA",
    "bracket.matches": "PARTITE",
    "stage.round_of_32": "Round of 32",
    "stage.round_of_16": "Round of 16",
    "stage.quarter_final": "Quarti di finale",
    "stage.semi_final": "Semifinali",
    "stage.third_place": "Finale 3° posto",
    "stage.final": "Finale",
    "modal.match": "Partita",
    "modal.versus": "contro",
    "modal.advances": "{team} passa il turno",
    "modal.drawResult": "Partita terminata in pareggio",
    "modal.titleChance": "Chance titolo {value}",
    "modal.preMatch": "PROBABILITÀ PRE-PARTITA",
    "modal.draw90": "Pareggio nei 90'",
    "modal.modelData": "DATI DEL MODELLO",
    "modal.expectedGoals": "Gol attesi",
    "modal.baseProbability": "Probabilità base 1X2",
    "modal.simulatedWinner": "Vincitore simulato",
    "modal.draw": "Pareggio",
    "story.upsetTitle": "La sorpresa del torneo",
    "story.upsetText": "{winner} ha vinto con appena il {probability} di probabilità pre-partita. {match}.",
    "story.highTitle": "La partita più spettacolare",
    "story.highText": "{match}, giocata a {venue}.",
    "story.modelTitle": "Una storia, non un copione",
    "story.modelText": "Il prior Monte Carlo pesa il {weight}%, mentre il risultato viene campionato dalla distribuzione calibrata {distribution}.",
    "story.championTitle": "{team} conquista il mondo.",
    "error.engineReady": "Motore di simulazione non ancora pronto",
    "error.simulation": "Simulazione non riuscita: {message}",
    "model.tooltip": "Dixon-Coles rho {rho}, {distribution}, prior Monte Carlo {weight}%",
    "distribution.negative_binomial": "binomiale negativa",
    "distribution.poisson": "Poisson",
  },
  en: {
    "meta.description": "FIFA World Cup 2026 AI simulator based on 100,000 Monte Carlo tournament simulations.",
    "nav.aria": "Main navigation",
    "nav.overview": "Overview",
    "nav.probabilities": "Probabilities",
    "nav.groups": "Groups",
    "nav.bracket": "Bracket",
    "nav.modelLive": "MODEL LIVE",
    "language.switch": "Switch to Italian",
    "hero.titleTop": "ONE CUP,",
    "hero.titleBottom": "INFINITE STORIES.",
    "hero.description": "A complete 2026 World Cup simulation powered by the calibrated model and a prior built from 100,000 Monte Carlo tournaments. Every click creates a new possible story.",
    "hero.buttonSmall": "GENERATE A NEW TOURNAMENT",
    "hero.button": "SIMULATE NOW",
    "hero.seed": "OPTIONAL SEED",
    "hero.seedPlaceholder": "Random",
    "hero.teams": "TEAMS",
    "hero.matches": "MATCHES",
    "favorites.kicker": "MODEL OUTLOOK",
    "favorites.title": "Pre-tournament favorites",
    "probabilities.kicker": "PRE-TOURNAMENT OUTLOOK",
    "probabilities.title": "Probabilities for every team",
    "probabilities.description": "Probabilities calculated from 100,000 simulations before kick-off. Values show each team's chance of reaching every round.",
    "probabilities.search": "SEARCH TEAM",
    "probabilities.searchPlaceholder": "E.g. Spain, Argentina...",
    "probabilities.group": "GROUP",
    "probabilities.loading": "Loading Monte Carlo probabilities...",
    "probabilities.groupFilterAria": "Filter by group",
    "empty.kicker": "READY FOR KICK-OFF",
    "empty.title": "The bracket is waiting for its story.",
    "empty.description": "Press “Simulate now” to play all 104 matches, select the best third-placed teams and follow the official bracket all the way to the final.",
    "story.kicker": "SIMULATION COMPLETE",
    "story.title": "A new story has been written.",
    "story.scenario": "SCENARIO ID",
    "champion.label": "WORLD CHAMPIONS 2026",
    "champion.defaultRoute": "A road to glory.",
    "groups.title": "Group stage",
    "groups.description": "The top two teams and the eight best third-placed teams advance to the Round of 32.",
    "bracket.title": "Knockout bracket",
    "bracket.description": "Select the opening round to display it and every following round. Click a match to view the model data.",
    "stories.title": "Tournament stories",
    "footer.description": "Ensemble model, Dixon-Coles, Negative Binomial and Monte Carlo prior. A simulation is one possibility, not a certain prediction.",
    "loader.live": "SIMULATION IN PROGRESS",
    "loader.groups": "GROUPS",
    "loader.qualified": "QUALIFIED",
    "loader.quarters": "QUARTERS",
    "loader.semis": "SEMIFINALS",
    "loader.final": "FINAL",
    "loader.preparing": "Preparing the tournament",
    "loader.loadingMatrices": "Loading probability matrices...",
    "modal.close": "Close",
    "modal.closeDetails": "Close details",
    "phase.groups.title": "Analyzing the groups",
    "phase.groups.detail": "72 matches, 12 groups, 48 national teams",
    "phase.tables.title": "Standings and best third-placed teams",
    "phase.tables.detail": "Applying the official tie-break rules",
    "phase.r32.title": "Round of 32",
    "phase.r32.detail": "Building the official FIFA bracket",
    "phase.r16.title": "Round of 16",
    "phase.r16.detail": "The field begins to narrow",
    "phase.qf.title": "Quarter-finals",
    "phase.qf.detail": "Eight teams remain in contention",
    "phase.sf.title": "Semi-finals",
    "phase.sf.detail": "The trophy is two matches away",
    "phase.finals.title": "Finals",
    "phase.finals.detail": "World title and third-place match",
    "round.roundOf32": "Round of 32",
    "round.roundOf16": "Round of 16",
    "round.quarterFinals": "Quarter-finals",
    "round.semiFinals": "Semi-finals",
    "round.finals": "Third place & final",
    "table.rank": "Rank",
    "table.team": "Team",
    "table.first": "1st place",
    "table.second": "2nd place",
    "table.third": "3rd place",
    "table.fourth": "4th place",
    "table.roundOf16": "Round of 16",
    "table.quarters": "Quarter-finals",
    "table.semiFinal": "Semi-final",
    "table.final": "Final",
    "table.champion": "Champion",
    "filter.allGroups": "All groups",
    "filter.all": "All",
    "filter.group": "Group {group}",
    "filter.empty": "No teams match the selected filters.",
    "filter.groupSummary": "Group {group}: finishing-position and advancement probabilities",
    "filter.count": "Showing {visible} of {total} teams",
    "error.model": "Unable to load the model: {message}",
    "loader.validating": "Validating the bracket",
    "loader.checking": "Checking all 32 teams and knockout paths",
    "loader.ready": "The story is ready",
    "loader.champion": "{team} are world champions",
    "penalties": "Penalties {a}-{b}",
    "champion.route": "Final-stage route: {route}",
    "champion.newRoute": "A new road to glory.",
    "champion.first": "CHAMPION",
    "champion.second": "2ND",
    "champion.third": "3RD",
    "stats.totalGoals": "Total goals",
    "stats.goalsPerMatch": "Goals / match",
    "stats.shootouts": "Penalty shootouts",
    "stats.preTournamentChance": "Pre-tournament chance",
    "group.label": "Group {group}",
    "group.finalTable": "FINAL TABLE",
    "group.team": "TEAM",
    "group.played": "P",
    "group.goalDifference": "GD",
    "group.points": "PTS",
    "group.showMatches": "View all 6 matches",
    "group.hideMatches": "Hide matches",
    "match.openAria": "Open details for {teamA} versus {teamB}",
    "match.worldFinal": "WORLD CUP FINAL · ",
    "match.worldTitle": "World championship title",
    "match.openStats": "Open statistics",
    "match.details": "DETAILS +",
    "bracket.podium": "PODIUM",
    "bracket.knockout": "KNOCKOUT STAGE",
    "bracket.match": "MATCH",
    "bracket.matches": "MATCHES",
    "stage.round_of_32": "Round of 32",
    "stage.round_of_16": "Round of 16",
    "stage.quarter_final": "Quarter-finals",
    "stage.semi_final": "Semi-finals",
    "stage.third_place": "Third-place match",
    "stage.final": "Final",
    "modal.match": "Match",
    "modal.versus": "vs",
    "modal.advances": "{team} advance",
    "modal.drawResult": "Match ended level",
    "modal.titleChance": "Title chance {value}",
    "modal.preMatch": "PRE-MATCH PROBABILITIES",
    "modal.draw90": "Draw after 90 minutes",
    "modal.modelData": "MODEL DATA",
    "modal.expectedGoals": "Expected goals",
    "modal.baseProbability": "Base 1X2 probabilities",
    "modal.simulatedWinner": "Simulated winner",
    "modal.draw": "Draw",
    "story.upsetTitle": "Upset of the tournament",
    "story.upsetText": "{winner} won with only a {probability} pre-match probability. {match}.",
    "story.highTitle": "Highest-scoring match",
    "story.highText": "{match}, played in {venue}.",
    "story.modelTitle": "A story, not a script",
    "story.modelText": "The Monte Carlo prior carries a {weight}% weight, while the result is sampled from the calibrated {distribution} distribution.",
    "story.championTitle": "{team} conquer the world.",
    "error.engineReady": "The simulation engine is not ready yet",
    "error.simulation": "Simulation failed: {message}",
    "model.tooltip": "Dixon-Coles rho {rho}, {distribution}, Monte Carlo prior {weight}%",
    "distribution.negative_binomial": "negative binomial",
    "distribution.poisson": "Poisson",
  },
};

function t(key, variables = {}) {
  const template =
    translations[state.language]?.[key] ??
    translations.it[key] ??
    key;
  return Object.entries(variables).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, String(value)),
    template,
  );
}

function applyStaticTranslations() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((node) => {
    node.setAttribute("aria-label", t(node.dataset.i18nAriaLabel));
  });
  document.querySelectorAll("[data-i18n-content]").forEach((node) => {
    node.setAttribute("content", t(node.dataset.i18nContent));
  });
  if (elements.languageToggleLabel) {
    elements.languageToggleLabel.textContent =
      state.language === "it" ? "EN" : "IT";
  }
  elements.languageToggle?.setAttribute("aria-label", t("language.switch"));
}

const phaseDetails = [
  ["phase.groups.title", "phase.groups.detail"],
  ["phase.tables.title", "phase.tables.detail"],
  ["phase.r32.title", "phase.r32.detail"],
  ["phase.r16.title", "phase.r16.detail"],
  ["phase.qf.title", "phase.qf.detail"],
  ["phase.sf.title", "phase.sf.detail"],
  ["phase.finals.title", "phase.finals.detail"],
];

const bracketGroups = [
  { id: "round_of_32", labelKey: "round.roundOf32", stageIds: ["round_of_32"] },
  { id: "round_of_16", labelKey: "round.roundOf16", stageIds: ["round_of_16"] },
  { id: "quarter_final", labelKey: "round.quarterFinals", stageIds: ["quarter_final"] },
  { id: "semi_final", labelKey: "round.semiFinals", stageIds: ["semi_final"] },
  {
    id: "finals",
    labelKey: "round.finals",
    stageIds: ["final", "third_place"],
  },
];

const bracketMatchOrder = {
  round_of_32: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87],
  round_of_16: [89, 90, 93, 94, 91, 92, 95, 96],
  quarter_final: [97, 98, 99, 100],
  semi_final: [101, 102],
  finals: [104, 103],
};

const bracketDependencies = {
  89: [74, 77],
  90: [73, 75],
  91: [76, 78],
  92: [79, 80],
  93: [83, 84],
  94: [81, 82],
  95: [86, 88],
  96: [85, 87],
  97: [89, 90],
  98: [93, 94],
  99: [91, 92],
  100: [95, 96],
  101: [97, 98],
  102: [99, 100],
  103: [101, 102],
  104: [101, 102],
};

function percent(value, digits = 1) {
  return new Intl.NumberFormat(state.language === "it" ? "it-IT" : "en-US", {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value));
}

function formatDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(state.language === "it" ? "it-IT" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function teamName(team) {
  return escapeHtml(team.name);
}

function flag(team) {
  return `<span class="flag" title="${teamName(team)}">${escapeHtml(team.flag)}</span>`;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove("hidden");
  window.setTimeout(() => elements.toast.classList.add("hidden"), 5000);
}

function renderFavorites(favorites) {
  elements.favoritesTrack.innerHTML = favorites
    .slice(0, 5)
    .map(
      (team, index) => `
        <article class="favorite-card" data-rank="${index + 1}">
          <div class="favorite-team">
            ${flag(team)}
            <span>${teamName(team)}</span>
          </div>
          <strong class="favorite-probability">${percent(team.worldCupProbability)}</strong>
          <span class="favorite-bar">
            <i style="width:${Math.min(100, team.worldCupProbability * 430)}%"></i>
          </span>
        </article>
      `,
    )
    .join("");
}

function displayPercent(value) {
  const numeric = Number(value);
  if (numeric > 0 && numeric < 0.001) {
    return state.language === "it" ? "&lt;0,1%" : "&lt;0.1%";
  }
  return percent(numeric);
}

function distributionLabel(value) {
  return t(`distribution.${value}`);
}

function probabilityCell(value, label, featured = false) {
  return `
    <td class="probability-cell ${featured ? "featured" : ""}" data-label="${label}">
      <span>${displayPercent(value)}</span>
      ${featured ? `<i style="--probability:${Math.min(100, Number(value) * 100)}%"></i>` : ""}
    </td>
  `;
}

function renderProbabilityTableHead(showGroupPositions) {
  const groupColumns = showGroupPositions
    ? `
        <th scope="col" class="position-probability-column">${t("table.first")}</th>
        <th scope="col" class="position-probability-column">${t("table.second")}</th>
        <th scope="col" class="position-probability-column">${t("table.third")}</th>
        <th scope="col" class="position-probability-column">${t("table.fourth")}</th>
      `
    : "";
  elements.probabilityTableHead.innerHTML = `
    <tr>
      <th scope="col">${t("table.rank")}</th>
      <th scope="col">${t("table.team")}</th>
      ${groupColumns}
      <th scope="col">R32</th>
      <th scope="col">${t("table.roundOf16")}</th>
      <th scope="col">${t("table.quarters")}</th>
      <th scope="col">${t("table.semiFinal")}</th>
      <th scope="col">${t("table.final")}</th>
      <th scope="col" class="title-column">${t("table.champion")}</th>
    </tr>
  `;
}

function updateGroupFilterButtons(selectedGroup) {
  elements.groupQuickFilters
    .querySelectorAll("[data-group-filter]")
    .forEach((button) => {
      button.classList.toggle("active", button.dataset.groupFilter === selectedGroup);
    });
}

function renderProbabilityTable() {
  const teams = state.bootstrap?.allTeams || [];
  const query = elements.teamSearch.value.trim().toLocaleLowerCase("it");
  const selectedGroup = elements.groupFilter.value;
  const showGroupPositions = Boolean(selectedGroup);
  const filtered = teams
    .filter((team) => {
      const matchesName = team.name.toLocaleLowerCase("it").includes(query);
      const matchesGroup = !selectedGroup || team.group === selectedGroup;
      return matchesName && matchesGroup;
    })
    .sort((teamA, teamB) => {
      if (!selectedGroup) return teamA.rank - teamB.rank;
      return (
        teamB.groupFirstProbability - teamA.groupFirstProbability ||
        teamA.rank - teamB.rank
      );
    });

  renderProbabilityTableHead(showGroupPositions);
  updateGroupFilterButtons(selectedGroup);
  const columnCount = showGroupPositions ? 12 : 8;

  elements.probabilityTableBody.innerHTML = filtered.length
    ? filtered
        .map(
          (team) => `
            <tr>
              <td class="rank-cell" data-label="Rank">#${team.rank}</td>
              <th scope="row" class="probability-team" data-label="${t("table.team")}">
                ${flag(team)}
                <span>
                  <strong>${teamName(team)}</strong>
                  <small>${t("filter.group", { group: escapeHtml(team.group) })}</small>
                </span>
              </th>
              ${
                showGroupPositions
                  ? `
                    ${probabilityCell(team.groupFirstProbability, t("table.first"), true)}
                    ${probabilityCell(team.groupSecondProbability, t("table.second"))}
                    ${probabilityCell(team.groupThirdProbability, t("table.third"))}
                    ${probabilityCell(team.groupFourthProbability, t("table.fourth"))}
                  `
                  : ""
              }
              ${probabilityCell(team.roundOf32Probability, "R32")}
              ${probabilityCell(team.roundOf16Probability, t("table.roundOf16"))}
              ${probabilityCell(team.quarterFinalProbability, t("table.quarters"))}
              ${probabilityCell(team.semiFinalProbability, t("table.semiFinal"))}
              ${probabilityCell(team.reachFinalProbability, t("table.final"))}
              ${probabilityCell(team.worldCupProbability, t("table.champion"), true)}
            </tr>
          `,
        )
        .join("")
    : `
        <tr class="probability-empty-row">
          <td colspan="${columnCount}">${t("filter.empty")}</td>
        </tr>
      `;
  elements.probabilityCount.textContent =
    selectedGroup
      ? t("filter.groupSummary", { group: selectedGroup })
      : t("filter.count", { visible: filtered.length, total: teams.length });
}

function renderAllProbabilities(teams) {
  const selectedGroup = elements.groupFilter.value;
  const groups = [...new Set(teams.map((team) => team.group))].sort();
  elements.groupFilter.innerHTML = `
    <option value="">${t("filter.allGroups")}</option>
    ${groups
      .map((group) => `<option value="${escapeHtml(group)}">${t("filter.group", { group: escapeHtml(group) })}</option>`)
      .join("")}
  `;
  elements.groupQuickFilters.innerHTML = `
    <button class="group-filter-button active" type="button" data-group-filter="">${t("filter.all")}</button>
    ${groups
      .map(
        (group) => `
          <button class="group-filter-button" type="button" data-group-filter="${escapeHtml(group)}">
            Group ${escapeHtml(group)}
          </button>
        `,
      )
      .join("")}
  `;
  elements.groupQuickFilters
    .querySelectorAll("[data-group-filter]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        elements.groupFilter.value = button.dataset.groupFilter;
        renderProbabilityTable();
      });
    });
  elements.groupFilter.value = groups.includes(selectedGroup) ? selectedGroup : "";
  renderProbabilityTable();
}

async function loadBootstrap() {
  try {
    state.engine = await window.WorldCupStatic.loadEngine();
    state.bootstrap = state.engine.bootstrap();
    renderFavorites(state.bootstrap.favorites);
    renderAllProbabilities(state.bootstrap.allTeams);
    const model = state.bootstrap.model;
    document.getElementById("heroMeta").title =
      t("model.tooltip", {
        rho: model.dixonColesRho,
        distribution: distributionLabel(model.scoreDistribution),
        weight: Math.round(model.monteCarloPriorWeight * 100),
      });
  } catch (error) {
    showToast(t("error.model", { message: error.message }));
  }
}

async function runLoadingSequence(simulationPromise) {
  elements.overlay.classList.remove("hidden");
  elements.tournamentLoader.classList.remove("complete");
  elements.overlayProgress.style.width = "0%";
  elements.overlayJourneyProgress.style.width = "0%";
  elements.overlayPercent.textContent = "0%";
  const journeySteps = [
    ...elements.tournamentLoader.querySelectorAll("[data-loader-step]"),
  ];
  journeySteps.forEach((step) => {
    step.classList.remove("active", "completed");
  });
  let result = null;
  let failure = null;
  simulationPromise
    .then((payload) => {
      result = payload;
    })
    .catch((error) => {
      failure = error;
    });

  for (let index = 0; index < phaseDetails.length; index += 1) {
    const [titleKey, detailKey] = phaseDetails[index];
    elements.overlayStage.textContent = t(titleKey);
    elements.overlayDetail.textContent = t(detailKey);
    journeySteps.forEach((step, stepIndex) => {
      step.classList.toggle("completed", stepIndex < index);
      step.classList.toggle("active", stepIndex === index);
    });
    elements.overlayJourneyProgress.style.width =
      `${(index / (phaseDetails.length - 1)) * 100}%`;
    const progress = Math.round(((index + 1) / phaseDetails.length) * 92);
    elements.overlayProgress.style.width = `${progress}%`;
    elements.overlayPercent.textContent = `${progress}%`;
    await delay(index === 0 ? 620 : 430);
  }

  while (!result && !failure) {
    elements.overlayStage.textContent = t("loader.validating");
    elements.overlayDetail.textContent = t("loader.checking");
    await delay(180);
  }
  if (failure) {
    elements.overlay.classList.add("hidden");
    throw failure;
  }
  elements.overlayStage.textContent = t("loader.ready");
  elements.overlayDetail.textContent = t("loader.champion", {
    team: result.summary.champion.name,
  });
  elements.tournamentLoader.classList.add("complete");
  journeySteps.forEach((step) => {
    step.classList.remove("active");
    step.classList.add("completed");
  });
  elements.overlayJourneyProgress.style.width = "100%";
  elements.overlayProgress.style.width = "100%";
  elements.overlayPercent.textContent = "100%";
  await delay(700);
  elements.overlay.classList.add("hidden");
  return result;
}

function scoreText(match) {
  if (!match.afterPenalties) {
    return `${match.goalsA}-${match.goalsB}`;
  }
  return `${match.goalsA}-${match.goalsB}`;
}

function penaltyText(match) {
  if (!match.afterPenalties || !match.penalties) return "";
  return t("penalties", {
    a: match.penalties.teamA,
    b: match.penalties.teamB,
  });
}

function renderChampion(simulation) {
  const { champion, runnerUp, thirdPlace } = simulation.summary;
  elements.championFlag.textContent = champion.flag;
  elements.championName.textContent = champion.name;
  elements.scenarioSeed.textContent = `#${simulation.seed}`;

  const championMatches = simulation.stages
    .flatMap((stage) => stage.matches)
    .filter(
      (match) =>
        match.winner === champion.name &&
        ["quarter_final", "semi_final", "final"].includes(match.stage),
    );
  const route = championMatches
    .map((match) =>
      match.teamA.name === champion.name ? match.teamB.name : match.teamA.name,
    )
    .join("  ·  ");
  elements.championRoute.textContent = route
    ? t("champion.route", { route })
    : t("champion.newRoute");

  elements.podium.innerHTML = `
    <div class="podium-place second">
      <span class="podium-flag">${runnerUp.flag}</span>
      <strong>${teamName(runnerUp)}</strong>
      <span>${t("champion.second")}</span>
    </div>
    <div class="podium-place first">
      <span class="podium-flag">${champion.flag}</span>
      <strong>${teamName(champion)}</strong>
      <span>${t("champion.first")}</span>
    </div>
    <div class="podium-place third">
      <span class="podium-flag">${thirdPlace.flag}</span>
      <strong>${teamName(thirdPlace)}</strong>
      <span>${t("champion.third")}</span>
    </div>
  `;

  elements.storyStats.innerHTML = `
    <div class="story-stat"><span>${t("stats.totalGoals")}</span><strong>${simulation.summary.totalGoals}</strong></div>
    <div class="story-stat"><span>${t("stats.goalsPerMatch")}</span><strong>${simulation.summary.goalsPerMatch.toLocaleString(state.language === "it" ? "it-IT" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
    <div class="story-stat"><span>${t("stats.shootouts")}</span><strong>${simulation.summary.penaltyShootouts}</strong></div>
    <div class="story-stat"><span>${t("stats.preTournamentChance")}</span><strong>${percent(champion.worldCupProbability)}</strong></div>
  `;
}

function renderGroupMatch(match) {
  return `
    <div class="mini-match">
      <span class="mini-team">${flag(match.teamA)}<span>${teamName(match.teamA)}</span></span>
      <strong class="mini-score">${scoreText(match)}</strong>
      <span class="mini-team"><span>${teamName(match.teamB)}</span>${flag(match.teamB)}</span>
    </div>
  `;
}

function renderGroups(groups) {
  elements.groupsGrid.innerHTML = groups
    .map(
      (group, groupIndex) => `
        <article class="group-card" data-group="${group.group}" style="animation-delay:${groupIndex * 45}ms">
          <header class="group-title">
            <h3>${t("group.label", { group: group.group })}</h3>
            <span>${t("group.finalTable")}</span>
          </header>
          <div class="standings-head">
            <span>#</span><span>${t("group.team")}</span><span>${t("group.played")}</span><span>${t("group.goalDifference")}</span><span>${t("group.points")}</span>
          </div>
          <div class="standings">
            ${group.standings
              .map(
                (row) => `
                  <div class="standing-row ${row.qualified ? "qualified" : ""} ${row.bestThird ? "best-third" : ""}">
                    <span class="position">${row.position}</span>
                    <span class="standing-team">${flag(row.team)}<span>${teamName(row.team)}</span></span>
                    <span class="table-number">${row.played}</span>
                    <span class="table-number">${row.goalDifference > 0 ? "+" : ""}${row.goalDifference}</span>
                    <strong class="table-number points">${row.points}</strong>
                  </div>
                `,
              )
              .join("")}
          </div>
          <button class="group-matches-toggle" type="button">
            ${t("group.showMatches")}
          </button>
          <div class="group-match-list">
            ${group.matches.map(renderGroupMatch).join("")}
          </div>
        </article>
      `,
    )
    .join("");

  document.querySelectorAll(".group-matches-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest(".group-card");
      card.classList.toggle("open");
      button.textContent = card.classList.contains("open")
        ? t("group.hideMatches")
        : t("group.showMatches");
    });
  });
}

function renderMatchCard(match, index) {
  const teamAWon = match.winner === match.teamA.name;
  const teamBWon = match.winner === match.teamB.name;
  const isWorldFinal = match.matchNumber === 104 || match.stage === "final";
  return `
    <div class="match-slot ${isWorldFinal ? "world-final-slot" : ""}" data-match-number="${match.matchNumber}">
      <button
        class="match-card ${isWorldFinal ? "world-final-card" : ""}"
        type="button"
        data-match-id="${escapeHtml(match.matchId)}"
        style="animation-delay:${index * 35}ms"
        aria-label="${t("match.openAria", { teamA: teamName(match.teamA), teamB: teamName(match.teamB) })}"
      >
        <div class="match-meta">
          <span>${isWorldFinal ? t("match.worldFinal") : ""}M${match.matchNumber}</span>
          <span>${escapeHtml(match.venue)}</span>
        </div>
        <div class="match-team-row ${teamAWon ? "winner" : teamBWon ? "loser" : ""}">
          ${flag(match.teamA)}
          <span class="match-team-name">${teamName(match.teamA)}</span>
          <strong class="match-score">${match.goalsA}</strong>
        </div>
        <div class="match-team-row ${teamBWon ? "winner" : teamAWon ? "loser" : ""}">
          ${flag(match.teamB)}
          <span class="match-team-name">${teamName(match.teamB)}</span>
          <strong class="match-score">${match.goalsB}</strong>
        </div>
        <div class="match-card-footer">
          <span>${match.afterPenalties ? penaltyText(match) : isWorldFinal ? t("match.worldTitle") : t("match.openStats")}</span>
          <strong>${t("match.details")}</strong>
        </div>
      </button>
    </div>
  `;
}

function bracketMatchesByNumber(stages) {
  return new Map(
    stages
      .flatMap((stage) => stage.matches)
      .map((match) => [match.matchNumber, match]),
  );
}

function visibleBracketGroups(startId) {
  const startIndex = Math.max(
    0,
    bracketGroups.findIndex((group) => group.id === startId),
  );
  return bracketGroups.slice(startIndex);
}

function groupMatches(group, matchesByNumber) {
  return bracketMatchOrder[group.id]
    .map((matchNumber) => matchesByNumber.get(matchNumber))
    .filter(Boolean);
}

function renderBracket(stages, startId = state.bracketStart) {
  state.bracketStart = startId;
  const matchesByNumber = bracketMatchesByNumber(stages);
  const visibleGroups = visibleBracketGroups(startId);
  elements.bracketGrid.style.setProperty(
    "--bracket-column-count",
    visibleGroups.length,
  );
  elements.bracketGrid.innerHTML = `
    <svg class="bracket-connections" aria-hidden="true"></svg>
    ${visibleGroups
    .map(
      (group, groupIndex) => {
        const matches = groupMatches(group, matchesByNumber);
        return `
        <section
          class="bracket-column ${group.id === startId ? "active" : ""} ${group.id === "finals" ? "medal-round final-column" : ""}"
          data-stage="${group.id}"
        >
          <header class="bracket-column-header">
            <span class="round-index">${String(
              bracketGroups.findIndex((item) => item.id === group.id) + 1,
            ).padStart(2, "0")}</span>
            <span class="round-title">
              <small>${group.id === "finals" ? t("bracket.podium") : t("bracket.knockout")}</small>
              <strong>${escapeHtml(t(group.labelKey))}</strong>
            </span>
            <span class="round-match-count">${matches.length} ${matches.length === 1 ? t("bracket.match") : t("bracket.matches")}</span>
          </header>
          <div class="bracket-matches">
            ${matches.map(renderMatchCard).join("")}
          </div>
        </section>
      `;
      },
    )
    .join("")}
  `;
  elements.bracketGrid.querySelectorAll("[data-match-id]").forEach((card) => {
    card.addEventListener("click", () => openMatchModal(card.dataset.matchId));
  });
  window.requestAnimationFrame(() => {
    layoutBracket(visibleGroups);
    window.requestAnimationFrame(drawBracketConnections);
  });
}

function layoutBracket(visibleGroups) {
  const initialGroup = visibleGroups[0];
  if (!initialGroup) return;
  const centers = new Map();
  const slotGap = window.innerWidth <= 760 ? 122 : 134;
  const firstCenter = window.innerWidth <= 760 ? 76 : 84;
  const initialOrder = bracketMatchOrder[initialGroup.id];

  initialOrder.forEach((matchNumber, index) => {
    centers.set(matchNumber, firstCenter + index * slotGap);
  });

  visibleGroups.slice(1).forEach((group) => {
    bracketMatchOrder[group.id].forEach((matchNumber, index) => {
      const sources = bracketDependencies[matchNumber] || [];
      const sourceCenters = sources
        .map((source) => centers.get(source))
        .filter((value) => Number.isFinite(value));
      if (sourceCenters.length === 2) {
        centers.set(
          matchNumber,
          (sourceCenters[0] + sourceCenters[1]) / 2,
        );
      } else {
        centers.set(matchNumber, firstCenter + index * slotGap);
      }
    });
  });

  if (visibleGroups.some((group) => group.id === "finals")) {
    if (initialGroup.id === "finals") {
      centers.set(104, firstCenter);
      centers.set(103, firstCenter + slotGap);
    } else {
      const semiOne = centers.get(101);
      const semiTwo = centers.get(102);
      if (Number.isFinite(semiOne) && Number.isFinite(semiTwo)) {
        const midpoint = (semiOne + semiTwo) / 2;
        centers.set(104, midpoint - slotGap * 0.62);
        centers.set(103, midpoint + slotGap * 0.62);
      }
    }
  }

  const canvasHeight = Math.max(
    360,
    ...[...centers.values()].map((center) => center + slotGap * 0.58),
  );
  elements.bracketGrid.style.setProperty(
    "--bracket-track-height",
    `${canvasHeight}px`,
  );
  elements.bracketGrid.querySelectorAll(".match-slot").forEach((slot) => {
    const center = centers.get(Number(slot.dataset.matchNumber));
    if (Number.isFinite(center)) {
      slot.style.top = `${center}px`;
    }
  });
}

function drawBracketConnections() {
  const svg = elements.bracketGrid.querySelector(".bracket-connections");
  if (!svg) return;
  const rootRect = elements.bracketGrid.getBoundingClientRect();
  const width = elements.bracketGrid.scrollWidth;
  const height = elements.bracketGrid.scrollHeight;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.innerHTML = "";

  Object.entries(bracketDependencies).forEach(([targetNumber, sources]) => {
    const target = elements.bracketGrid.querySelector(
      `.match-slot[data-match-number="${targetNumber}"]`,
    );
    const sourceSlots = sources
      .map((source) =>
        elements.bracketGrid.querySelector(
          `.match-slot[data-match-number="${source}"]`,
        ),
      )
      .filter(Boolean);
    if (!target || sourceSlots.length !== 2) return;

    const targetRect = target.getBoundingClientRect();
    const sourceRects = sourceSlots.map((slot) => slot.getBoundingClientRect());
    const targetX = targetRect.left - rootRect.left;
    const targetY = targetRect.top - rootRect.top + targetRect.height / 2;
    const sourceX = Math.max(
      ...sourceRects.map((rect) => rect.right - rootRect.left),
    );
    const sourceY = sourceRects.map(
      (rect) => rect.top - rootRect.top + rect.height / 2,
    );
    const junctionX = sourceX + Math.max(18, (targetX - sourceX) * 0.5);
    const minY = Math.min(...sourceY, targetY);
    const maxY = Math.max(...sourceY, targetY);
    const path = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    path.setAttribute(
      "d",
      [
        `M ${sourceX} ${sourceY[0]} H ${junctionX}`,
        `M ${sourceX} ${sourceY[1]} H ${junctionX}`,
        `M ${junctionX} ${minY} V ${maxY}`,
        `M ${junctionX} ${targetY} H ${targetX}`,
      ].join(" "),
    );
    path.classList.add("bracket-connector");
    if (Number(targetNumber) === 103) {
      path.classList.add("third-place-connector");
    }
    if (Number(targetNumber) === 104) {
      path.classList.add("world-final-connector");
    }
    svg.appendChild(path);
  });
}

function matchStageLabel(match) {
  return t(`stage.${match.stage}`);
}

function modalProbability(label, value, tone) {
  return `
    <div class="modal-probability">
      <div><span>${escapeHtml(label)}</span><strong>${percent(value)}</strong></div>
      <i><span class="${tone}" style="width:${Math.max(2, Number(value) * 100)}%"></span></i>
    </div>
  `;
}

function openMatchModal(matchId) {
  const match = state.matches.get(matchId);
  if (!match) return;
  state.openMatchId = matchId;
  const winnerText = match.winner
    ? t("modal.advances", { team: match.winner })
    : t("modal.drawResult");
  elements.matchModalContent.innerHTML = `
    <header class="match-modal-header">
      <span>${escapeHtml(matchStageLabel(match))} · ${t("modal.match")} ${match.matchNumber}</span>
      <h2 id="matchModalTitle">${teamName(match.teamA)} ${t("modal.versus")} ${teamName(match.teamB)}</h2>
      <p>${escapeHtml(formatDate(match.date))} · ${escapeHtml(match.venue)}, ${escapeHtml(match.country)}</p>
    </header>
    <div class="modal-scoreboard">
      <div class="modal-score-team">
        <span class="modal-team-flag">${escapeHtml(match.teamA.flag)}</span>
        <strong>${teamName(match.teamA)}</strong>
        <small>${t("modal.titleChance", { value: percent(match.teamA.worldCupProbability) })}</small>
      </div>
      <div class="modal-score">
        <strong>${match.goalsA}<span>:</span>${match.goalsB}</strong>
        <small>${match.afterPenalties ? penaltyText(match) : escapeHtml(winnerText)}</small>
      </div>
      <div class="modal-score-team">
        <span class="modal-team-flag">${escapeHtml(match.teamB.flag)}</span>
        <strong>${teamName(match.teamB)}</strong>
        <small>${t("modal.titleChance", { value: percent(match.teamB.worldCupProbability) })}</small>
      </div>
    </div>
    <div class="match-modal-grid">
      <section class="modal-data-card">
        <span class="modal-card-label">${t("modal.preMatch")}</span>
        ${modalProbability(match.teamA.name, match.probabilities.teamA, "team-a")}
        ${modalProbability(t("modal.draw90"), match.probabilities.draw, "draw")}
        ${modalProbability(match.teamB.name, match.probabilities.teamB, "team-b")}
      </section>
      <section class="modal-data-card">
        <span class="modal-card-label">${t("modal.modelData")}</span>
        <div class="modal-stat-row">
          <span>${t("modal.expectedGoals")}</span>
          <strong>${match.expectedGoals.teamA.toFixed(2)} - ${match.expectedGoals.teamB.toFixed(2)}</strong>
        </div>
        <div class="modal-stat-row">
          <span>${t("modal.baseProbability")}</span>
          <strong>${percent(match.baseProbabilities.teamA)} · ${percent(match.baseProbabilities.draw)} · ${percent(match.baseProbabilities.teamB)}</strong>
        </div>
        <div class="modal-stat-row">
          <span>${t("modal.simulatedWinner")}</span>
          <strong>${escapeHtml(match.winner || t("modal.draw"))}</strong>
        </div>
      </section>
    </div>
  `;
  elements.matchModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  elements.matchModal.querySelector(".match-modal-close").focus();
}

function closeMatchModal() {
  elements.matchModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  state.openMatchId = null;
}

function renderPhaseNav(simulation) {
  elements.phaseNav.innerHTML = bracketGroups
    .map(
      (phase, index) => `
        <button class="phase-button ${phase.id === state.bracketStart ? "active" : ""}" data-phase="${phase.id}">
          ${escapeHtml(t(phase.labelKey))}
        </button>
      `,
    )
    .join("");
  elements.phaseNav.querySelectorAll(".phase-button").forEach((button, index) => {
    button.addEventListener("click", () => {
      setActivePhase(button.dataset.phase, index, bracketGroups.length);
      renderBracket(simulation.stages, button.dataset.phase);
      elements.bracketGrid
        .querySelectorAll(".match-card")
        .forEach((card) => card.classList.add("visible"));
      elements.bracketGrid.closest(".bracket-shell")?.scrollTo({
        left: 0,
        behavior: "smooth",
      });
      document.getElementById("bracket").scrollIntoView({ behavior: "smooth" });
    });
  });
  const activeIndex = bracketGroups.findIndex(
    (phase) => phase.id === state.bracketStart,
  );
  setActivePhase(
    state.bracketStart,
    Math.max(activeIndex, 0),
    bracketGroups.length,
  );
}

function setActivePhase(phaseId, index, total) {
  elements.phaseNav.querySelectorAll(".phase-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.phase === phaseId);
  });
  document.querySelectorAll(".bracket-column").forEach((column) => {
    column.classList.toggle("active", column.dataset.stage === phaseId);
  });
  elements.phaseProgress.style.width = `${((index + 1) / total) * 100}%`;
}

function describeMatch(match) {
  const penalties = match.afterPenalties ? `, ${penaltyText(match).toLowerCase()}` : "";
  return `${match.teamA.name} ${match.goalsA}-${match.goalsB} ${match.teamB.name}${penalties}`;
}

function renderStorylines(simulation) {
  const upset = simulation.summary.biggestUpset;
  const high = simulation.summary.highestScoringMatch;
  elements.storylineGrid.innerHTML = `
    <article class="storyline-card">
      <span class="storyline-number">${percent(upset.winnerPreMatchProbability)}</span>
      <h3>${t("story.upsetTitle")}</h3>
      <p>${escapeHtml(t("story.upsetText", {
        winner: upset.winner,
        probability: percent(upset.winnerPreMatchProbability),
        match: describeMatch(upset),
      }))}</p>
    </article>
    <article class="storyline-card">
      <span class="storyline-number">${high.goalsA + high.goalsB}</span>
      <h3>${t("story.highTitle")}</h3>
      <p>${escapeHtml(t("story.highText", {
        match: describeMatch(high),
        venue: high.venue,
      }))}</p>
    </article>
    <article class="storyline-card">
      <span class="storyline-number">100K</span>
      <h3>${t("story.modelTitle")}</h3>
      <p>${escapeHtml(t("story.modelText", {
        weight: Math.round(simulation.model.priorWeight * 100),
        distribution: distributionLabel(simulation.model.scoreDistribution),
      }))}</p>
    </article>
  `;
}

function launchConfetti() {
  const colors = ["#d8ff38", "#4ee9ff", "#ffffff", "#e6bd55", "#1688ff"];
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 80; index += 1) {
    const piece = document.createElement("i");
    piece.style.position = "fixed";
    piece.style.zIndex = "120";
    piece.style.top = "-18px";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.width = `${5 + Math.random() * 7}px`;
    piece.style.height = `${9 + Math.random() * 12}px`;
    piece.style.background = colors[index % colors.length];
    piece.style.pointerEvents = "none";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.animate(
      [
        { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
        {
          transform: `translate(${(Math.random() - 0.5) * 180}px, 105vh) rotate(${600 + Math.random() * 600}deg)`,
          opacity: 0.15,
        },
      ],
      {
        duration: 2600 + Math.random() * 2400,
        delay: Math.random() * 500,
        easing: "cubic-bezier(.15,.7,.35,1)",
        fill: "forwards",
      },
    ).onfinish = () => piece.remove();
    fragment.appendChild(piece);
  }
  document.body.appendChild(fragment);
}

async function revealTournament(simulation) {
  const groupCards = [...document.querySelectorAll(".group-card")];
  groupCards.forEach((card) => card.classList.add("visible"));
  await delay(500);

  elements.bracketGrid
    .querySelectorAll(".match-card")
    .forEach((card) => card.classList.add("visible"));
  window.requestAnimationFrame(drawBracketConnections);
  await delay(450);
  launchConfetti();
}

function renderSimulation(simulation) {
  state.simulation = simulation;
  state.bracketStart = "round_of_32";
  state.matches = new Map(
    simulation.stages
      .flatMap((stage) => stage.matches)
      .map((match) => [match.matchId, match]),
  );
  elements.emptyState.classList.add("hidden");
  elements.simulationContent.classList.remove("hidden");
  renderChampion(simulation);
  renderPhaseNav(simulation);
  renderGroups(simulation.groups);
  renderBracket(simulation.stages, state.bracketStart);
  renderStorylines(simulation);
  document.getElementById("storyTitle").textContent =
    t("story.championTitle", { team: simulation.summary.champion.name });
  document.getElementById("championStage").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
  revealTournament(simulation);
}

function refreshLanguage() {
  const activeBracketStart = state.bracketStart;
  const openMatchId = state.openMatchId;
  applyStaticTranslations();

  if (state.bootstrap) {
    renderFavorites(state.bootstrap.favorites);
    renderAllProbabilities(state.bootstrap.allTeams);
    const model = state.bootstrap.model;
    document.getElementById("heroMeta").title = t("model.tooltip", {
      rho: model.dixonColesRho,
      distribution: distributionLabel(model.scoreDistribution),
      weight: Math.round(model.monteCarloPriorWeight * 100),
    });
  }

  if (state.simulation) {
    state.bracketStart = activeBracketStart;
    renderChampion(state.simulation);
    renderPhaseNav(state.simulation);
    renderGroups(state.simulation.groups);
    renderBracket(state.simulation.stages, activeBracketStart);
    renderStorylines(state.simulation);
    document.getElementById("storyTitle").textContent = t(
      "story.championTitle",
      { team: state.simulation.summary.champion.name },
    );
    elements.bracketGrid
      .querySelectorAll(".match-card")
      .forEach((card) => card.classList.add("visible"));
  }

  if (openMatchId) openMatchModal(openMatchId);
}

function toggleLanguage() {
  state.language = state.language === "it" ? "en" : "it";
  localStorage.setItem("wc26-language", state.language);
  refreshLanguage();
}

async function simulateTournament() {
  if (state.loading) return;
  state.loading = true;
  elements.simulateButton.disabled = true;
  try {
    const rawSeed = elements.seedInput.value.trim();
    if (!state.engine) throw new Error(t("error.engineReady"));
    const request = Promise.resolve().then(() =>
      state.engine.simulate(rawSeed ? Number(rawSeed) : undefined),
    );
    const simulation = await runLoadingSequence(request);
    renderSimulation(simulation);
  } catch (error) {
    showToast(t("error.simulation", { message: error.message }));
  } finally {
    state.loading = false;
    elements.simulateButton.disabled = false;
  }
}

elements.simulateButton.addEventListener("click", simulateTournament);
elements.languageToggle?.addEventListener("click", toggleLanguage);
elements.seedInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") simulateTournament();
});
elements.teamSearch.addEventListener("input", renderProbabilityTable);
elements.groupFilter.addEventListener("change", renderProbabilityTable);
elements.matchModal.querySelectorAll("[data-close-match]").forEach((button) => {
  button.addEventListener("click", closeMatchModal);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.matchModal.classList.contains("hidden")) {
    closeMatchModal();
  }
});
window.addEventListener("resize", () => {
  if (!state.simulation) return;
  const visibleGroups = visibleBracketGroups(state.bracketStart);
  layoutBracket(visibleGroups);
  window.requestAnimationFrame(drawBracketConnections);
});

document.querySelectorAll("[data-scroll]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    const targetId = button.dataset.scroll;
    const fallback = targetId === "groups" && !state.simulation ? "overview" : targetId;
    document.getElementById(fallback)?.scrollIntoView({ behavior: "smooth" });
  });
});

applyStaticTranslations();
loadBootstrap();
