# Livre compagnon — application web MERN

Application web qui prolonge un livre pour enfants : le lecteur scanne un **QR code**, répond à la **question du jour**, découvre l'explication et suit sa **progression**. Un espace d'**administration** permet de gérer le contenu.

> Parcours : livre → QR code → application web → question du jour → réponse → résultat + explication → progression.

## Fonctionnalités

**Lecteur** : accueil et présentation du livre sans compte · question du jour · correction par le serveur · explication · inscription / connexion / déconnexion · espace personnel · progression · historique paginé · profil (prénom, mot de passe) · suppression du compte.
**Administrateur** : tableau de bord (chiffres issus de la base) · CRUD des questions · publier / dépublier / planifier · liste des utilisateurs · réponses filtrables (lecteur, question, dates, résultat).

## Stack

- **Frontend** (`client/`) : React 19, Vite, React Router, Tailwind CSS 4, Axios, React Hook Form, Zod, Lucide.
- **Backend** (`server/`) : Node.js (≥ 20), Express 5, Mongoose, JWT (cookie HttpOnly), bcryptjs, Zod, Helmet, CORS, express-rate-limit, Morgan.
- **Données** : MongoDB (local en développement, Atlas en production).

## Architecture

```
livre-compagnon/
├── client/   React (pages, components, context, services, hooks, utils)
├── server/   Express (config, models, controllers, routes, middleware, services, validators, utils, scripts, tests)
├── livre-compagnon.postman_collection.json
└── README.md
```

Collections : `users`, `books`, `questions`, `answers` (pas de collection `dailyQuestions` : la date de publication de la question suffit).

## Prérequis

Node.js ≥ 20, npm, MongoDB en local (`mongod` démarré, `mongosh` pour vérifier).

## Installation

```bash
npm run install:all          # ou : cd server && npm install ; cd ../client && npm install
```

Variables d'environnement (copier les exemples) :

```bash
# macOS / Linux
cp server/.env.example server/.env && cp client/.env.example client/.env
# Windows (PowerShell)
Copy-Item server/.env.example server/.env ; Copy-Item client/.env.example client/.env
```

Générer un secret JWT et le placer dans `server/.env` :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable (server) | Rôle |
|---|---|
| `MONGODB_URI` | URI MongoDB (`mongodb://127.0.0.1:27017/livre_compagnon` en local) |
| `JWT_SECRET` | secret de signature, **≥ 32 caractères**, jamais dans Git |
| `JWT_EXPIRES_IN` | durée de session (ex. `1d`) |
| `CLIENT_URL` | origine exacte du frontend (CORS + contrôle de l'en-tête `Origin`) |
| `APP_TIMEZONE` | fuseau de référence de la question du jour (défaut `Africa/Dakar`) |
| `COOKIE_SAMESITE` | `lax` (défaut) ou `none` si frontend et API sont sur des domaines différents |
| `AUTH_RATE_LIMIT` | tentatives d'authentification / 15 min / IP (défaut 10) |

Frontend : `VITE_API_URL` (jamais de secret : visible dans le navigateur).

## Initialiser la base et le premier administrateur

```bash
npm run seed                 # livre + questions de démonstration (idempotent, refusé en production)
```

Premier administrateur (mot de passe fourni explicitement, jamais codé en dur) :

```bash
# macOS / Linux
ADMIN_EMAIL=admin@exemple.com ADMIN_FIRST_NAME=Admin ADMIN_PASSWORD='MotDePasse123' npm run create-admin
# Windows (PowerShell)
$env:ADMIN_EMAIL="admin@exemple.com"; $env:ADMIN_PASSWORD="MotDePasse123"; npm run create-admin
```

L'inscription publique ne peut jamais produire un compte administrateur.

## Lancer en développement

```bash
npm run dev:server           # API : http://localhost:5000/api  (vérifier /api/health)
npm run dev:client           # Web : http://localhost:5173
```

Administration : `http://localhost:5173/admin/connexion`.

## Tests

```bash
npm test
```

- `server/tests/smoke.test.js` et `dates.test.js` : sans base de données.
- `server/tests/api.test.js` : intégration, **nécessite MongoDB local**. Utilise la base `livre_compagnon_test` (ou `MONGODB_URI_TEST`), la **vide au démarrage** et refuse de tourner si le nom ne se termine pas par `_test`. Sans MongoDB, ces tests sont ignorés (skip).
- `client` : `npm run test:smoke` (rendu serveur des pages + schémas de validation, sans navigateur).

## Build de production

```bash
npm run build                # client/dist
```

## QR code

Le QR code doit encoder une URL **HTTPS stable**, par exemple `https://ton-domaine.com/livre/livre-demo` (slug du livre).

```bash
cd server && npm run qr -- https://ton-domaine.com/livre/livre-demo qr-livre.png
```

Génère un PNG haute résolution et un SVG. Le générer une seule fois : le contenu ne change pas.

## Déploiement (à effectuer et tester par toi)

1. **MongoDB Atlas** : créer un cluster, un utilisateur de base, autoriser l'IP du backend, copier l'URI.
2. **Backend (Render ou équivalent Node)** : racine `server`, build `npm install`, démarrage `npm start`. Variables : `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL` (URL HTTPS du frontend), `APP_TIMEZONE`. Vérifier `GET /api/health`. Créer l'administrateur depuis un shell relié à la base de production avec `npm run create-admin`. Ne pas lancer `seed` en production.
3. **Frontend (Vercel ou Netlify)** : racine `client`, build `npm run build`, dossier `dist`.
   - **Option recommandée (même site, cookies simples)** : dans `client/vercel.json`, remplacer l'URL du `rewrite` `/api` par celle du backend, et définir `VITE_API_URL=/api`. `COOKIE_SAMESITE=lax`.
   - Option domaines séparés : `VITE_API_URL=https://api.exemple.com/api`, `COOKIE_SAMESITE=none` (HTTPS obligatoire) et `CLIENT_URL` exact. Certains navigateurs bloquent les cookies tiers : le rewrite est plus fiable.
   - Netlify : `client/public/_redirects` gère les routes SPA ; ajouter un proxy `/api` équivalent.
4. Vérifier les limites et tarifs des offres gratuites au moment du déploiement (mise en veille du backend, etc.).
5. Contrôle final : parcours lecteur (inscription → question → résultat → progression → historique) et parcours administrateur.

## API REST

Préfixe `/api`. Réponses `{ success, data, message }` ou `{ success: false, message, errors }`.

| Domaine | Routes |
|---|---|
| Santé | `GET /health` |
| Auth | `POST /auth/register` · `POST /auth/login` · `POST /auth/logout` · `GET /auth/me` · `PATCH /auth/profile` · `PUT /auth/password` · `DELETE /auth/account` |
| Livres | `GET /books` · `GET /books/:id` (id ou slug) · `POST/PUT/DELETE` (admin) |
| Questions | `GET /questions` · `GET /questions/today` · `GET /questions/:id` · `POST/PUT/DELETE` (admin) |
| Réponses | `POST /answers` · `GET /answers/history` · `GET /answers/progress` · `GET /answers/:id` |
| Admin | `GET /admin/dashboard` · `GET /admin/users` · `GET /admin/answers` |

Une collection Postman est fournie (`livre-compagnon.postman_collection.json`) ; Postman conserve le cookie de session après la connexion.

## Règles métier principales

- **Correction côté serveur** ; `correctAnswer` et l'explication ne sont renvoyés qu'**après** l'enregistrement de la tentative. Le client ne peut pas imposer `isCorrect` (champ refusé).
- **Question du jour** : la question publiée datée d'aujourd'hui (fuseau `APP_TIMEZONE`, pas l'horloge du navigateur). Repli : la dernière question publiée dont la date est passée (`isFallback: true`). Même date et même livre → même question pour tous.
- Une question est **disponible** si elle est publiée et si sa date est atteinte. Publiée sans date → date du jour.
- **Tentative unique** par utilisateur et par question (index unique + 409).
- **Taux de réussite** = bonnes réponses / réponses données (0 % sans réponse). **Progression** = réponses données / questions disponibles (distinct du taux de réussite). **Jours actifs** = jours distincts (fuseau de référence) avec au moins une réponse.
- **Question déjà répondue** : propositions, bonne réponse et livre verrouillés (409) ; suppression refusée → archiver. Explication, texte, statut et date restent modifiables.
- **Suppression de compte** : le compte et toutes ses réponses sont supprimés. Un administrateur ne peut pas se supprimer via cette route.
- Un lecteur ne voit jamais les réponses d'un autre ; un identifiant étranger renvoie 404.
- L'administration affiche les prénoms (pas les emails) dans les réponses ; les emails n'apparaissent que dans la liste des utilisateurs.

## Sécurité

Mots de passe hachés (bcrypt, 12 tours) · session par cookie `HttpOnly` (`Secure` en production) · rôle relu en base à chaque requête · contrôle de l'en-tête `Origin` sur les requêtes qui modifient des données + `SameSite` · Helmet · CORS explicite · limitation des tentatives d'authentification · validation Zod stricte (champs inconnus refusés, pas de filtre MongoDB venant du client) · corps JSON limité à 10 ko · erreurs sans pile en production.

## Public enfant et données

Données minimales (prénom, email, mot de passe haché, réponses). Pas de date de naissance, pas d'emails marketing dans ce MVP. La page `/confidentialite` est un **texte modèle à compléter et à faire valider** (éditeur, contact, durée de conservation, règles applicables aux mineurs dans le pays de déploiement).

## Limites connues du MVP

- Questions à choix unique uniquement (la structure prévoit `type`).
- Un seul livre mis en avant sur l'accueil (le premier livre publié) ; pas d'interface d'administration des livres (API disponible).
- Pas de réinitialisation de mot de passe par email, pas de vérification d'email.
- Le jeton JWT n'est pas révocable avant expiration (déconnexion = suppression du cookie).
- Filtres de l'écran « Réponses » : 50 premiers lecteurs et questions dans les listes déroulantes.
- Pas de tests de bout en bout dans un navigateur.
