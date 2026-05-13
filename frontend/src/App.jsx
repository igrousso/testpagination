import { useState, useEffect } from "react";

const API_URL = "/api/products";

export default function App() {
  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

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
            <table className="product-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Catégorie</th>
                  <th>Prix</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>
                      <span className={`badge badge-${product.category}`}>
                        {product.category}
                      </span>
                    </td>
                    <td className="price">{product.price} €</td>
                    <td className="stock">{product.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pagination && (
            <div className="pagination">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                Précédent
              </button>
              <span className="page-info">{page} / {pagination.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={!pagination.hasMore}>
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}