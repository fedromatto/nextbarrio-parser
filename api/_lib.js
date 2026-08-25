const fs = require("fs");
const path = require("path");

const MACRO_AREAS = [
  "Ciutat Vella",
  "Eixample",
  "Gràcia",
  "Sants-Montjuïc",
  "Les Corts",
  "Sarrià-Sant Gervasi",
  "Horta-Guinardó",
  "Nou Barris",
  "Sant Andreu",
  "Sant Martí",
  "Hospitalet",
  "Badalona"
];

const SUBAREAS = [
  "Gothic Quarter",
  "El Raval",
  "El Born",
  "Barceloneta",
  "Eixample",
  "Sant Antoni",
  "Sagrada Família",
  "Gràcia",
  "Sants",
  "Poble-sec",
  "Montjuïc",
  "Les Corts",
  "Sarrià-Sant Gervasi",
  "Horta-Guinardó",
  "Nou Barris",
  "Sant Andreu",
  "Poblenou",
  "Sant Martí",
  "Hospitalet",
  "Badalona"
];

const BARRIOS_BY_DISTRICT = {
  "Ciutat Vella": ["El Raval", "Barri Gotic", "Barceloneta", "El Born"],
  "Eixample": ["Dreta de l'Eixample", "Antiga Esquerra de l'Eixample", "Nova Esquerra de l'Eixample", "Fort Pienc", "Sagrada Família", "Sant Antoni"],
  "Gràcia": ["Vila de Gracia", "Camp d'en Grassot i Gràcia Nova", "la Salut", "Vallcarca i els Penitents", "Coll"],
  "Sants-Montjuïc": ["Poble-sec", "Marina del Prat Vermell", "Marina de Port", "Font de la Guatlla", "Hostafrancs", "la Bordeta", "Sants - Badal", "Sants"],
  "Les Corts": ["Les Corts", "Maternitat i Sant Ramon", "Pedralbes"],
  "Sarrià-Sant Gervasi": ["Vallvidrera, el Tibidabo i les Planes", "Sarrià", "Tres Torres", "Sant Gervasi - la Bonanova", "Sant Gervasi - Galvany", "Putxet i el Farró"],
  "Horta-Guinardó": ["Baix Guinardó", "Can Baró", "Guinardó", "Font d'en Fargues", "Carmel", "Teixonera", "Sant Genís dels Agudells", "Montbau", "Vall d'Hebron", "Clota", "Horta"],
  "Nou Barris": ["Vilapicina i la Torre Llobeta", "Porta", "Turó de la Peira", "Can Peguera", "Guineueta", "Canyelles", "Roquetes", "Verdun", "Prosperitat", "Trinitat Nova", "Torre Baró", "Ciutat Meridiana", "Vallbona"],
  "Sant Andreu": ["Trinitat Vella", "Baró de Viver", "Bon Pastor", "Sant Andreu", "Sagrera", "Congrés i els Indians", "Navas"],
  "Sant Martí": ["Camp de l'Arpa del Clot", "el Clot", "Parc i la Llacuna del Poblenou", "Vila Olímpica del Poblenou", "Poblenou", "Diagonal Mar i el Front Marítim del Poblenou", "Besòs i el Maresme", "Provençals del Poblenou", "Sant Martí de Provençals", "Verneda i la Pau"]
};

const BARRIO_ALIASES = {
  "Barri Gotic": ["Gothic Quarter", "Barri Gòtic", "El Gòtic"],
  "El Born": ["Born", "La Ribera", "Sant Pere, Santa Caterina i la Ribera"],
  "Dreta de l'Eixample": ["Eixample Dreta", "Eixample derecha", "La Dreta de l'Eixample"],
  "Antiga Esquerra de l'Eixample": ["Eixample Antiga Esquerra", "L'Antiga Esquerra de l'Eixample"],
  "Nova Esquerra de l'Eixample": ["Eixample Esquerra", "Eixample Nova Esquerra", "La Nova Esquerra de l'Eixample"],
  "Vila de Gracia": ["Gràcia", "Gracia", "Vila de Gràcia"],
  "Vallcarca i els Penitents": ["Vallcarca"],
  "Sants - Badal": ["Sants-Badal", "Sants Badal"],
  "Marina de Port": ["La Marina del Port", "La Marina de Port"],
  "Maternitat i Sant Ramon": ["La Maternitat", "La Maternitat i Sant Ramon"],
  "Tres Torres": ["Les Tres Torres"],
  "Putxet i el Farró": ["El Putxet", "El Putxet i el Farró", "Putxet - El Farró"],
  "Sagrera": ["La Sagrera"],
  "Camp de l'Arpa del Clot": ["Camp de l'Arpa", "El Camp de l'Arpa del Clot"],
  "el Clot": ["Clot"],
  "Parc i la Llacuna del Poblenou": ["El Parc i la Llacuna del Poblenou"],
  "Vila Olímpica del Poblenou": ["La Vila Olímpica", "Vila Olímpica"],
  "Besòs i el Maresme": ["El Besòs", "Besòs"]
};

const OUTSIDE_BARRIOS = {
  Hospitalet: "L'Hospitalet de Llobregat",
  Badalona: "Badalona"
};

const REQUIRED_LOCATION_COLUMNS = new Set(["district", "barrio"]);

const AREA_RULES = [
  { variants: ["el born", "born", "la ribera", "sant pere", "santa caterina"], area: "El Born", macroArea: "Ciutat Vella" },
  { variants: ["barri gòtic", "barri gotic", "gòtic", "gotic", "gotico", "gothic quarter", "el gòtic"], area: "Gothic Quarter", macroArea: "Ciutat Vella" },
  { variants: ["el raval", "raval"], area: "El Raval", macroArea: "Ciutat Vella" },
  { variants: ["barceloneta", "la barceloneta"], area: "Barceloneta", macroArea: "Ciutat Vella" },
  { variants: ["sant antoni"], area: "Sant Antoni", macroArea: "Eixample" },
  { variants: ["sagrada família", "sagrada familia", "la sagrada família"], area: "Sagrada Família", macroArea: "Eixample" },
  { variants: ["fort pienc"], area: null, macroArea: "Eixample" },
  { variants: ["eixample", "l'eixample", "dreta de l'eixample", "esquerra de l'eixample", "nova esquerra de l'eixample", "antiga esquerra de l'eixample", "l'antiga esquerra de l'eixample"], area: "Eixample", macroArea: "Eixample" },
  { variants: ["gràcia", "gracia", "vila de gràcia", "camp d'en grassot"], area: "Gràcia", macroArea: "Gràcia" },
  { variants: ["sants", "sants-badal", "hostafrancs"], area: "Sants", macroArea: "Sants-Montjuïc" },
  { variants: ["poble sec", "poble-sec", "el poble sec"], area: "Poble-sec", macroArea: "Sants-Montjuïc" },
  { variants: ["montjuïc", "montjuic"], area: "Montjuïc", macroArea: "Sants-Montjuïc" },
  { variants: ["les corts", "pedralbes", "la maternitat"], area: "Les Corts", macroArea: "Les Corts" },
  { variants: ["sarrià-sant gervasi", "sarria-sant gervasi", "sarrià", "sarria", "sant gervasi", "les tres torres", "el putxet", "sant gervasi - la bonanova"], area: "Sarrià-Sant Gervasi", macroArea: "Sarrià-Sant Gervasi" },
  { variants: ["horta-guinardó", "horta-guinardo", "horta", "guinardó", "guinardo"], area: "Horta-Guinardó", macroArea: "Horta-Guinardó" },
  { variants: ["nou barris"], area: "Nou Barris", macroArea: "Nou Barris" },
  { variants: ["sant andreu"], area: "Sant Andreu", macroArea: "Sant Andreu" },
  { variants: ["poblenou", "el poblenou", "poble nou", "la vila olímpica", "vila olímpica", "rambla del poblenou"], area: "Poblenou", macroArea: "Sant Martí" },
  { variants: ["sant martí", "sant marti", "el clot", "camp de l'arpa", "el parc i la llacuna"], area: "Sant Martí", macroArea: "Sant Martí" },
  { variants: ["hospitalet", "l'hospitalet", "l'hospitalet de llobregat", "hospitalet de llobregat"], area: "Hospitalet", macroArea: "Hospitalet" },
  { variants: ["badalona"], area: "Badalona", macroArea: "Badalona" }
];

const SOURCE_PATTERNS = [
  ["idealista.com", "idealista"],
  ["fotocasa.es", "fotocasa"],
  ["pisos.com", "pisos.com"],
  ["shbarcelona.com", "sh barcelona"],
  ["atemporalbarcelona.com", "atemporal barcelona"],
  ["badi.com", "badi"],
  ["habitaclia.com", "habitaclia"],
  ["yaencontre.com", "yaencontre"],
  ["spotahome.com", "spotahome"],
  ["uniplaces.com", "uniplaces"],
  ["housinganywhere.com", "housinganywhere"]
];

function getEnv() {
  const localConfig = readLocalConfig();

  return {
    claudeApiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || localConfig.claude_api_key || "",
    supabaseUrl: normalizeSupabaseUrl(process.env.SUPABASE_URL || localConfig.supabase_url || ""),
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || localConfig.supabase_service_role_key || localConfig.supabase_key || ""
  };
}

function readLocalConfig() {
  const configPath = path.join(__dirname, "..", "config.json");
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    return {};
  }
}

function normalizeSupabaseUrl(url) {
  return url
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/rest\/v1$/i, "");
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(payload));
}

function sendError(res, error) {
  const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  sendJson(res, status, { error: error.message });
}

function requirePost(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.end();
    return false;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return false;
  }
  return true;
}

function getSourceFromUrl(url = "") {
  const lower = url.toLowerCase();
  const found = SOURCE_PATTERNS.find(([domain]) => lower.includes(domain));
  return found ? found[1] : null;
}

async function readJson(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

async function callClaude({ apiKey, listingText, listingUrl = "" }) {
  if (!apiKey) throw new Error("Claude API key not configured");

  const macroAreas = MACRO_AREAS.map(area => `"${area}"`).join(", ");
  const prompt = `Extract property listing information from the following text. The listing may be in Spanish, Italian, English, or Catalan. It may be a RENTAL or SALE listing.
Return ONLY valid JSON with these fields (use null if not found):
{
  "listing_type": "flat" or "room",
  "property_type": "long_term", "temporal", or "vacacional",
  "address": "string",
  "area_parsed": "raw neighbourhood/district string exactly as written in the listing",
  "sub_area": "raw neighbourhood/district string exactly as written in the listing",
  "area": "best canonical sub-area, if clear. MUST be one of: ${SUBAREAS.map(area => `"${area}"`).join(", ")}",
  "macro_area": "best canonical district, if clear. MUST be one of: ${macroAreas}",
  "availability": "available" or "not available yet" or "not available anymore",
  "availability_date": "YYYY-MM-DD or null",
  "price_month": number,
  "size_m2": number,
  "price_m2": number,
  "double_bedrooms": number,
  "single_bedrooms": number,
  "terrace": boolean,
  "external": boolean,
  "balcony": boolean,
  "elevator": boolean,
  "air_conditioning": boolean,
  "closets": boolean,
  "wifi_included": boolean,
  "utilities_included": boolean,
  "comments": "string",
  "condition": "string",
  "overall_description": "2-3 sentence summary in English",
  "agent_owner": "agency, agent, or owner if mentioned",
  "admits_couples": true or false or null
}

IMPORTANT:
- European number format: "1.200 EUR" means 1200 euros.
- If total bedrooms are mentioned but not split into double/single, put total in double_bedrooms and 0 in single_bedrooms.
- For rooms in shared flats, count the room being rented.
- Preserve the raw neighbourhood/district text in area_parsed.
- Map neighbourhoods to the closest canonical area and macro_area when possible.
- Classify property_type as "vacacional" when the listing explicitly says vacation/leisure use, for example "vacacional", "vacaciones", "ocio/vacacional", or "uso exclusivo vacaciones/ocio".
- Classify property_type as "temporal" for seasonal/temporary residential rentals that are not vacation/leisure use, especially when the text refers to an accredited temporary cause such as studies, work, medical treatment, relocation, or "causa temporal".
- Classify property_type as "long_term" for habitual residence or long-stay rentals.

Listing URL: ${listingUrl || "Not provided"}

Listing text:
${listingText}`;

  const result = await fetchClaudeWithRetry({ apiKey, prompt });

  const responseText = result.content?.map(part => part.text || "").join("\n") || "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse Claude response as JSON");
  return JSON.parse(jsonMatch[0]);
}

async function fetchClaudeWithRetry({ apiKey, prompt }) {
  const maxAttempts = Number(process.env.CLAUDE_MAX_ATTEMPTS || 2);
  const models = uniqueValues([
    process.env.CLAUDE_MODEL || "claude-sonnet-4-5",
    process.env.CLAUDE_FALLBACK_MODEL || "claude-haiku-4-5"
  ]);
  let lastError = null;

  for (const model of models) {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await fetchClaude({ apiKey, prompt, model });
        return result;
      } catch (error) {
        lastError = error;
        if (!isRetryableClaudeError(error) || attempt === maxAttempts) break;
        await wait(500 * attempt * attempt);
      }
    }

    if (!isRetryableClaudeError(lastError)) break;
  }

  throw lastError;
}

async function fetchClaude({ apiKey, prompt, model }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const result = await readResponseJson(response, "Claude");
  if (!response.ok) {
    const message = result.error?.message || `Claude API error: ${response.status}`;
    const statusCode = isRetryableClaudeResponse(response, result) ? 503 : response.status;
    throw createError(message, statusCode, { model, upstreamStatus: response.status, type: result.error?.type });
  }

  return result;
}

async function readResponseJson(response, serviceName) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 300);
    const message = `${serviceName} returned a non-JSON response (${response.status}): ${preview || "empty response"}`;
    const statusCode = response.status >= 500 ? 503 : response.status;
    throw createError(message, statusCode, { upstreamStatus: response.status });
  }
}

function createError(message, statusCode, extra = {}) {
  const error = new Error(message);
  error.statusCode = statusCode;
  Object.assign(error, extra);
  return error;
}

function isRetryableClaudeError(error) {
  return error.statusCode === 503 || error.upstreamStatus === 429;
}

function isRetryableClaudeResponse(response, result) {
  const message = String(result.error?.message || "").toLowerCase();
  return response.status === 429 || response.status >= 500 || result.error?.type === "overloaded_error" || message.includes("overloaded");
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function toFiniteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toRoundedInteger(value) {
  const number = toFiniteNumber(value);
  return number === null ? null : Math.round(number);
}

function isValidCoordinatePair(row) {
  const latitude = toFiniteNumber(row?.latitude);
  const longitude = toFiniteNumber(row?.longitude);
  return latitude !== null && longitude !== null
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;
}

function coordinateMean(rows) {
  const valid = (rows || []).filter(isValidCoordinatePair);
  if (valid.length === 0) return null;
  return {
    latitude: valid.reduce((sum, row) => sum + Number(row.latitude), 0) / valid.length,
    longitude: valid.reduce((sum, row) => sum + Number(row.longitude), 0) / valid.length
  };
}

function stableHash(value) {
  let hash = 2166136261;
  for (const char of String(value || "")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function jitterCoordinate(coordinate, seed, scale) {
  if (!scale) return coordinate;
  const hash = stableHash(seed);
  const angle = (hash % 3600) * Math.PI / 1800;
  const radius = scale * (0.35 + ((hash >>> 12) % 650) / 1000);
  return {
    latitude: coordinate.latitude + Math.sin(angle) * radius,
    longitude: coordinate.longitude + Math.cos(angle) * radius
  };
}

function meaningfulLocation(value) {
  const normalized = normalizePlace(value);
  return normalized && normalized !== "unknown" ? normalized : "";
}

async function fetchCoordinateRows(filters, limit = 200) {
  const params = new URLSearchParams({
    select: "latitude,longitude,coordinate_accuracy,district,barrio,area,macro_area",
    latitude: "not.is.null",
    longitude: "not.is.null",
    limit: String(limit)
  });
  for (const [column, value] of Object.entries(filters)) {
    if (value) params.set(column, `eq.${value}`);
  }
  return supabaseFetch(`/rest/v1/properties_parsed?${params.toString()}`);
}

function coordinateResult(rows, source, accuracy, seed, jitterScale = 0) {
  const coordinate = coordinateMean(rows);
  if (!coordinate) return null;
  const adjusted = jitterCoordinate(coordinate, seed, jitterScale);
  return {
    ...adjusted,
    coordinate_source: source,
    coordinate_accuracy: accuracy
  };
}

async function resolveCoordinates(row) {
  if (isValidCoordinatePair(row)) {
    return {
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      coordinate_source: row.coordinate_source || "parser_payload",
      coordinate_accuracy: row.coordinate_accuracy || "platform"
    };
  }

  const seed = row.url || row.address || `${row.district || ""}|${row.barrio || ""}`;
  try {
    if (row.url) {
      const urlRows = await fetchCoordinateRows({ url: row.url }, 20);
      const exactUrl = coordinateResult(urlRows, "properties_parsed_url_match", "platform", seed);
      if (exactUrl) return exactUrl;
    }

    if (row.address) {
      const addressRows = await fetchCoordinateRows({ address: row.address });
      const expectedDistrict = meaningfulLocation(row.district || row.macro_area);
      const expectedBarrio = meaningfulLocation(row.barrio || row.area);
      const matchingRows = addressRows.filter(candidate => {
        const district = meaningfulLocation(candidate.district || candidate.macro_area);
        const barrio = meaningfulLocation(candidate.barrio || candidate.area);
        return (!expectedDistrict || district === expectedDistrict)
          && (!expectedBarrio || barrio === expectedBarrio);
      });
      const addressMatch = coordinateResult(
        matchingRows.length > 0 ? matchingRows : addressRows,
        "properties_parsed_address_average",
        "approximate_address",
        seed,
        0.00016
      );
      if (addressMatch) return addressMatch;
    }

    const barrio = meaningfulLocation(row.barrio);
    if (barrio) {
      const barrioRows = await fetchCoordinateRows({ barrio: row.barrio });
      const barrioMatch = coordinateResult(
        barrioRows,
        "properties_parsed_barrio_average",
        "approximate_barrio",
        seed,
        0.00028
      );
      if (barrioMatch) return barrioMatch;
    }

    const area = meaningfulLocation(row.area);
    if (area) {
      const areaRows = await fetchCoordinateRows({ area: row.area });
      const areaMatch = coordinateResult(
        areaRows,
        "properties_parsed_area_average",
        "approximate_area",
        seed,
        0.00045
      );
      if (areaMatch) return areaMatch;
    }

    const district = meaningfulLocation(row.district || row.macro_area);
    if (district && district !== "outside barcelona") {
      const districtRows = await fetchCoordinateRows({ district: row.district || row.macro_area });
      const districtMatch = coordinateResult(
        districtRows,
        "properties_parsed_district_average",
        "approximate_district",
        seed,
        0.0007
      );
      if (districtMatch) return districtMatch;
    }
  } catch (error) {
    // Coordinate enrichment is best-effort and must not prevent saving a listing.
    console.warn(`Coordinate lookup failed: ${error.message}`);
  }

  return null;
}

function buildSupabaseRow({ parsed, url, images = [], title = "", source = null }) {
  const priceMonth = toRoundedInteger(parsed.price_month);
  const sizeM2 = toFiniteNumber(parsed.size_m2);
  const priceM2 = toFiniteNumber(parsed.price_m2);
  const calculatedPriceM2 = priceMonth !== null && sizeM2 ? Number((priceMonth / sizeM2).toFixed(2)) : priceM2;
  const singleBedrooms = toRoundedInteger(parsed.single_bedrooms);
  const doubleBedrooms = toRoundedInteger(parsed.double_bedrooms);
  const location = normalizeLocation(parsed);
  const databaseLocation = normalizeDatabaseLocation(location);

  return {
    name: title || parsed.overall_description || "New Listing",
    flat_or_room: parsed.listing_type ?? null,
    property_type: parsed.property_type ?? null,
    parsed_at: new Date().toISOString(),
    url: url || null,
    source,
    images,
    address: parsed.address ?? null,
    status: "to_contact",
    macro_area: location.macroArea,
    area: location.area,
    area_parsed: location.areaParsed,
    district: databaseLocation.district,
    barrio: databaseLocation.barrio,
    latitude: toFiniteNumber(parsed.latitude),
    longitude: toFiniteNumber(parsed.longitude),
    coordinate_source: parsed.coordinate_source ?? null,
    coordinate_accuracy: parsed.coordinate_accuracy ?? null,
    sub_area: location.areaParsed,
    availability: parsed.availability ?? null,
    available_from: parsed.availability_date ?? null,
    availability_date: parsed.availability_date ?? null,
    price_month: priceMonth,
    size_m2: sizeM2,
    price_m2: calculatedPriceM2,
    single_rooms: singleBedrooms,
    single_bedrooms: singleBedrooms,
    double_rooms: doubleBedrooms,
    double_bedrooms: doubleBedrooms,
    terrace: parsed.terrace ?? false,
    external: parsed.external ?? false,
    balcony: parsed.balcony ?? false,
    elevator: parsed.elevator ?? false,
    air_conditioning: parsed.air_conditioning ?? false,
    closets: parsed.closets ?? false,
    wifi_included: parsed.wifi_included ?? false,
    utilities_included: parsed.utilities_included ?? false,
    comments: parsed.comments ?? null,
    condition: parsed.condition ?? null,
    overall_description: parsed.overall_description ?? null,
    agent_owner: parsed.agent_owner ?? null,
    admits_couples: parsed.admits_couples ?? null,
    notes: parsed.condition ?? null
  };
}

function normalizeLocation(parsed) {
  const rawArea = firstText(parsed.area_parsed, parsed.sub_area, parsed.area);
  const exact = findAreaRule(rawArea, true) || findAreaRule(parsed.area, true);
  if (exact) {
    return {
      macroArea: exact.macroArea,
      area: exact.area,
      areaParsed: rawArea || parsed.area || exact.area || exact.macroArea
    };
  }

  const patternText = firstText(rawArea, parsed.address, parsed.overall_description, parsed.comments);
  const pattern = findAreaRule(patternText, false);
  if (pattern) {
    return {
      macroArea: pattern.macroArea,
      area: pattern.area,
      areaParsed: rawArea || pattern.area || pattern.macroArea
    };
  }

  const canonicalArea = canonicalize(parsed.area, SUBAREAS);
  if (canonicalArea) {
    return {
      macroArea: macroAreaForSubarea(canonicalArea),
      area: canonicalArea,
      areaParsed: rawArea || canonicalArea
    };
  }

  const canonicalMacroArea = canonicalize(parsed.macro_area, MACRO_AREAS);
  if (canonicalMacroArea) {
    return {
      macroArea: canonicalMacroArea,
      area: singleSubareaForMacro(canonicalMacroArea),
      areaParsed: rawArea || canonicalMacroArea
    };
  }

  return {
    macroArea: null,
    area: rawArea || null,
    areaParsed: rawArea || null
  };
}

function firstText(...values) {
  return values.find(value => typeof value === "string" && value.trim())?.trim() || "";
}

function findAreaRule(value, exactOnly) {
  const normalized = normalizeText(value);
  if (!normalized) return null;

  for (const rule of AREA_RULES) {
    for (const variant of rule.variants) {
      const normalizedVariant = normalizeText(variant);
      if (exactOnly ? normalized === normalizedVariant : normalized.includes(normalizedVariant)) {
        return rule;
      }
    }
  }

  return null;
}

function canonicalize(value, allowedValues) {
  const normalized = normalizeText(value);
  return allowedValues.find(allowedValue => normalizeText(allowedValue) === normalized) || null;
}

function normalizeDatabaseLocation(location) {
  const macroArea = canonicalize(location.macroArea, MACRO_AREAS) || firstText(location.macroArea);
  const outsideBarrio = OUTSIDE_BARRIOS[macroArea];
  if (outsideBarrio) {
    return {
      district: "Outside Barcelona",
      barrio: outsideBarrio
    };
  }

  let district = canonicalize(macroArea, Object.keys(BARRIOS_BY_DISTRICT)) || macroArea || "Unknown";
  const barrio = (
    findCanonicalBarrio(location.areaParsed, district) ||
    findCanonicalBarrio(location.area, district) ||
    canonicalBarrio(location.area) ||
    canonicalBarrio(location.areaParsed) ||
    "Unknown"
  );

  if (district === "Unknown" && barrio !== "Unknown") {
    district = districtForBarrio(barrio) || district;
  }

  return { district, barrio };
}

function districtForBarrio(barrio) {
  return Object.entries(BARRIOS_BY_DISTRICT)
    .find(([, barrios]) => barrios.includes(barrio))?.[0] || null;
}

function findCanonicalBarrio(value, district) {
  const normalized = normalizePlace(value);
  if (!normalized) return null;

  const districtBarrios = BARRIOS_BY_DISTRICT[district];
  const barrios = districtBarrios || Object.values(BARRIOS_BY_DISTRICT).flat();
  const candidates = barrios.flatMap(barrio => {
    const aliases = [barrio, ...(BARRIO_ALIASES[barrio] || [])];
    return aliases.map(alias => ({ barrio, normalized: normalizePlace(alias) }));
  }).filter(candidate => candidate.normalized);

  const exact = candidates.find(candidate => candidate.normalized === normalized);
  if (exact) return exact.barrio;

  const districtNormalized = normalizePlace(district);
  const matches = candidates
    .filter(candidate => containsPhrase(normalized, candidate.normalized))
    .sort((left, right) => right.normalized.length - left.normalized.length);
  const specific = matches.find(candidate => candidate.normalized !== districtNormalized);
  return specific?.barrio || matches[0]?.barrio || null;
}

function containsPhrase(value, phrase) {
  return ` ${value} `.includes(` ${phrase} `);
}

function canonicalBarrio(value) {
  const aliases = {
    "Gothic Quarter": "Barri Gotic",
    "Gràcia": "Vila de Gracia",
    "Sarrià-Sant Gervasi": "Sarrià",
    "Bordeta": "la Bordeta",
    "Salut": "la Salut",
    "Clot": "el Clot"
  };
  const text = firstText(value);
  return aliases[text] || text || null;
}

function normalizePlace(value) {
  return normalizeText(value)
    .replace(/^(?:el|la|les|els|l)\s+/, "")
    .replace(/\b(?:barrio|barri|distrito|districte)\s+(?:de\s+|del\s+)?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=_`~()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function macroAreaForSubarea(area) {
  return AREA_RULES.find(rule => rule.area === area)?.macroArea || null;
}

function singleSubareaForMacro(macroArea) {
  const matches = AREA_RULES.filter(rule => rule.macroArea === macroArea && rule.area);
  const uniqueAreas = [...new Set(matches.map(rule => rule.area))];
  return uniqueAreas.length === 1 ? uniqueAreas[0] : null;
}

async function supabaseFetch(path, { method = "GET", body, prefer } = {}) {
  const { supabaseUrl, supabaseKey } = getEnv();
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase not configured");

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const response = await fetch(`${supabaseUrl}${normalizedPath}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = await readResponseJson(response, "Supabase");
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Supabase error: ${response.status}`);
  }
  return data;
}

async function saveToSupabase({ parsed, url, images, title }) {
  const source = getSourceFromUrl(url);
  if (source) parsed.source = source;
  const row = buildSupabaseRow({ parsed, url, images, title, source });
  const coordinates = await resolveCoordinates(row);
  if (coordinates) Object.assign(row, coordinates);
  Object.assign(parsed, {
    ...(source ? { source } : {}),
    macro_area: row.macro_area,
    area: row.area,
    area_parsed: row.area_parsed,
    district: row.district,
    barrio: row.barrio,
    price_month: row.price_month,
    size_m2: row.size_m2,
    price_m2: row.price_m2,
    single_bedrooms: row.single_bedrooms,
    double_bedrooms: row.double_bedrooms,
    latitude: row.latitude,
    longitude: row.longitude,
    coordinate_source: row.coordinate_source,
    coordinate_accuracy: row.coordinate_accuracy
  });
  const result = await insertSupabaseRow(row);
  return Array.isArray(result) ? result[0] : result;
}

async function insertSupabaseRow(row) {
  const cleaned = { ...row };
  const removedColumns = [];
  const maxAttempts = Object.keys(cleaned).length + 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await supabaseFetch("/rest/v1/Properties", {
        method: "POST",
        body: cleaned,
        prefer: "return=representation"
      });
    } catch (error) {
      const missingColumn = extractMissingColumn(error.message);
      if (!missingColumn || !(missingColumn in cleaned)) throw error;
      if (REQUIRED_LOCATION_COLUMNS.has(missingColumn)) {
        throw new Error(`Supabase cannot save required location column '${missingColumn}': ${error.message}`);
      }
      delete cleaned[missingColumn];
      removedColumns.push(missingColumn);
      console.warn(`Removed unsupported Supabase column: ${missingColumn}`);
    }
  }

  throw new Error(`Supabase insert failed after removing unsupported columns: ${removedColumns.join(", ")}`);
}

function extractMissingColumn(message) {
  return (
    message.match(/'([^']+)' column/)?.[1] ||
    message.match(/column ['"]([^'"]+)['"]/)?.[1] ||
    message.match(/Could not find the ['"]([^'"]+)['"] column/)?.[1] ||
    null
  );
}

async function checkUrlInSupabase(url) {
  if (!url) return null;
  const encoded = encodeURIComponent(url);
  const result = await supabaseFetch(`/rest/v1/Properties?url=eq.${encoded}&select=id,name,url`);
  return Array.isArray(result) && result.length > 0 ? result[0] : null;
}

async function updateImagesByUrl(url, images) {
  const encoded = encodeURIComponent(url);
  const result = await supabaseFetch(`/rest/v1/Properties?url=eq.${encoded}`, {
    method: "PATCH",
    body: { images },
    prefer: "return=representation"
  });
  return Array.isArray(result) ? result : [];
}

module.exports = {
  buildSupabaseRow,
  callClaude,
  checkUrlInSupabase,
  coordinateMean,
  getEnv,
  normalizeDatabaseLocation,
  normalizeLocation,
  readJson,
  requirePost,
  resolveCoordinates,
  sendError,
  saveToSupabase,
  sendJson,
  supabaseFetch,
  updateImagesByUrl
};
