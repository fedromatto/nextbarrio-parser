const { normalizeDatabaseLocation, requirePost, sendJson, supabaseFetch } = require("./_lib");

module.exports = async function handler(req, res) {
  if (!requirePost(req, res)) return;

  const badValues = ["long term", "long_Term", "Long Term", "Long_Term"];
  const result = { fixed_types: 0, fixed_dates: 0, fixed_locations: 0, errors: [] };

  try {
    for (const badValue of badValues) {
      try {
        const encoded = encodeURIComponent(badValue);
        const updated = await supabaseFetch(`/rest/v1/Properties?property_type=eq.${encoded}`, {
          method: "PATCH",
          body: { property_type: "long_term" },
          prefer: "return=representation"
        });
        result.fixed_types += Array.isArray(updated) ? updated.length : 0;
      } catch (error) {
        result.errors.push(`Type fix '${badValue}': ${error.message}`);
      }
    }

    try {
      const rows = await supabaseFetch("/rest/v1/Properties?parsed_at=is.null&select=id,created_at");
      for (const row of rows || []) {
        if (!row.created_at) continue;
        try {
          const updated = await supabaseFetch(`/rest/v1/Properties?id=eq.${encodeURIComponent(row.id)}`, {
            method: "PATCH",
            body: { parsed_at: row.created_at },
            prefer: "return=representation"
          });
          result.fixed_dates += Array.isArray(updated) ? updated.length : 0;
        } catch (error) {
          result.errors.push(`Date fix for id ${row.id}: ${error.message}`);
        }
      }
    } catch (error) {
      result.errors.push(`Fetch rows error: ${error.message}`);
    }

    try {
      const rows = await supabaseFetch(
        "/rest/v1/Properties?select=id,macro_area,area,area_parsed&or=(district.is.null,barrio.is.null)&limit=5000"
      );
      const groups = new Map();

      for (const row of rows || []) {
        const location = normalizeDatabaseLocation({
          macroArea: row.macro_area,
          area: row.area,
          areaParsed: row.area_parsed
        });
        const key = JSON.stringify(location);
        const group = groups.get(key) || { location, ids: [] };
        group.ids.push(row.id);
        groups.set(key, group);
      }

      const updates = await Promise.all([...groups.values()].map(group => {
        const ids = group.ids.map(id => String(id).replace(/[^a-f0-9-]/gi, "")).join(",");
        return supabaseFetch(`/rest/v1/Properties?id=in.(${encodeURIComponent(ids)})`, {
          method: "PATCH",
          body: group.location,
          prefer: "return=representation"
        });
      }));
      result.fixed_locations = updates.reduce(
        (total, updated) => total + (Array.isArray(updated) ? updated.length : 0),
        0
      );
    } catch (error) {
      result.errors.push(`Location fix: ${error.message}`);
    }

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { error: error.message, ...result });
  }
};
