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
  return {
    claudeApiKey: process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY || "",
    supabaseUrl: normalizeSupabaseUrl(process.env.SUPABASE_URL || ""),
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || ""
  };
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
  "property_type": "temporal" or "long_term",
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

Listing URL: ${listingUrl || "Not provided"}

Listing text:
${listingText}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || `Claude API error: ${response.status}`);
  }

  const responseText = result.content?.map(part => part.text || "").join("\n") || "";
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Could not parse Claude response as JSON");
  return JSON.parse(jsonMatch[0]);
}

function buildSupabaseRow({ parsed, url, images = [], title = "", source = null }) {
  const priceMonth = parsed.price_month ?? null;
  const sizeM2 = parsed.size_m2 ?? null;
  const calculatedPriceM2 = priceMonth && sizeM2 ? Number((priceMonth / sizeM2).toFixed(2)) : parsed.price_m2 ?? null;
  const location = normalizeLocation(parsed);

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
    sub_area: location.areaParsed,
    availability: parsed.availability ?? null,
    available_from: parsed.availability_date ?? null,
    availability_date: parsed.availability_date ?? null,
    price_month: priceMonth,
    size_m2: sizeM2,
    price_m2: calculatedPriceM2,
    single_rooms: parsed.single_bedrooms ?? null,
    single_bedrooms: parsed.single_bedrooms ?? null,
    double_rooms: parsed.double_bedrooms ?? null,
    double_bedrooms: parsed.double_bedrooms ?? null,
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

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || data?.error || `Supabase error: ${response.status}`);
  }
  return data;
}

async function saveToSupabase({ parsed, url, images, title }) {
  const source = getSourceFromUrl(url);
  if (source) parsed.source = source;
  const row = buildSupabaseRow({ parsed, url, images, title, source });
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
  callClaude,
  checkUrlInSupabase,
  getEnv,
  normalizeLocation,
  readJson,
  requirePost,
  saveToSupabase,
  sendJson,
  supabaseFetch,
  updateImagesByUrl
};
