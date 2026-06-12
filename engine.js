(() => {
  "use strict";

  function engineMessage(italian, english) {
    return document.documentElement.lang === "en" ? english : italian;
  }

  const UINT32_SCALE = 4294967296;
  const UINT32_MAX = 4294967295;
  const ANNEX_C_WINNER_GROUPS = "ABDEGIKL";
  const ANNEX_C_ALLOWED_THIRD_GROUPS = {
    A: "CEFHI",
    B: "EFGIJ",
    D: "BEFIJ",
    E: "ABCDF",
    G: "AEHIJ",
    I: "CDFGH",
    K: "DEIJL",
    L: "EHIJK",
  };
  const STAGE_LABELS = {
    round_of_32: "Round of 32",
    round_of_16: "Round of 16",
    quarter_final: "Quarter-finals",
    semi_final: "Semi-finals",
    third_place: "Third place",
    final: "Final",
  };

  class Rng {
    constructor(seed) {
      this.state = Number(seed) >>> 0;
    }

    uint32() {
      this.state = (this.state + 0x6d2b79f5) >>> 0;
      let value = this.state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return (value ^ (value >>> 14)) >>> 0;
    }

    float() {
      return this.uint32() / UINT32_SCALE;
    }
  }

  function hashSeed(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function expandTeam(team) {
    const probability = team.p;
    return {
      name: team.n,
      group: team.g,
      rank: team.r,
      countryCode: team.c,
      flag: team.f,
      groupFirstProbability: probability[0],
      groupSecondProbability: probability[1],
      groupThirdProbability: probability[2],
      groupFourthProbability: probability[3],
      roundOf32Probability: probability[4],
      roundOf16Probability: probability[5],
      quarterFinalProbability: probability[6],
      semiFinalProbability: probability[7],
      reachFinalProbability: probability[8],
      worldCupProbability: probability[9],
    };
  }

  function readFloatArray(view, offset, count) {
    const output = [];
    for (let index = 0; index < count; index += 1) {
      output.push(view.getFloat32(offset + index * 4, true));
    }
    return output;
  }

  function readCdf(view, offset, count) {
    const output = new Uint32Array(count);
    for (let index = 0; index < count; index += 1) {
      output[index] = view.getUint32(offset + index * 4, true);
    }
    return output;
  }

  function parseBinary(buffer, metadata) {
    const view = new DataView(buffer);
    const magic = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
    );
    if (magic !== "WC26") {
      throw new Error(
        engineMessage("Dataset simulazione non valido", "Invalid simulation dataset"),
      );
    }
    const version = view.getUint16(4, true);
    const teamCount = view.getUint16(6, true);
    const groupCount = view.getUint16(8, true);
    const knockoutCount = view.getUint16(10, true);
    const scoreCells = view.getUint16(12, true);
    if (
      version !== metadata.version ||
      teamCount !== metadata.teams.length ||
      scoreCells !== 121
    ) {
      throw new Error(
        engineMessage(
          "Versione dataset non compatibile",
          "Incompatible dataset version",
        ),
      );
    }

    let offset = 16;
    const groups = [];
    for (let index = 0; index < groupCount; index += 1) {
      const values = readFloatArray(view, offset, 8);
      offset += 32;
      const cdf = readCdf(view, offset, scoreCells);
      offset += scoreCells * 4;
      groups.push({
        expectedGoals: values.slice(0, 2),
        base: values.slice(2, 5),
        probabilities: values.slice(5, 8),
        cdf,
      });
    }

    const knockouts = new Map();
    for (let index = 0; index < knockoutCount; index += 1) {
      const teamA = view.getUint8(offset);
      const teamB = view.getUint8(offset + 1);
      offset += 4;
      const values = readFloatArray(view, offset, 9);
      offset += 36;
      const cdf = readCdf(view, offset, scoreCells);
      offset += scoreCells * 4;
      knockouts.set(`${teamA}:${teamB}`, {
        teamA,
        teamB,
        expectedGoals: values.slice(0, 2),
        base: values.slice(2, 5),
        probabilities: values.slice(5, 8),
        penaltyA: values[8],
        cdf,
      });
    }
    if (offset !== buffer.byteLength) {
      throw new Error(
        engineMessage(
          "Dimensione dataset simulazione non coerente",
          "Invalid simulation dataset size",
        ),
      );
    }
    return { groups, knockouts };
  }

  function sampleScore(model, rng, reverse = false) {
    const threshold = rng.uint32();
    let low = 0;
    let high = model.cdf.length - 1;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (threshold <= model.cdf[middle]) high = middle;
      else low = middle + 1;
    }
    const goalsA = Math.floor(low / 11);
    const goalsB = low % 11;
    return reverse ? [goalsB, goalsA] : [goalsA, goalsB];
  }

  function orientedModel(record, teamA, teamB) {
    if (record.teamA === teamA && record.teamB === teamB) {
      return {
        reverse: false,
        expectedGoals: record.expectedGoals,
        base: record.base,
        probabilities: record.probabilities,
        penaltyA: record.penaltyA,
      };
    }
    return {
      reverse: true,
      expectedGoals: [record.expectedGoals[1], record.expectedGoals[0]],
      base: [record.base[2], record.base[1], record.base[0]],
      probabilities: [
        record.probabilities[2],
        record.probabilities[1],
        record.probabilities[0],
      ],
      penaltyA: 1 - record.penaltyA,
    };
  }

  function rankGroup(table, rng) {
    return [...table.entries()]
      .map(([team, values]) => ({
        team,
        ...values,
        goalDiff: values.gf - values.ga,
        randomTiebreak: rng.float(),
      }))
      .sort(
        (left, right) =>
          right.points - left.points ||
          right.goalDiff - left.goalDiff ||
          right.gf - left.gf ||
          right.randomTiebreak - left.randomTiebreak,
      );
  }

  function validateAnnexC(annexC) {
    const entries = Object.entries(annexC || {});
    if (entries.length !== 495) {
      throw new Error(
        engineMessage(
          `L'Annex C deve contenere 495 combinazioni, trovate ${entries.length}`,
          `Annex C must contain 495 combinations; found ${entries.length}`,
        ),
      );
    }
    entries.forEach(([qualifiedGroups, assignments]) => {
      const distinctQualified = new Set(qualifiedGroups);
      const distinctAssigned = new Set(assignments);
      if (
        !/^[A-L]{8}$/.test(qualifiedGroups) ||
        !/^[A-L]{8}$/.test(assignments) ||
        distinctQualified.size !== 8 ||
        distinctAssigned.size !== 8 ||
        [...distinctAssigned].sort().join("") !== qualifiedGroups
      ) {
        throw new Error(`Invalid Annex C combination: ${qualifiedGroups}`);
      }
      [...ANNEX_C_WINNER_GROUPS].forEach((winnerGroup, index) => {
        if (!ANNEX_C_ALLOWED_THIRD_GROUPS[winnerGroup].includes(assignments[index])) {
          throw new Error(
            `Invalid Annex C assignment: 1${winnerGroup}-3${assignments[index]}`,
          );
        }
      });
    });
  }

  function assignBestThirds(roundOf32, bestThirds, annexC) {
    const slots = [];
    roundOf32.forEach((match) => {
      ["as", "bs"].forEach((side) => {
        const source = match[side] || "";
        if (source.startsWith("Best Third Group ")) {
          const otherSide = side === "as" ? "bs" : "as";
          const winner = /^Winner Group ([A-L])$/.exec(match[otherSide] || "");
          if (!winner) {
            throw new Error(`Best-third slot ${match.i} has no group winner`);
          }
          slots.push({
            matchId: match.i,
            side,
            winnerGroup: winner[1],
            allowed: source.replace("Best Third Group ", "").split("/"),
          });
        }
      });
    });
    const byGroup = new Map(bestThirds.map((item) => [item.group, item.team]));
    if (byGroup.size !== 8 || slots.length !== 8) {
      throw new Error(
        engineMessage(
          "Servono otto migliori terze e otto slot nel tabellone",
          "Eight best third-placed teams and eight bracket slots are required",
        ),
      );
    }
    const qualifiedGroups = [...byGroup.keys()].sort().join("");
    const assignments = annexC[qualifiedGroups];
    if (!assignments) {
      throw new Error(
        engineMessage(
          `Combinazione Annex C non trovata: ${qualifiedGroups}`,
          `Annex C combination not found: ${qualifiedGroups}`,
        ),
      );
    }
    const solution = new Map();

    slots.forEach((slot) => {
      const winnerIndex = ANNEX_C_WINNER_GROUPS.indexOf(slot.winnerGroup);
      const thirdGroup = assignments[winnerIndex];
      if (!slot.allowed.includes(thirdGroup) || !byGroup.has(thirdGroup)) {
        throw new Error(
          `Invalid Annex C slot ${slot.matchId}: 1${slot.winnerGroup}-3${thirdGroup}`,
        );
      }
      solution.set(`${slot.matchId}:${slot.side}`, byGroup.get(thirdGroup));
    });
    return solution;
  }

  function randomSeed() {
    if (window.crypto?.getRandomValues) {
      const value = new Uint32Array(1);
      window.crypto.getRandomValues(value);
      return value[0] & 0x7fffffff;
    }
    return Math.floor(Math.random() * 0x7fffffff);
  }

  class WorldCupEngine {
    constructor(metadata, runtimeData) {
      this.metadata = metadata;
      this.groupModels = runtimeData.groups;
      this.knockoutModels = runtimeData.knockouts;
      this.teams = metadata.teams.map(expandTeam);
      this.schedule = metadata.schedule;
      validateAnnexC(metadata.annexC);
      this.annexC = metadata.annexC;
      this.teamIndex = new Map(this.teams.map((team, index) => [team.name, index]));
      this.bootstrapPayload = this.buildBootstrap();
    }

    buildBootstrap() {
      const groups = Object.entries(this.metadata.groups).map(([group, indexes]) => ({
        group,
        teams: indexes.map((index) => this.teams[index]),
      }));
      return {
        tournament: this.metadata.tournament,
        model: this.metadata.model,
        groups,
        favorites: this.teams.slice(0, 10),
        allTeams: this.teams,
      };
    }

    bootstrap() {
      return this.bootstrapPayload;
    }

    knockoutRecord(teamA, teamB) {
      const direct = this.knockoutModels.get(`${teamA}:${teamB}`);
      if (direct) return direct;
      const reverse = this.knockoutModels.get(`${teamB}:${teamA}`);
      if (reverse) return reverse;
      throw new Error(
        engineMessage(
          `Distribuzione non disponibile: ${this.teams[teamA].name} - ${this.teams[teamB].name}`,
          `Distribution unavailable: ${this.teams[teamA].name} - ${this.teams[teamB].name}`,
        ),
      );
    }

    formatMatch(match, teamA, teamB, goalsA, goalsB, winner, loser, model, afterPenalties, seed) {
      const orientation = orientedModel(model, teamA, teamB);
      let penalties = null;
      if (afterPenalties) {
        const penaltyRng = new Rng(hashSeed(`${seed}:${match.i}:penalties`));
        const loserScore = 3 + Math.floor(penaltyRng.float() * 3);
        const winnerScore = loserScore + 1;
        penalties =
          winner === teamA
            ? { teamA: winnerScore, teamB: loserScore }
            : { teamA: loserScore, teamB: winnerScore };
      }
      const winnerProbability =
        winner === null
          ? null
          : winner === teamA
            ? orientation.probabilities[0]
            : orientation.probabilities[2];
      return {
        matchNumber: match.n,
        matchId: match.i,
        date: match.d,
        stage: match.s,
        group: match.g,
        venue: match.v,
        country: match.c,
        teamA: this.teams[teamA],
        teamB: this.teams[teamB],
        goalsA,
        goalsB,
        winner: winner === null ? null : this.teams[winner].name,
        loser: loser === null ? null : this.teams[loser].name,
        afterPenalties,
        penalties,
        probabilities: {
          teamA: orientation.probabilities[0],
          draw: orientation.probabilities[1],
          teamB: orientation.probabilities[2],
        },
        baseProbabilities: {
          teamA: orientation.base[0],
          draw: orientation.base[1],
          teamB: orientation.base[2],
        },
        expectedGoals: {
          teamA: orientation.expectedGoals[0],
          teamB: orientation.expectedGoals[1],
        },
        winnerPreMatchProbability: winnerProbability,
      };
    }

    simulate(requestedSeed) {
      const parsedSeed = Number(requestedSeed);
      const seed = Number.isFinite(parsedSeed) ? Math.trunc(parsedSeed) : randomSeed();
      const rng = new Rng(seed);
      const groupTablesRaw = new Map();
      Object.entries(this.metadata.groups).forEach(([group, teams]) => {
        groupTablesRaw.set(
          group,
          new Map(teams.map((team) => [team, { points: 0, gf: 0, ga: 0 }])),
        );
      });
      const formattedMatches = [];

      this.schedule.slice(0, 72).forEach((match, index) => {
        const model = this.groupModels[index];
        const [goalsA, goalsB] = sampleScore(model, rng);
        const pointsA = goalsA > goalsB ? 3 : goalsA === goalsB ? 1 : 0;
        const pointsB = goalsB > goalsA ? 3 : goalsA === goalsB ? 1 : 0;
        const table = groupTablesRaw.get(match.g);
        const rowA = table.get(match.a);
        const rowB = table.get(match.b);
        rowA.points += pointsA;
        rowA.gf += goalsA;
        rowA.ga += goalsB;
        rowB.points += pointsB;
        rowB.gf += goalsB;
        rowB.ga += goalsA;
        const winner = goalsA > goalsB ? match.a : goalsB > goalsA ? match.b : null;
        formattedMatches.push(
          this.formatMatch(
            match,
            match.a,
            match.b,
            goalsA,
            goalsB,
            winner,
            null,
            { ...model, teamA: match.a, teamB: match.b, penaltyA: 0.5 },
            false,
            seed,
          ),
        );
      });

      const groupTables = new Map();
      const thirdCandidates = [];
      [...groupTablesRaw.entries()].forEach(([group, table]) => {
        const ranked = rankGroup(table, rng);
        groupTables.set(group, ranked);
        thirdCandidates.push({ group, ...ranked[2] });
      });
      thirdCandidates.sort(
        (left, right) =>
          right.points - left.points ||
          right.goalDiff - left.goalDiff ||
          right.gf - left.gf ||
          right.randomTiebreak - left.randomTiebreak,
      );
      const bestThirds = thirdCandidates.slice(0, 8);
      const qualifiedThirds = new Set(bestThirds.map((item) => item.team));
      const roundOf32Schedule = this.schedule.filter(
        (match) => match.s === "round_of_32",
      );
      const thirdAssignments = assignBestThirds(
        roundOf32Schedule,
        bestThirds,
        this.annexC,
      );
      const resultsByNumber = new Map();

      const resolveSource = (source, matchId, side) => {
        const winnerGroup = /^Winner Group ([A-L])$/.exec(source || "");
        if (winnerGroup) return groupTables.get(winnerGroup[1])[0].team;
        const runnerUpGroup = /^Runner-up Group ([A-L])$/.exec(source || "");
        if (runnerUpGroup) return groupTables.get(runnerUpGroup[1])[1].team;
        if ((source || "").startsWith("Best Third Group ")) {
          return thirdAssignments.get(`${matchId}:${side}`);
        }
        const result = /^(Winner|Loser) Match (\d+)$/.exec(source || "");
        if (result) {
          const previous = resultsByNumber.get(Number(result[2]));
          return result[1] === "Winner" ? previous.winner : previous.loser;
        }
        throw new Error(
          engineMessage(
            `Sorgente tabellone non risolta: ${source}`,
            `Unresolved bracket source: ${source}`,
          ),
        );
      };

      this.schedule.slice(72).forEach((match) => {
        const teamA = resolveSource(match.as, match.i, "as");
        const teamB = resolveSource(match.bs, match.i, "bs");
        if (teamA === teamB) {
          throw new Error(
            engineMessage(
              `Squadra duplicata in M${match.n}`,
              `Duplicate team in M${match.n}`,
            ),
          );
        }
        const record = this.knockoutRecord(teamA, teamB);
        const orientation = orientedModel(record, teamA, teamB);
        const [goalsA, goalsB] = sampleScore(record, rng, orientation.reverse);
        const afterPenalties = goalsA === goalsB;
        let winner;
        let loser;
        if (goalsA > goalsB) {
          winner = teamA;
          loser = teamB;
        } else if (goalsB > goalsA) {
          winner = teamB;
          loser = teamA;
        } else if (rng.float() < orientation.penaltyA) {
          winner = teamA;
          loser = teamB;
        } else {
          winner = teamB;
          loser = teamA;
        }
        resultsByNumber.set(match.n, { winner, loser, teamA, teamB });
        formattedMatches.push(
          this.formatMatch(
            match,
            teamA,
            teamB,
            goalsA,
            goalsB,
            winner,
            loser,
            record,
            afterPenalties,
            seed,
          ),
        );
      });

      const roundOf32Teams = new Set(
        formattedMatches
          .filter((match) => match.stage === "round_of_32")
          .flatMap((match) => [
            this.teamIndex.get(match.teamA.name),
            this.teamIndex.get(match.teamB.name),
          ]),
      );
      const groupsPayload = [...groupTables.entries()].map(([group, standings]) => ({
        group,
        standings: standings.map((record, index) => ({
          position: index + 1,
          team: this.teams[record.team],
          played: 3,
          points: record.points,
          goalsFor: record.gf,
          goalsAgainst: record.ga,
          goalDifference: record.goalDiff,
          qualified: roundOf32Teams.has(record.team),
          bestThird: index === 2 && qualifiedThirds.has(record.team),
        })),
        matches: formattedMatches.filter(
          (match) => match.stage === "group" && match.group === group,
        ),
      }));

      const knockoutMatches = formattedMatches.filter(
        (match) => match.stage !== "group",
      );
      const stages = Object.entries(STAGE_LABELS).map(([id, label]) => ({
        id,
        label,
        matches: knockoutMatches.filter((match) => match.stage === id),
      }));
      const final = knockoutMatches.find((match) => match.stage === "final");
      const thirdPlace = knockoutMatches.find(
        (match) => match.stage === "third_place",
      );
      const decisive = knockoutMatches.filter(
        (match) => match.winnerPreMatchProbability !== null,
      );
      const biggestUpset = decisive.reduce((current, match) =>
        match.winnerPreMatchProbability < current.winnerPreMatchProbability
          ? match
          : current,
      );
      const highestScoringMatch = formattedMatches.reduce((current, match) =>
        match.goalsA + match.goalsB > current.goalsA + current.goalsB
          ? match
          : current,
      );
      const totalGoals = formattedMatches.reduce(
        (total, match) => total + match.goalsA + match.goalsB,
        0,
      );

      return {
        seed,
        generatedAt: new Date().toISOString(),
        model: {
          monteCarloRuns: this.metadata.model.monteCarloRuns,
          priorWeight: this.metadata.model.monteCarloPriorWeight,
          scoreDistribution: this.metadata.model.scoreDistribution,
          scoreDispersion: this.metadata.model.scoreDispersion,
        },
        groups: groupsPayload,
        stages,
        summary: {
          champion: final.teamA.name === final.winner ? final.teamA : final.teamB,
          runnerUp: final.teamA.name === final.loser ? final.teamA : final.teamB,
          thirdPlace:
            thirdPlace.teamA.name === thirdPlace.winner
              ? thirdPlace.teamA
              : thirdPlace.teamB,
          fourthPlace:
            thirdPlace.teamA.name === thirdPlace.loser
              ? thirdPlace.teamA
              : thirdPlace.teamB,
          totalGoals,
          goalsPerMatch: totalGoals / 104,
          penaltyShootouts: knockoutMatches.filter(
            (match) => match.afterPenalties,
          ).length,
          biggestUpset,
          highestScoringMatch,
        },
        revealSequence: [
          { id: "groups", label: "Group stage", delay: 600 },
          { id: "round_of_32", label: "Round of 32", delay: 520 },
          { id: "round_of_16", label: "Round of 16", delay: 520 },
          { id: "quarter_final", label: "Quarter-finals", delay: 560 },
          { id: "semi_final", label: "Semi-finals", delay: 650 },
          { id: "third_place", label: "Third place", delay: 450 },
          { id: "final", label: "The Final", delay: 900 },
        ],
      };
    }
  }

  async function loadEngine() {
    const [metadataResponse, binaryResponse] = await Promise.all([
      fetch("./data/tournament.json"),
      fetch("./data/simulation-data.bin"),
    ]);
    if (!metadataResponse.ok || !binaryResponse.ok) {
      throw new Error(
        engineMessage(
          "Impossibile caricare i dati della simulazione",
          "Unable to load the simulation data",
        ),
      );
    }
    const metadata = await metadataResponse.json();
    const binary = await binaryResponse.arrayBuffer();
    return new WorldCupEngine(metadata, parseBinary(binary, metadata));
  }

  window.WorldCupStatic = { loadEngine, UINT32_MAX };
})();
