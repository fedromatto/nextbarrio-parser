const { readJson, requirePost, sendJson, updateImagesByUrl } = require("./_lib");

module.exports = async function handler(req, res) {
  if (!requirePost(req, res)) return;

  try {
    const body = await readJson(req);
    const url = (body.url || "").trim();
    const images = body.images || [];

    if (!url) return sendJson(res, 400, { error: "No URL provided" });
    if (!Array.isArray(images) || images.length === 0) return sendJson(res, 400, { error: "No images provided" });

    const updated = await updateImagesByUrl(url, images);
    sendJson(res, 200, {
      updated_supabase: updated.length > 0,
      images_count: images.length,
      error: updated.length > 0 ? null : "No property found with that URL"
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
};
