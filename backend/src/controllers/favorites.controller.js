import { query } from "../db/index.js";

export const listUserFavorites = async (req, res) => {
  try {
    const result = await query(
      `SELECT business_setup_id
       FROM user_favorites
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id],
    );
    return res.json({
      success: true,
      message: "Favorites loaded.",
      data: {
        businessSetupIds: result.rows.map((row) => String(row.business_setup_id)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load favorites.",
      data: { error: error.message },
    });
  }
};

export const putUserFavorites = async (req, res) => {
  try {
    const ids = Array.isArray(req.body?.businessSetupIds)
      ? req.body.businessSetupIds.map((id) => String(id)).filter(Boolean)
      : [];

    await query(`DELETE FROM user_favorites WHERE user_id = $1`, [req.user.id]);

    if (ids.length) {
      const values = [];
      const params = [req.user.id];
      ids.forEach((id, index) => {
        params.push(id);
        values.push(`($1, $${index + 2})`);
      });
      await query(
        `INSERT INTO user_favorites (user_id, business_setup_id)
         VALUES ${values.join(", ")}
         ON CONFLICT DO NOTHING`,
        params,
      );
    }

    return res.json({
      success: true,
      message: "Favorites saved.",
      data: { businessSetupIds: ids },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save favorites.",
      data: { error: error.message },
    });
  }
};

export const toggleUserFavorite = async (req, res) => {
  try {
    const businessSetupId = String(req.params.businessSetupId || "").trim();
    if (!businessSetupId) {
      return res.status(400).json({
        success: false,
        message: "businessSetupId is required.",
        data: null,
      });
    }

    const existing = await query(
      `SELECT 1 FROM user_favorites WHERE user_id = $1 AND business_setup_id = $2`,
      [req.user.id, businessSetupId],
    );

    let favorited = false;
    if (existing.rowCount > 0) {
      await query(
        `DELETE FROM user_favorites WHERE user_id = $1 AND business_setup_id = $2`,
        [req.user.id, businessSetupId],
      );
      favorited = false;
    } else {
      await query(
        `INSERT INTO user_favorites (user_id, business_setup_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [req.user.id, businessSetupId],
      );
      favorited = true;
    }

    const all = await query(
      `SELECT business_setup_id FROM user_favorites WHERE user_id = $1`,
      [req.user.id],
    );

    return res.json({
      success: true,
      message: favorited ? "Added to favorites." : "Removed from favorites.",
      data: {
        businessSetupId,
        favorited,
        businessSetupIds: all.rows.map((row) => String(row.business_setup_id)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to toggle favorite.",
      data: { error: error.message },
    });
  }
};
