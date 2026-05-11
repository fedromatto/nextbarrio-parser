const { getEnv, sendJson } = require("./_lib");

module.exports = async function handler(req, res) {
  const env = getEnv();

  sendJson(res, 200, {
    claude_configured: Boolean(env.claudeApiKey),
    supabase_configured: Boolean(env.supabaseUrl && env.supabaseKey),
    supabase_url_host: env.supabaseUrl ? new URL(env.supabaseUrl).host : null,
    supabase_url_has_rest_path: env.supabaseUrl.toLowerCase().includes("/rest/v1")
  });
};
