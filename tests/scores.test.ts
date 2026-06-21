import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  computeWeightedTotal,
  normalizeDimensionScore,
} from "../src/lib/hr/framework-reference";

describe("monthly score calculation", () => {
  it("sums point inputs when perfect scores match category maximums", () => {
    const total = computeWeightedTotal({
      kpiScore: 75,
      disciplineScore: 10,
      attendanceScore: 10,
      hygieneScore: 2.5,
      extracurricularScore: 2.5,
    });

    assert.equal(total, 100);
  });

  it("still accepts legacy percentage inputs above category maximums", () => {
    const total = computeWeightedTotal({
      kpiScore: 100,
      disciplineScore: 100,
      attendanceScore: 100,
      hygieneScore: 100,
      extracurricularScore: 100,
    });

    assert.equal(total, 100);
  });

  it("normalizes partial KPI performance expressed as points", () => {
    assert.equal(normalizeDimensionScore(37.5, 75), 37.5);
    assert.equal(normalizeDimensionScore(50, 75), 50);
    assert.equal(normalizeDimensionScore(80, 75), 60);
  });
});
