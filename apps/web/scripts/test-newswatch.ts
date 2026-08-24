/** Teste unitário do seletor de notícias (correr com: npx tsx scripts/test-newswatch.ts) */
import { pickNewsToSend } from "../src/lib/newsWatch";
import type { NewsItem } from "@bancada/core";

const NOW = Date.parse("2026-08-24T12:00:00Z");
const item = (id: string, title: string, clubs: string[] = [], hoursAgo = 1): NewsItem => ({
  id,
  title,
  link: `https://example.com/${id}`,
  source: "Record",
  sourceId: "record",
  publishedAt: new Date(NOW - hoursAgo * 3600_000).toISOString(),
  snippet: null,
  image: null,
  clubs,
});

let failures = 0;
const check = (name: string, cond: boolean) => {
  console.log(cond ? `✓ ${name}` : `✗ ${name}`);
  if (!cond) failures++;
};

const clubs = [
  { slug: "benfica", name: "Benfica" },
  { slug: "agf", name: "AGF" },
];

// 1. Notícia com clube detetado → envia
let out = pickNewsToSend([item("a", "Palhinha assina", ["benfica"])], new Set(), clubs, NOW);
check("envia por clube detetado", out.length === 1 && out[0]!.slug === "benfica");

// 2. Já enviada → não repete
out = pickNewsToSend([item("a", "Palhinha assina", ["benfica"])], new Set(["a"]), clubs, NOW);
check("não repete enviada", out.length === 0);

// 3. Notícia antiga (>12h) → ignora
out = pickNewsToSend([item("b", "Velha", ["benfica"], 20)], new Set(), clubs, NOW);
check("ignora antiga", out.length === 0);

// 4. Correspondência por nome no texto (clube estrangeiro sem metadados)
out = pickNewsToSend([item("c", "AGF perde avançado antes da 2ª mão")], new Set(), clubs, NOW);
check("corresponde por nome", out.length === 1 && out[0]!.slug === "agf");

// 5. Limite por clube (máx 3 por ciclo)
out = pickNewsToSend(
  [1, 2, 3, 4, 5].map((n) => item(`d${n}`, `Notícia ${n}`, ["benfica"])),
  new Set(),
  clubs,
  NOW
);
check("limite por clube", out.length === 3);

// 6. Nome só corresponde como palavra inteira ("Real" não apanha "realidade")
out = pickNewsToSend([item("e", "A realidade do mercado")], new Set(), [{ slug: "real", name: "Real" }], NOW);
check("sem correspondência parcial", out.length === 0);

// 7. Sigla como palavra inteira corresponde
out = pickNewsToSend([item("f", "O FCP venceu em casa")], new Set(), [{ slug: "fcp", name: "FCP" }], NOW);
check("sigla corresponde como palavra", out.length === 1);

if (failures) {
  console.error(`${failures} testes falharam`);
  process.exit(1);
}
console.log("todos os testes passaram ✅");
