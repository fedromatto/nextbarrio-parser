const { checkUrlInSupabase, readJson, requirePost, sendJson } = require("./_lib");

module.exports = async function handler(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const body = await readJson(req);
    const url = (body.url || "").trim();
    const existing = await checkUrlInSupabase(url);
    sendJson(res, 200, {
      is_duplicate: Boolean(existing),
      existing
    });
  } catch (error) {
    sendJson(res, 200, {
      is_duplicate: false,
      existing: null,
      check_error: error.message
    });
  }
};
