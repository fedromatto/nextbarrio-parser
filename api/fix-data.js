const { requirePost, sendJson, supabaseFetch } = require("./_lib");

module.exports = async function handler(req, res) {
  if (!requirePost(req, res)) return;

  const badValues = ["long term", "long_Term", "Long Term", "Long_Term"];
  const result = { fixed_types: 0, fixed_dates: 0, errors: [] };

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

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { error: error.message, ...result });
  }
};
