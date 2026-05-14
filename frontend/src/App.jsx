import { useState, useEffect } from "react";

const API_URL = "/api/products";

// --- Initialisation du thème ---
// Priorité : choix mémorisé dans localStorage > préférence système.
// Exécuté une seule fois au chargement, en dehors du composant pour éviter
// une exécution à chaque re-render.
const saved       = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const initialDark = saved ? saved === "dark" : prefersDark;

export default function App() {
  // --- État des données ---
  const [products,   setProducts]   = useState([]);      // liste de produits de la page courante
  const [pagination, setPagination] = useState(null);    // métadonnées de pagination (total, totalPages…)
  const [loading,    setLoading]    = useState(false);   // true pendant le fetch
  const [error,      setError]      = useState(null);    // message d'erreur si le fetch échoue
  const [selected,   setSelected]   = useState(null);    // produit affiché dans la modale (null = fermée)
  const [dark,       setDark]       = useState(initialDark);

  // --- État des filtres / pagination ---
  const [page,     setPage]     = useState(1);
  const [limit]                 = useState(12);          // fixe, non modifiable par l'utilisateur
  const [category, setCategory] = useState("");
  const [sort,     setSort]     = useState("createdAt");
  const [order,    setOrder]    = useState("desc");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // --- Applique le thème ---
  // À chaque changement de `dark`, on ajoute/retire la classe "dark" sur <body>
  // et on mémorise le choix dans localStorage pour le conserver entre les sessions.
  useEffect(() => {
    document.body.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  // --- Fetch des produits ---
  // Se déclenche à chaque changement de filtre, tri ou page.
  // URLSearchParams encode proprement les paramètres (gère les espaces, caractères spéciaux…).
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page,
          limit,
          sortBy: sort,
          sortOrder: order,
        });

        // On n'ajoute les filtres optionnels que s'ils ont une valeur
        if (category) params.set("category", category);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);

        const res = await fetch(`${API_URL}?${params}`);

        // fetch() ne rejette pas sur les erreurs HTTP (4xx, 5xx) — on doit vérifier res.ok
        if (!res.ok) throw new Error("Réponse serveur invalide");

        const json = await res.json();
        setProducts(json.data);
        setPagination(json.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        // finally s'exécute toujours, succès ou échec — garantit que le loader s'arrête
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, limit, category, sort, order, minPrice, maxPrice]);

  return (
    <div className="app">
      <div className="header">
        <h1>Catalogue produits</h1>
        <div className="filters">
          {/* Chaque filtre remet page à 1 pour ne pas se retrouver sur une page
              qui n'existe plus après le changement de filtre */}
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">Toutes catégories</option>
            <option value="shoes">Chaussures</option>
            <option value="clothing">Vêtements</option>
            <option value="accessories">Accessoires</option>
            <option value="bags">Sacs</option>
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="createdAt">Nouveautés</option>
            <option value="price">Prix</option>
            <option value="name">Nom</option>
          </select>
          <select value={order} onChange={(e) => { setOrder(e.target.value); setPage(1); }}>
            <option value="asc">Croissant</option>
            <option value="desc">Décroissant</option>
          </select>
          <input
            type="number"
            placeholder="Prix min"
            value={minPrice}
            min="0"
            onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
          />
          <input
            type="number"
            placeholder="Prix max"
            value={maxPrice}
            min="0"
            onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
          />
          <button className="theme-toggle" onClick={() => setDark(d => !d)}>
            {dark ? "☀" : "☾"}
          </button>
        </div>
      </div>

      {/* États de chargement et d'erreur */}
      {loading && <p className="loading">Chargement...</p>}
      {error   && <p className="error">Erreur : {error}</p>}

      {!loading && !error && (
        <>
          {/* Cas vide : aucun produit ne correspond aux filtres */}
          {products.length === 0 ? (
            <p className="empty">Aucun produit trouvé.</p>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <div key={product._id} className="product-card" onClick={() => setSelected(product)}>
                  <div className="card-top">
                    <span className={`badge badge-${product.category}`}>{product.category}</span>
                    <span className="card-date">
                      {new Date(product.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="card-name">{product.name}</p>
                  <div className="card-bottom">
                    <span className="card-stock">{product.stock} en stock</span>
                    <span className="card-price">{product.price} €</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination — affichée uniquement si on a les métadonnées */}
          {pagination && (
            <div className="pagination">
              {/* Début — désactivé si déjà sur la première page */}
              <button onClick={() => setPage(1)} disabled={page === 1} title="Première page">«</button>
              {/* -10 — désactivé si on est dans les 10 premières pages */}
              <button onClick={() => setPage(p => Math.max(1, p - 10))} disabled={page <= 10} title="-10 pages">−10</button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              <span className="page-info">{page} / {pagination.totalPages}</span>
              {/* hasMore évite de charger une page vide après la dernière */}
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasMore}>›</button>
              {/* +10 — désactivé si aller +10 dépasse la dernière page */}
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 10))} disabled={page + 10 > pagination.totalPages} title="+10 pages">+10</button>
              {/* Fin — désactivé si déjà sur la dernière page */}
              <button onClick={() => setPage(pagination.totalPages)} disabled={page === pagination.totalPages} title="Dernière page">»</button>
            </div>
          )}
        </>
      )}

      {/* Modale produit — affichée si un produit est sélectionné */}
      {selected && (
        <div
          className="modal-overlay"
          onClick={() => setSelected(null)} // clic sur le fond = fermeture
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()} // empêche la fermeture au clic à l'intérieur
          >
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <span className={`badge badge-${selected.category}`} style={{ alignSelf: "flex-start" }}>
              {selected.category}
            </span>
            <h2 className="modal-name">{selected.name}</h2>
            <p className="modal-description">{selected.description}</p>
            <div className="modal-footer">
              <span className="modal-stock">{selected.stock} en stock</span>
              <span className="modal-date">
                {new Date(selected.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="modal-price">{selected.price} €</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}