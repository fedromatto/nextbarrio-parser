const { callClaude, getEnv, readJson, requirePost, saveToSupabase, sendJson } = require("./_lib");

module.exports = async function handler(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const body = await readJson(req);
    const text = (body.text || "").trim();
    if (!text) return sendJson(res, 400, { error: "No listing text provided" });

    const env = getEnv();
    const parsed = await callClaude({
      apiKey: env.claudeApiKey,
      listingText: text,
      listingUrl: body.url || ""
    });

    let supabaseResult = null;
    let supabaseError = null;
    try {
      supabaseResult = await saveToSupabase({
        parsed,
        url: body.url || "",
        images: body.images || [],
        title: body.title || ""
      });
    } catch (error) {
      supabaseError = error.message;
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
