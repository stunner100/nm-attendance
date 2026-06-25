import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildNominatimLabel,
  formatLocationWithCoordinates,
  formatPlaceLabel,
  pickMoreSpecificLabel,
  shouldRefreshLocationLabel,
} from "../src/lib/reverse-geocode";

describe("reverse-geocode", () => {
  it("buildNominatimLabel includes street and neighbourhood detail", () => {
    const label = buildNominatimLabel({
      house_number: "12",
      road: "Ring Road East",
      suburb: "Osu",
      city: "Accra",
      state: "Greater Accra Region",
      country: "Ghana",
    });

    assert.equal(label, "12 Ring Road East, Osu, Accra, Greater Accra Region, Ghana");
  });

  it("formatPlaceLabel deduplicates repeated parts", () => {
    assert.equal(formatPlaceLabel(["Accra", "Accra", "Ghana"]), "Accra, Ghana");
  });

  it("formatLocationWithCoordinates appends coordinates to place names", () => {
    assert.equal(
      formatLocationWithCoordinates("Accra, Ghana", 5.6037, -0.187),
      "Accra, Ghana · 5.60370, -0.18700"
    );
  });

  it("shouldRefreshLocationLabel only flags empty or coordinate labels", () => {
    assert.equal(shouldRefreshLocationLabel("Accra, Greater Accra, Ghana", 5.6, -0.18), false);
    assert.equal(
      shouldRefreshLocationLabel("12 Ring Road East, Osu, Accra, Ghana", 5.6, -0.18),
      false
    );
    assert.equal(shouldRefreshLocationLabel(null, 5.6, -0.18), true);
    assert.equal(shouldRefreshLocationLabel("5.60000, -0.18000", 5.6, -0.18), true);
  });
});

describe("pickMoreSpecificLabel", () => {
  it("prefers the label with more address parts", () => {
    const coarse = "Accra, Greater Accra Region, Ghana";
    const detailed = "Osu, Ring Road East, Accra, Greater Accra Region, Ghana";

    assert.equal(pickMoreSpecificLabel(coarse, detailed), detailed);
  });
});
