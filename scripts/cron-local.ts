import { ejecutarScraping } from "../src/lib/scraper";

async function main() {
  console.log("Starting local cron scraping...");
  console.log("Timestamp:", new Date().toISOString());

  try {
    const results = await ejecutarScraping();
    console.log("Scraping completed successfully:");
    console.log(`  Total: ${results.total}`);
    console.log(`  Nuevas: ${results.nuevas}`);
    if (results.errores.length > 0) {
      console.log(`  Errores (${results.errores.length}):`);
      results.errores.forEach((err) => console.log(`    - ${err}`));
    }
  } catch (error) {
    console.error("Scraping failed:", error);
    process.exit(1);
  }
}

main();
