import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import {
  discoverSearchCardsFromLinks,
  extractVacancyIdFromHref,
} from "./search-card-discovery";

function makeDocument(html: string): Document {
  const window = new Window({ url: "https://hh.ru/search/vacancy?text=dev" });
  window.document.write(html);
  window.document.close();
  return window.document as unknown as Document;
}

describe("extractVacancyIdFromHref", () => {
  it("extracts numeric ID from an absolute HH vacancy URL", () => {
    expect(
      extractVacancyIdFromHref(
        "https://hh.ru/vacancy/134434233?hhtmFrom=vacancy_search_list",
      ),
    ).toBe("134434233");
  });

  it("extracts numeric ID from a relative vacancy URL", () => {
    expect(
      extractVacancyIdFromHref(
        "/vacancy/134434233?hhtmFrom=vacancy_search_list",
      ),
    ).toBe("134434233");
  });

  it("extracts numeric ID from an encoded vacancy URL", () => {
    expect(
      extractVacancyIdFromHref(
        "https%3A%2F%2Fhh.ru%2Fvacancy%2F134434233",
      ),
    ).toBe("134434233");
  });

  it("extracts numeric ID from a query param containing a vacancy URL", () => {
    expect(
      extractVacancyIdFromHref(
        "https://hh.ru/applicant/vacancy_response?vacancyUrl=https%3A%2F%2Fhh.ru%2Fvacancy%2F134434233",
      ),
    ).toBe("134434233");
  });

  it("returns null for malformed input", () => {
    expect(extractVacancyIdFromHref("%E0%A4%A")).toBeNull();
  });

  it("returns null for non-vacancy URLs", () => {
    expect(extractVacancyIdFromHref("https://hh.ru/employer/123")).toBeNull();
    expect(extractVacancyIdFromHref("https://example.com/vacancy/123")).toBeNull();
  });
});

describe("discoverSearchCardsFromLinks", () => {
  it("uses old selector containers when available", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <div data-qa="vacancy-serp-item">
    <h3><a href="/vacancy/111">Frontend Developer</a></h3>
    <p>Company and salary details</p>
  </div>
</body></html>`);

    const cards = discoverSearchCardsFromLinks(doc);

    expect(cards).toHaveLength(1);
    expect(cards[0]?.vacancyId).toBe("111");
    expect(cards[0]?.cardElement).toBe(
      doc.querySelector('[data-qa="vacancy-serp-item"]'),
    );
  });

  it("finds a modern unknown card container from a vacancy link", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <article class="modern-card">
    <div><h2><a href="/vacancy/222">Backend Developer</a></h2></div>
    <p>Company, city, and visible search-card metadata</p>
  </article>
</body></html>`);

    const cards = discoverSearchCardsFromLinks(doc);

    expect(cards).toHaveLength(1);
    expect(cards[0]?.vacancyId).toBe("222");
    expect(cards[0]?.cardElement).toBe(doc.querySelector(".modern-card"));
  });

  it("handles nested anchors and duplicate links without duplicate cards", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <article class="modern-card">
    <header><h2><a href="/vacancy/333">QA Engineer</a></h2></header>
    <footer><a href="/vacancy/333?hhtmFrom=footer">Open vacancy</a></footer>
  </article>
</body></html>`);

    const cards = discoverSearchCardsFromLinks(doc);

    expect(cards).toHaveLength(1);
    expect(cards[0]?.vacancyId).toBe("333");
  });

  it("discovers 50 cards when old containers are absent but vacancy links exist", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  ${Array.from(
    { length: 50 },
    (_, index) => `
      <article class="modern-card">
        <h2>
          <a href="/vacancy/${1000 + index}?hhtmFrom=vacancy_search_list">
            Role ${index} with enough title text
          </a>
        </h2>
        <p>Company ${index} visible metadata for search card discovery</p>
      </article>
    `,
  ).join("")}
</body></html>`);

    expect(doc.querySelectorAll('[data-qa="vacancy-serp-item"], .serp-item'))
      .toHaveLength(0);

    const cards = discoverSearchCardsFromLinks(doc);

    expect(cards).toHaveLength(50);
    expect(new Set(cards.map((card) => card.vacancyId)).size).toBe(50);
    expect(cards.every((card) => card.cardElement !== doc.body)).toBe(true);
    expect(cards.every((card) => card.cardElement !== doc.documentElement)).toBe(
      true,
    );
  });

  it("ignores malformed and non-vacancy links", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <article>
    <a href="/not-vacancy/abc">Not a vacancy</a>
    <a href="%E0%A4%A">Malformed</a>
  </article>
</body></html>`);

    expect(discoverSearchCardsFromLinks(doc)).toEqual([]);
  });

  it("does not return global layout containers", () => {
    const doc = makeDocument(`<!DOCTYPE html>
<html><body>
  <main>
    <article class="modern-card">
      <a href="/vacancy/444">Product Manager role with enough text</a>
      <p>Company and city metadata</p>
    </article>
  </main>
</body></html>`);

    const cards = discoverSearchCardsFromLinks(doc);

    expect(cards).toHaveLength(1);
    expect(cards[0]?.cardElement).toBe(doc.querySelector(".modern-card"));
    expect(cards[0]?.cardElement).not.toBe(doc.querySelector("main"));
  });
});
