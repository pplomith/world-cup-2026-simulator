const state = {
  bootstrap: null,
  engine: null,
  simulation: null,
  matches: new Map(),
  bracketStart: "round_of_32",
  loading: false,
};

const elements = {
  simulateButton: document.getElementById("simulateButton"),
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

const phaseDetails = [
  ["Analisi dei gironi", "72 partite, 12 gruppi, 48 nazionali"],
  ["Classifiche e migliori terze", "Applicazione dei tie-break ufficiali"],
  ["Round of 32", "Composizione del tabellone FIFA"],
  ["Round of 16", "Le possibilità iniziano a restringersi"],
  ["Quarti di finale", "Otto squadre ancora in corsa"],
  ["Semifinali", "Il trofeo è a due partite di distanza"],
  ["Finali", "Titolo mondiale e finale per il terzo posto"],
];

const bracketGroups = [
  { id: "round_of_32", label: "Round of 32", stageIds: ["round_of_32"] },
  { id: "round_of_16", label: "Round of 16", stageIds: ["round_of_16"] },
  { id: "quarter_final", label: "Quarti di finale", stageIds: ["quarter_final"] },
  { id: "semi_final", label: "Semifinali", stageIds: ["semi_final"] },
  {
    id: "finals",
    label: "3° posto e finale",
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
  return `${(Number(value) * 100).toFixed(digits)}%`;
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
  if (numeric > 0 && numeric < 0.001) return "&lt;0.1%";
  return percent(numeric);
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
        <th scope="col" class="position-probability-column">1° posto</th>
        <th scope="col" class="position-probability-column">2° posto</th>
        <th scope="col" class="position-probability-column">3° posto</th>
        <th scope="col" class="position-probability-column">4° posto</th>
      `
    : "";
  elements.probabilityTableHead.innerHTML = `
    <tr>
      <th scope="col">Rank</th>
      <th scope="col">Squadra</th>
      ${groupColumns}
      <th scope="col">R32</th>
      <th scope="col">Ottavi</th>
      <th scope="col">Quarti</th>
      <th scope="col">Semifinale</th>
      <th scope="col">Finale</th>
      <th scope="col" class="title-column">Campione</th>
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
              <th scope="row" class="probability-team" data-label="Squadra">
                ${flag(team)}
                <span>
                  <strong>${teamName(team)}</strong>
                  <small>Gruppo ${escapeHtml(team.group)}</small>
                </span>
              </th>
              ${
                showGroupPositions
                  ? `
                    ${probabilityCell(team.groupFirstProbability, "1° posto", true)}
                    ${probabilityCell(team.groupSecondProbability, "2° posto")}
                    ${probabilityCell(team.groupThirdProbability, "3° posto")}
                    ${probabilityCell(team.groupFourthProbability, "4° posto")}
                  `
                  : ""
              }
              ${probabilityCell(team.roundOf32Probability, "R32")}
              ${probabilityCell(team.roundOf16Probability, "Ottavi")}
              ${probabilityCell(team.quarterFinalProbability, "Quarti")}
              ${probabilityCell(team.semiFinalProbability, "Semifinale")}
              ${probabilityCell(team.reachFinalProbability, "Finale")}
              ${probabilityCell(team.worldCupProbability, "Campione", true)}
            </tr>
          `,
        )
        .join("")
    : `
        <tr class="probability-empty-row">
          <td colspan="${columnCount}">Nessuna squadra corrisponde ai filtri selezionati.</td>
        </tr>
      `;
  elements.probabilityCount.textContent =
    selectedGroup
      ? `Girone ${selectedGroup}: probabilità di posizione e avanzamento`
      : `${filtered.length} di ${teams.length} squadre visualizzate`;
}

function renderAllProbabilities(teams) {
  const groups = [...new Set(teams.map((team) => team.group))].sort();
  elements.groupFilter.innerHTML = `
    <option value="">Tutti i gironi</option>
    ${groups
      .map((group) => `<option value="${escapeHtml(group)}">Gruppo ${escapeHtml(group)}</option>`)
      .join("")}
  `;
  elements.groupQuickFilters.innerHTML = `
    <button class="group-filter-button active" type="button" data-group-filter="">Tutti</button>
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
      `Dixon-Coles rho ${model.dixonColesRho}, ${model.scoreDistribution}, ` +
      `Monte Carlo prior ${Math.round(model.monteCarloPriorWeight * 100)}%`;
  } catch (error) {
    showToast(`Impossibile caricare il modello: ${error.message}`);
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
    const [title, detail] = phaseDetails[index];
    elements.overlayStage.textContent = title;
    elements.overlayDetail.textContent = detail;
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
    elements.overlayStage.textContent = "Convalida del tabellone";
    elements.overlayDetail.textContent = "Controllo delle 32 squadre e dei percorsi knockout";
    await delay(180);
  }
  if (failure) {
    elements.overlay.classList.add("hidden");
    throw failure;
  }
  elements.overlayStage.textContent = "La storia è pronta";
  elements.overlayDetail.textContent = `${result.summary.champion.name} è campione del mondo`;
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
  return `Rigori ${match.penalties.teamA}-${match.penalties.teamB}`;
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
    ? `Il percorso finale: ${route}`
    : "Una nuova strada verso la gloria.";

  elements.podium.innerHTML = `
    <div class="podium-place second">
      <span class="podium-flag">${runnerUp.flag}</span>
      <strong>${teamName(runnerUp)}</strong>
      <span>2ND</span>
    </div>
    <div class="podium-place first">
      <span class="podium-flag">${champion.flag}</span>
      <strong>${teamName(champion)}</strong>
      <span>CHAMPION</span>
    </div>
    <div class="podium-place third">
      <span class="podium-flag">${thirdPlace.flag}</span>
      <strong>${teamName(thirdPlace)}</strong>
      <span>3RD</span>
    </div>
  `;

  elements.storyStats.innerHTML = `
    <div class="story-stat"><span>Gol totali</span><strong>${simulation.summary.totalGoals}</strong></div>
    <div class="story-stat"><span>Gol / partita</span><strong>${simulation.summary.goalsPerMatch.toFixed(2)}</strong></div>
    <div class="story-stat"><span>Serie ai rigori</span><strong>${simulation.summary.penaltyShootouts}</strong></div>
    <div class="story-stat"><span>Chance pre-torneo</span><strong>${percent(champion.worldCupProbability)}</strong></div>
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
            <h3>Group ${group.group}</h3>
            <span>FINAL TABLE</span>
          </header>
          <div class="standings-head">
            <span>#</span><span>TEAM</span><span>P</span><span>GD</span><span>PTS</span>
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
            Vedi le 6 partite
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
        ? "Nascondi le partite"
        : "Vedi le 6 partite";
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
        aria-label="Apri dettagli ${teamName(match.teamA)} contro ${teamName(match.teamB)}"
      >
        <div class="match-meta">
          <span>${isWorldFinal ? "FINALE MONDIALE · " : ""}M${match.matchNumber}</span>
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
          <span>${match.afterPenalties ? penaltyText(match) : isWorldFinal ? "Titolo di campione del mondo" : "Apri statistiche"}</span>
          <strong>DETTAGLI +</strong>
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
              <small>${group.id === "finals" ? "PODIO" : "FASE A ELIMINAZIONE DIRETTA"}</small>
              <strong>${escapeHtml(group.label)}</strong>
            </span>
            <span class="round-match-count">${matches.length} ${matches.length === 1 ? "PARTITA" : "PARTITE"}</span>
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
  const stage = state.simulation?.stages.find((item) => item.id === match.stage);
  return stage?.label || match.stage;
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
  const winnerText = match.winner
    ? `${match.winner} passa il turno`
    : "Partita terminata in pareggio";
  elements.matchModalContent.innerHTML = `
    <header class="match-modal-header">
      <span>${escapeHtml(matchStageLabel(match))} · Match ${match.matchNumber}</span>
      <h2 id="matchModalTitle">${teamName(match.teamA)} vs ${teamName(match.teamB)}</h2>
      <p>${escapeHtml(match.date)} · ${escapeHtml(match.venue)}, ${escapeHtml(match.country)}</p>
    </header>
    <div class="modal-scoreboard">
      <div class="modal-score-team">
        <span class="modal-team-flag">${escapeHtml(match.teamA.flag)}</span>
        <strong>${teamName(match.teamA)}</strong>
        <small>Chance titolo ${percent(match.teamA.worldCupProbability)}</small>
      </div>
      <div class="modal-score">
        <strong>${match.goalsA}<span>:</span>${match.goalsB}</strong>
        <small>${match.afterPenalties ? penaltyText(match) : escapeHtml(winnerText)}</small>
      </div>
      <div class="modal-score-team">
        <span class="modal-team-flag">${escapeHtml(match.teamB.flag)}</span>
        <strong>${teamName(match.teamB)}</strong>
        <small>Chance titolo ${percent(match.teamB.worldCupProbability)}</small>
      </div>
    </div>
    <div class="match-modal-grid">
      <section class="modal-data-card">
        <span class="modal-card-label">PROBABILITÀ PRE-PARTITA</span>
        ${modalProbability(match.teamA.name, match.probabilities.teamA, "team-a")}
        ${modalProbability("Pareggio nei 90'", match.probabilities.draw, "draw")}
        ${modalProbability(match.teamB.name, match.probabilities.teamB, "team-b")}
      </section>
      <section class="modal-data-card">
        <span class="modal-card-label">DATI DEL MODELLO</span>
        <div class="modal-stat-row">
          <span>Expected goals</span>
          <strong>${match.expectedGoals.teamA.toFixed(2)} - ${match.expectedGoals.teamB.toFixed(2)}</strong>
        </div>
        <div class="modal-stat-row">
          <span>Probabilità base 1X2</span>
          <strong>${percent(match.baseProbabilities.teamA)} · ${percent(match.baseProbabilities.draw)} · ${percent(match.baseProbabilities.teamB)}</strong>
        </div>
        <div class="modal-stat-row">
          <span>Vincitore simulato</span>
          <strong>${escapeHtml(match.winner || "Pareggio")}</strong>
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
}

function renderPhaseNav(simulation) {
  elements.phaseNav.innerHTML = bracketGroups
    .map(
      (phase, index) => `
        <button class="phase-button ${phase.id === state.bracketStart ? "active" : ""}" data-phase="${phase.id}">
          ${escapeHtml(phase.label)}
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
      <h3>La sorpresa del torneo</h3>
      <p>${escapeHtml(upset.winner)} ha vinto con appena il ${percent(upset.winnerPreMatchProbability)} di probabilità pre-partita. ${escapeHtml(describeMatch(upset))}.</p>
    </article>
    <article class="storyline-card">
      <span class="storyline-number">${high.goalsA + high.goalsB}</span>
      <h3>La partita più spettacolare</h3>
      <p>${escapeHtml(describeMatch(high))}, giocata a ${escapeHtml(high.venue)}.</p>
    </article>
    <article class="storyline-card">
      <span class="storyline-number">100K</span>
      <h3>Una storia, non un copione</h3>
      <p>Il prior Monte Carlo pesa il ${Math.round(simulation.model.priorWeight * 100)}%, mentre il risultato viene campionato dalla distribuzione calibrata ${escapeHtml(simulation.model.scoreDistribution)}.</p>
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
    `${simulation.summary.champion.name} conquista il mondo.`;
  document.getElementById("championStage").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
  revealTournament(simulation);
}

async function simulateTournament() {
  if (state.loading) return;
  state.loading = true;
  elements.simulateButton.disabled = true;
  try {
    const rawSeed = elements.seedInput.value.trim();
    if (!state.engine) throw new Error("Motore di simulazione non ancora pronto");
    const request = Promise.resolve().then(() =>
      state.engine.simulate(rawSeed ? Number(rawSeed) : undefined),
    );
    const simulation = await runLoadingSequence(request);
    renderSimulation(simulation);
  } catch (error) {
    showToast(`Simulazione non riuscita: ${error.message}`);
  } finally {
    state.loading = false;
    elements.simulateButton.disabled = false;
  }
}

elements.simulateButton.addEventListener("click", simulateTournament);
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

loadBootstrap();
