/** Teste unitário do detetor de eventos (correr com: npx tsx scripts/test-goalwatch.ts) */
import { detectEvents } from "../src/lib/goalWatch";
import type { Match } from "@bancada/core";

const team = (id: number, name: string) => ({ id, name, shortName: name, tla: name.slice(0, 3).toUpperCase(), crest: "" });

const base: Match = {
  id: 1,
  leagueId: "primeira-liga",
  utcDate: new Date().toISOString(),
  status: "IN_PLAY",
  minute: 30,
  matchday: null,
  home: team(10, "Benfica"),
  away: team(20, "Porto"),
  score: { home: 1, away: 0 },
  halfTimeScore: { home: null, away: null },
};

let failures = 0;
function check(name: string, cond: boolean) {
  console.log(cond ? `✓ ${name}` : `✗ ${name}`);
  if (!cond) failures++;
}

// 1. Golo da casa detetado
let ev = detectEvents({ "1": { h: 0, a: 0, status: "IN_PLAY" } }, [base]);
check("golo casa", ev.length === 1 && ev[0]!.kind === "goal" && ev[0]!.scorer === "home");

// 2. Sem mudança → sem eventos
ev = detectEvents({ "1": { h: 1, a: 0, status: "IN_PLAY" } }, [base]);
check("sem mudança", ev.length === 0);

// 3. Dois golos ao mesmo tempo (casa+fora)
ev = detectEvents({ "1": { h: 0, a: 0, status: "IN_PLAY" } }, [
  { ...base, score: { home: 1, away: 1 } },
]);
check("dois golos", ev.length === 2);

// 4. Apito inicial: TIMED → IN_PLAY
ev = detectEvents({ "1": { h: null, a: null, status: "TIMED" } }, [base]);
check("apito inicial", ev.some((e) => e.kind === "kickoff"));

// 5. Final: IN_PLAY → FINISHED
ev = detectEvents({ "1": { h: 1, a: 0, status: "IN_PLAY" } }, [
  { ...base, status: "FINISHED" },
]);
check("apito final", ev.length === 1 && ev[0]!.kind === "fulltime");

// 6. Jogo já FINISHED antes → sem evento final repetido
ev = detectEvents({ "1": { h: 1, a: 0, status: "FINISHED" } }, [
  { ...base, status: "FINISHED" },
]);
check("final não repete", ev.length === 0);

// 7. Primeira observação de jogo a meio (min 30) → sem kickoff tardio
ev = detectEvents({}, [base]);
check("sem kickoff tardio", ev.length === 0);

// 8. Primeira observação nos primeiros minutos → kickoff
ev = detectEvents({}, [{ ...base, minute: 2, score: { home: 0, away: 0 } }]);
check("kickoff cedo", ev.length === 1 && ev[0]!.kind === "kickoff");

if (failures) {
  console.error(`${failures} testes falharam`);
  process.exit(1);
}
console.log("todos os testes passaram ✅");
