const { getEnv, readJson, requirePost, sendJson } = require("./_lib");

module.exports = async function handler(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const body = await readJson(req);
    const env = getEnv();

    if (body.action === "save") {
      return sendJson(res, 400, {
        success: false,
        error: "Online settings are managed with hosting environment variables."
      });
    }

    sendJson(res, 200, {
      configured: Boolean(env.claudeApiKey),
      supabase_url: env.supabaseUrl ? env.supabaseUrl : "",
      supabase_configured: Boolean(env.supabaseUrl && env.supabaseKey)
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
};
