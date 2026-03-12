import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const OUTPUT_DIR = path.resolve(__dirname, "../public/candidatos");

// slug → X/Twitter handle (cuentas verificadas de los candidatos)
const HANDLES: Record<string, string | null> = {
  "alfonso-lopez-chau-nava": "LopezChauNava",
  "ronald-atencio-sotomayor": null,
  "cesar-acuna-peralta": "CesarAcunaP",
  "jose-williams-zapata": "jwilliamszapata",
  "keiko-fujimori": "KeikoFujimori",
  "fiorella-molinelli": "FioreMolinelli",
  "roberto-sanchez-palomino": "RobertoSanchP",
  "rafael-belaunde-llosa": "BelaundeRafael",
  "pitter-valderrama": "Valderrama_En",
  "ricardo-belmont": "RicardoBelmontC",
  "napoleon-becerra": null,
  "jorge-nieto-montesinos": "JorgeNietoMon",
  "charlie-carrasco": "CharlieCarrasco",
  "alex-gonzalez-castillo": "AlexGonzalesAGC",
  "armando-masse": "masse_dr",
  "george-forsyth": "George_Forsyth",
  "luis-olivera-vega": "foliverav",
  "mesias-guevara": "MesiasGuevara",
  "carlos-alvarez-loayza": null,
  "herbert-caller": null,
  "yonhy-lescano": "yonhy_lescano",
  "alvaro-paz-de-la-barra": "Apazdelabarra",
  "wolfgang-grozo": "WolfgangGrozo",
  "vladimir-cerron": "VLADIMIR_CERRON",
  "francisco-diez-canseco": null,
  "mario-vizcarra-cornejo": null,
  "walter-chirinos": "wchirinosp",
  "carlos-espa": "OficialEspa",
  "carlos-jaico": "CJAICO",
  "jose-luna-galvez": "JoseLunaGalvez",
  "marisol-perez-tello": "marpereztello",
  "paul-jaimes-blanco": "PaulJaimesOF",
  "rafael-lopez-aliaga": "RafaelLopezA",
  "antonio-ortiz-villano": null,
  "rosario-fernandez-bazan": null,
  "roberto-chiabra": "robertochiabra",
};

const NOMBRES: Record<string, string> = {
  "alfonso-lopez-chau-nava": "Alfonso López Chau Nava",
  "ronald-atencio-sotomayor": "Ronald Atencio Sotomayor",
  "cesar-acuna-peralta": "César Acuña Peralta",
  "jose-williams-zapata": "José Williams Zapata",
  "keiko-fujimori": "Keiko Fujimori",
  "fiorella-molinelli": "Fiorella Molinelli",
  "roberto-sanchez-palomino": "Roberto Sánchez Palomino",
  "rafael-belaunde-llosa": "Rafael Belaunde Llosa",
  "pitter-valderrama": "Pitter Valderrama",
  "ricardo-belmont": "Ricardo Belmont",
  "napoleon-becerra": "Napoleón Becerra",
  "jorge-nieto-montesinos": "Jorge Nieto Montesinos",
  "charlie-carrasco": "Charlie Carrasco",
  "alex-gonzalez-castillo": "Alex González Castillo",
  "armando-masse": "Armando Masse",
  "george-forsyth": "George Forsyth",
  "luis-olivera-vega": "Luis Olivera Vega",
  "mesias-guevara": "Mesías Guevara",
  "carlos-alvarez-loayza": "Carlos Álvarez Loayza",
  "herbert-caller": "Herbert Caller",
  "yonhy-lescano": "Yonhy Lescano",
  "alvaro-paz-de-la-barra": "Álvaro Paz de la Barra",
  "wolfgang-grozo": "Wolfgang Grozo",
  "vladimir-cerron": "Vladimir Cerrón",
  "francisco-diez-canseco": "Francisco Diez-Canseco",
  "mario-vizcarra-cornejo": "Mario Vizcarra Cornejo",
  "walter-chirinos": "Walter Chirinos",
  "carlos-espa": "Carlos Espá",
  "carlos-jaico": "Carlos Jaico",
  "jose-luna-galvez": "José Luna Gálvez",
  "marisol-perez-tello": "Marisol Pérez Tello",
  "paul-jaimes-blanco": "Paul Jaimes Blanco",
  "rafael-lopez-aliaga": "Rafael López Aliaga",
  "antonio-ortiz-villano": "Antonio Ortiz Villano",
  "rosario-fernandez-bazan": "Rosario Fernández Bazán",
  "roberto-chiabra": "Roberto Chiabra",
};

function downloadFile(url: string, dest: string, redirects = 0): Promise<boolean> {
  if (redirects > 5) return Promise.resolve(false);
  return new Promise((resolve) => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" } }, (res) => {
      if ((res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) && res.headers.location) {
        res.resume();
        let redirectUrl = res.headers.location;
        // Handle relative redirects
        if (redirectUrl.startsWith("/")) {
          const parsed = new URL(url);
          redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
        }
        downloadFile(redirectUrl, dest, redirects + 1).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { res.resume(); resolve(false); return; }
      const ct = res.headers["content-type"] || "";
      if (!ct.includes("image")) { res.resume(); resolve(false); return; }

      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        if (buf.length < 1000) { resolve(false); return; }
        fs.writeFileSync(dest, buf);
        resolve(true);
      });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(15000, () => { req.destroy(); resolve(false); });
  });
}

function generatePlaceholderSVG(nombre: string): string {
  const parts = nombre.split(" ").filter(Boolean);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : parts[0].slice(0, 2).toUpperCase();
  let hash = 0;
  for (const ch of nombre) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  const colors = [
    ["#1e3a5f", "#2d5a87"], ["#4a1942", "#7b2d6e"], ["#1a4731", "#2d7a52"],
    ["#5c1a1a", "#8b2e2e"], ["#1a365d", "#2b6cb0"], ["#44337a", "#6b46c1"],
    ["#234e52", "#2c7a7b"], ["#742a2a", "#c53030"], ["#2a4365", "#3182ce"],
    ["#553c9a", "#805ad5"],
  ];
  const [bg1, bg2] = colors[Math.abs(hash) % colors.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" style="stop-color:${bg1}"/><stop offset="100%" style="stop-color:${bg2}"/>
  </linearGradient></defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <circle cx="200" cy="200" r="160" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
  <text x="200" y="215" text-anchor="middle" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="rgba(255,255,255,0.9)">${initials}</text>
</svg>`;
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let downloaded = 0, placeholders = 0, failed = 0;

  for (const [slug, handle] of Object.entries(HANDLES)) {
    const jpgPath = path.join(OUTPUT_DIR, `${slug}.jpg`);
    const svgPath = path.join(OUTPUT_DIR, `${slug}.svg`);
    const nombre = NOMBRES[slug] || slug;

    if (!handle) {
      console.log(`[${slug}] Sin handle → placeholder`);
      fs.writeFileSync(svgPath, generatePlaceholderSVG(nombre));
      placeholders++;
      continue;
    }

    process.stdout.write(`[${slug}] @${handle}... `);

    // Intento 1: unavatar.io/x/{handle}
    let ok = await downloadFile(`https://unavatar.io/x/${handle}?fallback=false`, jpgPath);

    // Intento 2: unavatar.io/{handle} (prueba todas las redes)
    if (!ok) ok = await downloadFile(`https://unavatar.io/${handle}?fallback=false`, jpgPath);

    // Intento 3: unavatar.io/twitter/{handle}
    if (!ok) ok = await downloadFile(`https://unavatar.io/twitter/${handle}?fallback=false`, jpgPath);

    if (ok) {
      if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
      console.log("✓ descargada");
      downloaded++;
    } else {
      console.log("✗ placeholder");
      fs.writeFileSync(svgPath, generatePlaceholderSVG(nombre));
      if (fs.existsSync(jpgPath)) fs.unlinkSync(jpgPath);
      failed++;
    }

    await delay(1200);
  }

  console.log(`\n=== Resumen ===`);
  console.log(`✓ Fotos descargadas: ${downloaded}`);
  console.log(`○ Sin handle (placeholder): ${placeholders}`);
  console.log(`✗ Descarga fallida (placeholder): ${failed}`);
  console.log(`Total: ${downloaded + placeholders + failed}/36`);
}

main().catch(console.error);
