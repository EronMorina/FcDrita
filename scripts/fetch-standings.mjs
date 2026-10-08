// Reads the Albi Mall Superliga table from the Kosovo Football Federation (FFK) and writes standings.json.
// FFK's API rejects requests from other websites' browsers, so a GitHub Action runs this on a schedule
// and commits the result. Run locally with: node scripts/fetch-standings.mjs
import { writeFile } from "node:fs/promises";

const LEAGUE_ID = "2c4745a2-d0f2-495f-aa42-18aad5b20735"; // Albi Mall Superliga (ffk-kosova.com/garat/Albi-Mall-superliga)
const API = `https://api.ffk-kosova.com/api/v1/standings/league/${LEAGUE_ID}`;

const res = await fetch(API, { headers: { "user-agent": "fcdrita-site", accept: "application/json" } });
if (!res.ok) throw new Error(`Standings request failed: ${res.status}`);
const data = await res.json();
if (!Array.isArray(data) || !data.length) throw new Error("No standings returned; keeping the previous standings.json");

const rows = data.map((r) => ({
  team: r.teamName,
  p: r.matchesPlayed, w: r.wins, d: r.draws, l: r.losses,
  gs: r.goalsScored, ga: r.goalsAgainst, gd: r.goalDifference, pts: r.points,
  logo: r.logoUrl || "",
}));

// No timestamp: the file only changes (and gets committed) when the table does.
await writeFile("standings.json", JSON.stringify({ league: "Superliga e Kosovës", source: "https://ffk-kosova.com/garat/Albi-Mall-superliga", rows }, null, 2) + "\n");
console.log(`standings.json: ${rows.length} teams, leader ${rows[0].team} (${rows[0].pts} pts)`);
