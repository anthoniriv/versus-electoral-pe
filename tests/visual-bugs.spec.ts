import { test, expect } from "@playwright/test";

test.describe("Visual bugs - VersusSelector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("Bug 1: Foto del candidato no se actualiza al cambiar selección", async ({ page }) => {
    // Screenshot inicial
    await page.screenshot({ path: "tests/screenshots/01-initial.png", fullPage: true });

    // Seleccionar primer candidato (izquierdo)
    const leftSelect = page.locator("select").first();
    await leftSelect.waitFor({ state: "visible" });

    // Obtener opciones disponibles
    const options = await leftSelect.locator("option").allTextContents();
    console.log("Opciones disponibles:", options.slice(0, 5));

    // Seleccionar primer candidato disponible
    const firstOption = await leftSelect.locator("option:not([value=''])").first();
    const firstValue = await firstOption.getAttribute("value");
    await leftSelect.selectOption(firstValue!);

    await page.waitForTimeout(500);
    await page.screenshot({ path: "tests/screenshots/02-left-selected.png", fullPage: true });

    // Seleccionar segundo candidato (derecho)
    const rightSelect = page.locator("select").last();
    const rightOption = await rightSelect.locator("option:not([value='']):not([disabled])").first();
    const rightValue = await rightOption.getAttribute("value");
    await rightSelect.selectOption(rightValue!);

    await page.waitForTimeout(500);
    await page.screenshot({ path: "tests/screenshots/03-both-selected.png", fullPage: true });

    // AHORA CAMBIAR el candidato izquierdo a otro diferente
    const newLeftOption = await leftSelect.locator("option:not([value='']):not([disabled])").nth(2);
    const newLeftValue = await newLeftOption.getAttribute("value");
    console.log(`Cambiando candidato izquierdo de ${firstValue} a ${newLeftValue}`);
    await leftSelect.selectOption(newLeftValue!);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: "tests/screenshots/04-left-changed.png", fullPage: true });

    // Verificar que la foto se actualizó - la imagen src debería contener el nuevo slug
    const leftPhoto = page.locator(".absolute.inset-y-0.left-0 img").first();
    if (await leftPhoto.count() > 0) {
      const imgSrc = await leftPhoto.getAttribute("src");
      console.log(`Imagen src actual: ${imgSrc}, esperado contener: ${newLeftValue}`);
      // Este test FALLARÁ si la foto no se actualiza (bug actual)
      expect(imgSrc).toContain(newLeftValue!);
    }
  });

  test("Bug 2: Hay 2 velocímetros en vez de 1 comparativo", async ({ page }) => {
    // Seleccionar ambos candidatos
    const leftSelect = page.locator("select").first();
    const rightSelect = page.locator("select").last();

    await leftSelect.waitFor({ state: "visible" });

    // Seleccionar candidatos
    const leftOption = await leftSelect.locator("option:not([value=''])").first();
    await leftSelect.selectOption((await leftOption.getAttribute("value"))!);

    const rightOption = await rightSelect.locator("option:not([value='']):not([disabled])").first();
    await rightSelect.selectOption((await rightOption.getAttribute("value"))!);

    // Click comparar
    const compareBtn = page.locator("button", { hasText: "Comparar" });
    await compareBtn.click();

    // Esperar resultados
    await page.waitForTimeout(3000);
    await page.screenshot({ path: "tests/screenshots/05-comparison-result.png", fullPage: true });

    // Contar velocímetros - actualmente son 2, deberían ser 1
    const velocimetros = page.locator("svg[viewBox='0 0 300 180']");
    const count = await velocimetros.count();
    console.log(`Número de velocímetros encontrados: ${count}`);

    // Este test FALLARÁ porque hay 2 velocímetros (bug actual)
    expect(count).toBe(1);
  });

  test("Screenshot completo del flujo de comparación", async ({ page }) => {
    const leftSelect = page.locator("select").first();
    const rightSelect = page.locator("select").last();

    await leftSelect.waitFor({ state: "visible" });

    // Seleccionar Keiko Fujimori vs César Acuña (candidatos conocidos)
    await leftSelect.selectOption("keiko-fujimori");
    await page.waitForTimeout(300);
    await rightSelect.selectOption("cesar-acuna-peralta");
    await page.waitForTimeout(500);

    await page.screenshot({ path: "tests/screenshots/06-keiko-vs-acuna-preview.png", fullPage: true });

    // Comparar
    const compareBtn = page.locator("button", { hasText: "Comparar" });
    await compareBtn.click();

    await page.waitForTimeout(3500);
    await page.screenshot({ path: "tests/screenshots/07-keiko-vs-acuna-results.png", fullPage: true });
  });
});
