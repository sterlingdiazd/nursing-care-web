import { describe, expect, it } from "vitest";

import {
  estimateCareRequestPricingFromCatalog,
  resolveVolumeDiscountPercent,
} from "./pricingFromCatalogOptions";
import type { CatalogOptionsResponse } from "../types/catalog";

const sampleCatalog: CatalogOptionsResponse = {
  careRequestCategories: [
    { code: "domicilio", displayName: "Domicilio", categoryFactor: 1.2 },
  ],
  careRequestTypes: [
    {
      code: "domicilio_24h",
      displayName: "Domicilio 24h",
      careRequestCategoryCode: "domicilio",
      unitTypeCode: "dia_completo",
      basePrice: 3500,
    },
  ],
  unitTypes: [{ code: "dia_completo", displayName: "Dia completo" }],
  distanceFactors: [
    { code: "local", displayName: "Local", multiplier: 1 },
    { code: "lejana", displayName: "Lejana", multiplier: 1.3 },
  ],
  complexityLevels: [{ code: "estandar", displayName: "Estandar", multiplier: 1 }],
  volumeDiscountRules: [
    { minimumCount: 5, discountPercent: 5 },
    { minimumCount: 10, discountPercent: 10 },
  ],
};

describe("resolveVolumeDiscountPercent", () => {
  it("returns zero when there are no prior requests", () => {
    expect(resolveVolumeDiscountPercent(sampleCatalog.volumeDiscountRules, 0)).toBe(0);
  });

  it("picks the highest applicable tier", () => {
    expect(resolveVolumeDiscountPercent(sampleCatalog.volumeDiscountRules, 10)).toBe(10);
    expect(resolveVolumeDiscountPercent(sampleCatalog.volumeDiscountRules, 7)).toBe(5);
  });
});

describe("estimateCareRequestPricingFromCatalog", () => {
  it("matches domicilio path with distance and complexity", () => {
    const r = estimateCareRequestPricingFromCatalog(sampleCatalog, {
      careRequestTypeCode: "domicilio_24h",
      unit: 1,
      distanceFactorCode: "local",
      complexityLevelCode: "estandar",
      existingSameUnitTypeCount: 0,
    });
    expect(r.grandTotal).toBeCloseTo(3500 * 1.2 * 1 * 1, 2);
  });

  it("applies volume discount when prior count qualifies", () => {
    const r = estimateCareRequestPricingFromCatalog(sampleCatalog, {
      careRequestTypeCode: "domicilio_24h",
      unit: 1,
      distanceFactorCode: "local",
      complexityLevelCode: "estandar",
      existingSameUnitTypeCount: 10,
    });
    const line = 3500 * 1.2;
    const unitAfter = line * (1 - 10 / 100);
    expect(r.grandTotal).toBeCloseTo(unitAfter, 2);
  });
});
