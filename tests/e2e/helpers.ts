import type { Page } from "@playwright/test";

export const widths = [1600, 1440, 1024, 768, 390, 320] as const;

type Box = { x: number; y: number; width: number; height: number };

/**
 * Waits for client requests, fonts and lazy images so screenshots and boxes
 * are final.
 */
export async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    for (const img of document.querySelectorAll<HTMLImageElement>("img[loading=lazy]"))
      img.loading = "eager";
    await Promise.all(
      [...document.images].map((img) =>
        img.complete ? null : new Promise((done) => (img.onload = img.onerror = done)),
      ),
    );
    await document.fonts.ready;
  });
}

/** Rendered geometry of a DeltaWave lockup inside `scope`. */
export function measureBrand(page: Page, scope: string) {
  return page.evaluate((scope) => {
    const root = document.querySelector(scope);
    if (!root) return null;
    const rect = (el: Element | null): Box | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const round = (n: number) => Math.round(n * 1000) / 1000;
      return { x: round(r.x), y: round(r.y), width: round(r.width), height: round(r.height) };
    };
    const brand = root.matches(".brand") ? root : root.querySelector(".brand");
    const texts = [...(brand?.querySelectorAll(".brand-wordmark text") ?? [])] as SVGTextElement[];
    return {
      brand: rect(brand),
      icon: rect(brand?.querySelector(".brand-icon") ?? null),
      image: rect(brand?.querySelector(".brand-icon img") ?? null),
      wordmark: rect(brand?.querySelector(".brand-wordmark") ?? null),
      text: texts.map((t) => {
        const b = t.getBBox();
        return {
          content: t.textContent,
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          advance: t.getComputedTextLength(),
          font: getComputedStyle(t).fontFamily,
        };
      }),
      transform: brand ? getComputedStyle(brand).transform : null,
      elnathLoaded: document.fonts.check("24px ELNATH"),
    };
  }, scope);
}

/** Visible elements whose computed corners are not square. */
export function roundedElements(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("body *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        const s = getComputedStyle(el);
        return [
          s.borderTopLeftRadius,
          s.borderTopRightRadius,
          s.borderBottomLeftRadius,
          s.borderBottomRightRadius,
        ].some((v) => v !== "0px");
      })
      .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`),
  );
}

export function horizontalOverflow(page: Page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
}
