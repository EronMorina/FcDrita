// Reads the FC Drita YouTube channel feed and writes youtube.json for the site.
// YouTube's feed can't be fetched from the browser (no CORS), so a GitHub Action
// runs this on a schedule and commits the result. Run locally with: node scripts/fetch-youtube.mjs
import { writeFile } from "node:fs/promises";

const CHANNEL_ID = "UCSpQ_D3Tjm46L-r7b3G28Zw"; // @FcDritaofficial
const FEED = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

const decode = (s) => s
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, "&");
const pick = (block, re) => { const m = block.match(re); return m ? decode(m[1].trim()) : ""; };

const res = await fetch(FEED, { headers: { "user-agent": "fcdrita-site" } });
if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
const xml = await res.text();

const videos = xml.split("<entry>").slice(1).map((entry) => ({
  id: pick(entry, /<yt:videoId>([^<]+)<\/yt:videoId>/),
  title: pick(entry, /<title>([^<]*)<\/title>/),
  published: pick(entry, /<published>([^<]+)<\/published>/),
  short: /href="https:\/\/www\.youtube\.com\/shorts\//.test(entry),
})).filter((v) => v.id);

if (!videos.length) throw new Error("Feed had no videos; keeping the previous youtube.json");

// No timestamps or view counts: the file only changes (and gets committed) when the video list does.
await writeFile("youtube.json", JSON.stringify({ channel: CHANNEL_ID, videos }, null, 2) + "\n");
console.log(`youtube.json: ${videos.length} videos, newest "${videos[0].title}"`);
