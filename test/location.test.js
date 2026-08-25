const test = require("node:test");
const assert = require("node:assert/strict");

const { buildSupabaseRow, coordinateMean, normalizeDatabaseLocation, resolveCoordinates } = require("../api/_lib");

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

test("keeps coordinates supplied by the parser payload", () => {
  const row = buildSupabaseRow({
    parsed: {
      area: "Poblenou",
      macro_area: "Sant Martí",
      latitude: "41.4036",
      longitude: 2.2044,
      coordinate_source: "listing_page",
      coordinate_accuracy: "platform"
    },
    url: "https://example.com/listing"
  });

  assert.equal(row.latitude, 41.4036);
  assert.equal(row.longitude, 2.2044);
  assert.equal(row.coordinate_source, "listing_page");
});

test("averages only valid coordinate pairs", () => {
  assert.deepEqual(
    coordinateMean([
      { latitude: 41.4, longitude: 2.1 },
      { latitude: "41.6", longitude: "2.3" },
      { latitude: null, longitude: 2.2 }
    ]),
    { latitude: 41.5, longitude: 2.2 }
  );
});

test("reuses exact platform coordinates from properties_parsed", async () => {
  const originalFetch = global.fetch;
  const originalUrl = process.env.SUPABASE_URL;
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
  global.fetch = async requestUrl => {
    assert.match(String(requestUrl), /properties_parsed/);
    assert.match(String(requestUrl), /url=eq\./);
    return new Response(JSON.stringify([
      { latitude: 41.401, longitude: 2.171, coordinate_accuracy: "platform" }
    ]), { status: 200, headers: { "content-type": "application/json" } });
  };

  try {
    assert.deepEqual(
      await resolveCoordinates({
        url: "https://example.com/listing/1",
        address: "Carrer de Mallorca 1",
        district: "Eixample",
        barrio: "Dreta de l'Eixample",
        latitude: null,
        longitude: null
      }),
      {
        latitude: 41.401,
        longitude: 2.171,
        coordinate_source: "properties_parsed_url_match",
        coordinate_accuracy: "platform"
      }
    );
  } finally {
    global.fetch = originalFetch;
    if (originalUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = originalUrl;
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
  }
});
