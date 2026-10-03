// Home Music: coletor de pistas (Europa), corre no GitHub Actions de 48 em 48 h.
// Fonte 1: Resident Advisor, paginas de cidade (JSON embebido __NEXT_DATA__).
// Honestidade operacional: cidades que falhem ficam marcadas com src vazio.
import { writeFileSync, mkdirSync } from "node:fs";

const CITIES = [
  ["pt","lisbon","Lisboa"],["pt","porto","Porto"],["es","madrid","Madrid"],["es","barcelona","Barcelona"],
  ["fr","paris","Paris"],["uk","london","London"],["uk","manchester","Manchester"],["uk","bristol","Bristol"],
  ["uk","glasgow","Glasgow"],["ie","dublin","Dublin"],["nl","amsterdam","Amsterdam"],["nl","rotterdam","Rotterdam"],
  ["be","brussels","Brussels"],["de","berlin","Berlin"],["de","hamburg","Hamburg"],["de","munich","Munich"],
  ["de","cologne","Cologne"],["de","frankfurt","Frankfurt"],["de","leipzig","Leipzig"],["at","vienna","Vienna"],
  ["ch","zurich","Zurich"],["ch","geneva","Geneva"],["it","milan","Milan"],["it","rome","Rome"],["it","turin","Turin"],
  ["dk","copenhagen","Copenhagen"],["se","stockholm","Stockholm"],["no","oslo","Oslo"],["fi","helsinki","Helsinki"],
  ["pl","warsaw","Warsaw"],["pl","krakow","Krakow"],["cz","prague","Prague"],["hu","budapest","Budapest"],
  ["ro","bucharest","Bucharest"],["gr","athens","Athens"]
];

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36";

function walk(o, hits){
  // apanha objetos que parecam listagens de eventos do RA
  if(!o || typeof o !== "object") return;
  if(Array.isArray(o)){ for(const x of o) walk(x, hits); return; }
  const isEvent = o.__typename === "Event" || (o.title && (o.startTime || o.date) && (o.contentUrl || o.urlName));
  if(isEvent){ hits.push(o); }
  for(const k of Object.keys(o)) walk(o[k], hits);
}

async function city(cc, slug, name){
  const url = `https://ra.co/events/${cc}/${slug}`;
  try{
    const r = await fetch(url, { headers: { "user-agent": UA, "accept": "text/html" } });
    if(!r.ok) return { name, cc, slug, src: [], events: [], note: "http "+r.status };
    const html = await r.text();
    const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
    if(!m) return { name, cc, slug, src: [], events: [], note: "sem __NEXT_DATA__" };
    const data = JSON.parse(m[1]);
    const hits = [];
    walk(data, hits);
    const seen = new Set();
    const events = [];
    for(const e of hits){
      const t = e.title;
      const d = e.startTime || e.date || "";
      const venue = (e.venue && (e.venue.name || e.venue.title)) || "";
      let u = e.contentUrl || (e.urlName ? "/events/"+e.urlName : "");
      if(u && !u.startsWith("http")) u = "https://ra.co"+u;
      const key = t+"|"+d;
      if(!t || !u || seen.has(key)) continue;
      seen.add(key);
      events.push({ t, d, v: venue, u, src: "ra" });
      if(events.length >= 14) break;
    }
    return { name, cc, slug, src: events.length ? ["ra"] : [], events, note: events.length ? "" : "pagina sem eventos extraiveis" };
  }catch(err){
    return { name, cc, slug, src: [], events: [], note: String(err).slice(0,120) };
  }
}

const out = { region: "europe", generated: new Date().toISOString(), cadence_h: 48, cities: {} };
for(const [cc, slug, name] of CITIES){
  const c = await city(cc, slug, name);
  out.cities[name.toLowerCase()] = c;
  await new Promise(r => setTimeout(r, 1200)); // cortesia com a fonte
}
mkdirSync("events", { recursive: true });
writeFileSync("events/europe.json", JSON.stringify(out, null, 1));
const okCities = Object.values(out.cities).filter(c => c.events.length).length;
console.log("cidades com eventos:", okCities, "/", CITIES.length);
