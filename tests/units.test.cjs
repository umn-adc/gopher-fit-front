require("./register-typescript.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  KG_PER_LB,
  convertWeight,
  formatBodyWeight,
  formatHeight,
  formatKilograms,
  formatWeight,
  isWeightUnit,
  preferredWeightUnit,
  roundTenth,
} = require("../lib/units.ts");

test("weight conversions use the exact pound and round trip", () => {
  assert.equal(KG_PER_LB, 0.45359237);
  assert.equal(convertWeight(100, "kg", "kg"), 100);
  assert.equal(convertWeight(225, "lb", "kg"), 225 * 0.45359237);
  assert.equal(roundTenth(convertWeight(100, "kg", "lb")), 220.5);
  assert.equal(
    roundTenth(convertWeight(convertWeight(225, "lb", "kg"), "kg", "lb")),
    225,
  );
  assert.equal(roundTenth(0.05), 0.1);
  assert.equal(roundTenth(102.04999), 102);
});

test("preferences choose the default unit and how records display", () => {
  assert.equal(preferredWeightUnit("imperial"), "lb");
  assert.equal(preferredWeightUnit("metric"), "kg");
  assert.equal(preferredWeightUnit(undefined), "kg");
  assert.ok(isWeightUnit("kg") && isWeightUnit("lb"));
  assert.ok(!isWeightUnit("KG") && !isWeightUnit(""));
  // Rankings are kilograms from the API.
  assert.equal(formatKilograms(225 * KG_PER_LB, "imperial"), "225 lb");
  assert.equal(formatKilograms(102.05828325, "metric"), "102.1 kg");
  assert.equal(formatKilograms(100, undefined), "100 kg");
  assert.equal(formatWeight(135, "lb"), "135 lb");
  assert.equal(formatWeight(150, null), "150 (unit unknown)");
});

test("profile measurements display in the preferred system", () => {
  assert.equal(formatHeight(180, "metric"), "180 cm");
  assert.equal(formatHeight(180, "imperial"), "5′11″");
  assert.equal(formatHeight(183, "imperial"), "6′0″");
  assert.equal(formatHeight(0, "imperial"), "—");
  assert.equal(formatBodyWeight(80, "metric"), "80 kg");
  assert.equal(formatBodyWeight(77, "imperial"), "170 lb");
  assert.equal(formatBodyWeight(0, "metric"), "—");
});
