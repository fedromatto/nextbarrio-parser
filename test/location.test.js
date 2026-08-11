const test = require("node:test");
const assert = require("node:assert/strict");

const { buildSupabaseRow, normalizeDatabaseLocation } = require("../api/_lib");

test("uses the specific raw barrio instead of a generic canonical area", () => {
  assert.deepEqual(
    normalizeDatabaseLocation({
      macroArea: "Eixample",
      area: "Eixample",
      areaParsed: "La Nova Esquerra de l'Eixample"
    }),
    { district: "Eixample", barrio: "Nova Esquerra de l'Eixample" }
  );
});

test("normalizes legacy barrio names used by the portal", () => {
  assert.deepEqual(
    normalizeDatabaseLocation({
      macroArea: "Ciutat Vella",
      area: "Gothic Quarter",
      areaParsed: "El Barri Gòtic"
    }),
    { district: "Ciutat Vella", barrio: "Barri Gotic" }
  );
});

test("stores supported cities outside Barcelona consistently", () => {
  assert.deepEqual(
    normalizeDatabaseLocation({
      macroArea: "Hospitalet",
      area: "Hospitalet",
      areaParsed: "L'Hospitalet de Llobregat"
    }),
    { district: "Outside Barcelona", barrio: "L'Hospitalet de Llobregat" }
  );
});

test("always returns non-empty database location fields", () => {
  assert.deepEqual(
    normalizeDatabaseLocation({ macroArea: null, area: null, areaParsed: null }),
    { district: "Unknown", barrio: "Unknown" }
  );
});

test("derives the district when only a recognizable barrio is available", () => {
  assert.deepEqual(
    normalizeDatabaseLocation({ macroArea: null, area: "Poblenou", areaParsed: "El Poblenou" }),
    { district: "Sant Martí", barrio: "Poblenou" }
  );
});

test("the Supabase row always contains district and barrio", () => {
  const row = buildSupabaseRow({
    parsed: {
      area_parsed: "Navas",
      area: "Sant Andreu",
      macro_area: "Sant Andreu"
    },
    url: "https://example.com/listing"
  });

  assert.equal(row.district, "Sant Andreu");
  assert.equal(row.barrio, "Navas");
});
