const { Router } = require("express");
const router = Router();

router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db;

    let page  = parseInt(req.query.page,  10);
    let limit = parseInt(req.query.limit, 10);

    if (!Number.isFinite(page)  || page  < 1) page  = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }
    const ALLOWED = ["price", "name", "createdAt"];
    const sortBy    = ALLOWED.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.collection("products").find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).toArray(),
      db.collection("products").countDocuments(filter),
    ]);
    res.json({
        data: items,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + items.length < total,
        },
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;