const { Router } = require("express");
const router = Router();

/**
 * GET /api/products
 *
 * Retourne une liste paginée de produits avec filtres et tris.
 *
 * Query params :
 *   page       {number}  Page courante (défaut : 1, min : 1)
 *   limit      {number}  Produits par page (défaut : 20, max : 100)
 *   category   {string}  Filtre par catégorie : "shoes" | "clothing" | "accessories" | "bags"
 *   minPrice   {number}  Prix minimum (inclus)
 *   maxPrice   {number}  Prix maximum (inclus)
 *   sortBy     {string}  Champ de tri : "price" | "name" | "createdAt" (défaut : "createdAt")
 *   sortOrder  {string}  Ordre de tri : "asc" | "desc" (défaut : "desc")
 *
 * Réponse :
 *   {
 *     data: Product[],
 *     pagination: {
 *       page, limit, total, totalPages, hasMore
 *     }
 *   }
 */
router.get("/", async (req, res) => {
  try {
    const db = req.app.locals.db;

    // --- Pagination ---
    // parseInt peut retourner NaN si le param est absent ou invalide (ex: "abc").
    // On remet les valeurs par défaut plutôt que de planter.
    let page  = parseInt(req.query.page,  10);
    let limit = parseInt(req.query.limit, 10);

    if (!Number.isFinite(page)  || page  < 1) page  = 1;
    if (!Number.isFinite(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // garde-fou pour éviter les requêtes abusives

    // --- Filtre ---
    // On construit l'objet filter dynamiquement selon les params reçus.
    // Un filter vide {} retourne tous les documents.
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Fourchette de prix : on n'ajoute $gte/$lte que si les valeurs sont des nombres valides
    const min = parseFloat(req.query.minPrice);
    const max = parseFloat(req.query.maxPrice);
    if (Number.isFinite(min)) filter.price = { ...filter.price, $gte: min };
    if (Number.isFinite(max)) filter.price = { ...filter.price, $lte: max };

    // --- Tri ---
    // Whitelist obligatoire : on ne passe jamais req.query.sortBy directement
    // à MongoDB pour éviter les injections sur des champs arbitraires.
    const ALLOWED = ["price", "name", "createdAt"];
    const sortBy    = ALLOWED.includes(req.query.sortBy) ? req.query.sortBy : "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1; // MongoDB attend 1 ou -1

    // --- Requête ---
    // skip() = nombre de documents à sauter pour atteindre la bonne page.
    // Ex: page 3, limit 20 → skip 40.
    const skip = (page - 1) * limit;

    // On lance find() et countDocuments() en parallèle pour éviter deux allers retours séquentiels.
    // countDocuments() applique le même filter pour retourner le total filtré, pas le total global.
    const [items, total] = await Promise.all([
      db.collection("products").find(filter).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).toArray(),
      db.collection("products").countDocuments(filter),
    ]);

    // --- Réponse ---
    res.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),   // arrondi supérieur : 51 items / 20 = 3 pages
        hasMore: skip + items.length < total,   // true s'il reste des items après cette page
      },
    });
  } catch (err) {
    // On ne renvoie pas le détail de l'erreur au client pour ne pas exposer l'infra
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;