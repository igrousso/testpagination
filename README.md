# Catalogue produits — Test technique

Plateforme e-commerce avec catalogue paginé côté serveur, filtres, tris et mode sombre.

---

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Base de données | MongoDB (sans Mongoose) |
| Orchestration | Docker Compose |

---

## Lancer le projet

### Prérequis

- Docker
- Make

### Démarrer

```bash
make up
```

- Frontend : http://localhost:5173
- API : http://localhost:3001/api/products

### Autres commandes

```bash
make down      # arrête les conteneurs
make restart   # redémarre avec rebuild
make logs      # affiche les logs en temps réel
make prune     # supprime tous les conteneurs et images
```

---

## API

### `GET /api/products`

Retourne une liste paginée de produits.

#### Paramètres

| Paramètre | Type | Défaut | Description |
|-----------|------|--------|-------------|
| `page` | number | `1` | Page courante (min : 1) |
| `limit` | number | `20` | Produits par page (max : 100) |
| `category` | string | — | Filtre par catégorie : `shoes` \| `clothing` \| `accessories` \| `bags` |
| `minPrice` | number | — | Prix minimum (inclus) |
| `maxPrice` | number | — | Prix maximum (inclus) |
| `sortBy` | string | `createdAt` | Champ de tri : `price` \| `name` \| `createdAt` |
| `sortOrder` | string | `desc` | Ordre : `asc` \| `desc` |

#### Exemple de requête

```
GET /api/products?page=1&limit=12&category=shoes&sortBy=price&sortOrder=asc
```

#### Exemple de réponse

```json
{
  "data": [
    {
      "_id": "64a1f...",
      "name": "Veltra — Classic Sneakers (Bold)",
      "description": "Un(e) classic sneakers (cuir pleine fleur). Idéal pour la ville.",
      "price": 89.99,
      "category": "shoes",
      "stock": 42,
      "createdAt": "2026-05-13T15:26:27.957Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 1250,
    "totalPages": 105,
    "hasMore": true
  }
}
```

#### Gestion des erreurs

| Cas | Comportement |
|-----|-------------|
| `page` invalide (`abc`, `-1`) | Remplacé par `1` |
| `limit` invalide | Remplacé par `20` |
| `limit` > 100 | Plafonné à `100` |
| `sortBy` non autorisé | Remplacé par `createdAt` |
| Erreur serveur | `500` + `{ "error": "Erreur serveur" }` |

---

## Choix d'implémentation

### Pagination côté serveur

Toute la pagination se fait via `.skip()` et `.limit()` dans MongoDB — le serveur ne renvoie jamais plus que `limit` documents par requête, quelle que soit la taille du catalogue.

### `Promise.all` sur les deux requêtes

Le total (`countDocuments`) et les items (`find`) sont récupérés en parallèle pour éviter deux allers retours séquentiels vers MongoDB.

### Whitelist sur `sortBy`

Le paramètre `sortBy` est validé contre une liste de champs autorisés avant d'être passé à MongoDB, pour éviter le tri sur des champs arbitraires ou sensibles.

### Filtre de prix composable

Les filtres `minPrice` et `maxPrice` sont indépendants — on peut en utiliser un seul ou les deux ensemble. Le filtre `price` est construit dynamiquement avec `$gte` et `$lte` uniquement si les valeurs sont des nombres valides.

### Thème sombre

Le mode sombre suit la préférence système (`prefers-color-scheme`) par défaut. Si l'utilisateur bascule manuellement via le bouton, le choix est mémorisé dans `localStorage` et prioritaire sur la préférence système.