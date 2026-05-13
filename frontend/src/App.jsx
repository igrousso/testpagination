import { useState, useEffect } from "react";

const API_URL = "/api/products";

export default function App() {
  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [selected,   setSelected]   = useState(null);

  const [page,     setPage]     = useState(1);
  const [limit]                 = useState(10);
  const [category, setCategory] = useState("");
  const [sort,     setSort]     = useState("createdAt");
  const [order,    setOrder]    = useState("desc");

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
        if (category) params.set("category", category);

        const res = await fetch(`${API_URL}?${params}`);
        if (!res.ok) throw new Error("Réponse serveur invalide");

        const json = await res.json();
        setProducts(json.data);
        setPagination(json.pagination);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, limit, category, sort, order]);

  return (
    <div className="app">
      <div className="header">
        <h1>Catalogue produits</h1>
        <div className="filters">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">Toutes catégories</option>
            <option value="shoes">Chaussures</option>
            <option value="clothing">Vêtements</option>
            <option value="accessories">Accessoires</option>
            <option value="bags">Sacs</option>
          </select>
          <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            <option value="createdAt">Date</option>
            <option value="price">Prix</option>
            <option value="name">Nom</option>
          </select>
          <select value={order} onChange={(e) => { setOrder(e.target.value); setPage(1); }}>
            <option value="asc">Croissant</option>
            <option value="desc">Décroissant</option>
          </select>
        </div>
      </div>

      {loading && <p className="loading">Chargement...</p>}
      {error   && <p className="error">Erreur : {error}</p>}

      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <p className="empty">Aucun produit trouvé.</p>
          ) : (
            <ul className="product-list">
              {products.map((product) => (
                <li key={product._id} className="product-row" onClick={() => setSelected(product)}>
                  <div className="product-left">
                    <span className={`badge badge-${product.category}`}>
                      {product.category}
                    </span>
                    <span className="product-name">{product.name}</span>
                  </div>
                  <div className="product-right">
                    <span className="product-stock">{product.stock} en stock</span>
                    <span className="product-price">{product.price} €</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {pagination && (
            <div className="pagination">
              <button onClick={() => setPage(1)} disabled={page === 1} title="Première page">
                «
              </button>
              <button onClick={() => setPage(p => Math.max(1, p - 10))} disabled={page <= 10} title="-10 pages">
                −10
              </button>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                ‹
              </button>
              <span className="page-info">{page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasMore}>
                ›
              </button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 10))} disabled={page + 10 > pagination.totalPages} title="+10 pages">
                +10
              </button>
              <button onClick={() => setPage(pagination.totalPages)} disabled={page === pagination.totalPages} title="Dernière page">
                »
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            <span className={`badge badge-${selected.category}`}>{selected.category}</span>
            <h2 className="modal-name">{selected.name}</h2>
            <p className="modal-description">{selected.description}</p>
            <div className="modal-footer">
              <span className="modal-stock">{selected.stock} en stock</span>
              <span className="modal-price">{selected.price} €</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}