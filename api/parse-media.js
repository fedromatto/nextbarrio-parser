const { callClaude, getEnv, readJson, requirePost, saveToSupabase, sendJson } = require("./_lib");

module.exports = async function handler(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const body = await readJson(req);
    const description = (body.description || "").trim();
    if (!description) return sendJson(res, 400, { error: "Please add a description to parse" });

    const env = getEnv();
    const parsed = await callClaude({
      apiKey: env.claudeApiKey,
      listingText: description,
      listingUrl: body.url || ""
    });

    let supabaseResult = null;
    let supabaseError = null;
    try {
      supabaseResult = await saveToSupabase({
        parsed,
        url: body.url || "",
        images: body.images || [],
        title: ""
      });
    } catch (error) {
      supabaseError = error.message;
      console.error("Supabase save failed:", error);
    }

    sendJson(res, 200, {
      parsed,
      images_count: Array.isArray(body.images) ? body.images.length : 0,
      supabase_id: supabaseResult?.id || null,
      saved_to_supabase: Boolean(supabaseResult),
      supabase_error: supabaseError
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
