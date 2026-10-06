# Vanguard Outdoor

Boutique en ligne premium (outdoor & lifestyle) qui centralise les catalogues **Reactive Outdoor** et **Kilos Gear**, réservée au marché européen. Elle est disponible en EN, FR et DE.

| Couche | Techno | Hébergement |
|---|---|---|
| Frontend | Next.js 15 (App Router, React 18) + TailwindCSS, TypeScript | Vercel (région `cdg1`) |
| Backend | Node.js 22 + Express 5, Zod, JWT | Railway (Dockerfile) |
| Base de données | PostgreSQL 16 (migrations SQL versionnées) | Railway Postgres |
| Paiement | **Adyen** (cartes, CB, SEPA, iDEAL, Bancontact, Klarna, Apple/Google Pay) + **Payoneer Checkout** (cartes) | — |

```
vanguard-outdoor/
├── apps/api/          Express API (auth, catalogue, checkout, paiements, admin, webhooks)
│   ├── src/db/        migrations SQL, seed (catalogue de départ), pool pg
│   ├── src/payments/  adyen.js · payoneer.js · mock.js (dev)
│   ├── src/scripts/   import-shopify.js (synchro catalogues), create-admin.js
│   └── test/          tests d'intégration (node:test + supertest)
├── apps/web/          Storefront Next.js 15 (/en /fr /de) + interface admin (/xx/admin)
├── scripts/           setup.sh · dev.sh · deploy.sh
└── docker-compose.yml Postgres + API en local
```

## 1. Installation locale (une commande)

Il faut Node.js ≥ 20, ainsi que PostgreSQL 16 **ou** Docker.

```bash
npm run setup     # CLIs Vercel/Railway, dépendances, .env, base, migrations, catalogue de départ
npm run dev       # API :4000 + boutique :3000
```

- Boutique : http://localhost:3000 (redirige automatiquement vers `/fr`, `/de` ou `/en` selon le navigateur)
- Admin : http://localhost:3000/fr/admin, avec le compte `admin@vanguard.local` / `Admin1234!`. Ce compte n'existe qu'en développement.
- En local, le prestataire `mock` permet de tester tout le tunnel d'achat sans clés PSP (boutons « Simuler un succès / échec »).

Autres commandes : `npm test` (tests API), `npm run build`, `npm run db:migrate`, `npm run db:seed`, `npm run catalog:import`.

## 2. Déploiement production (une commande)

```bash
export ADMIN_EMAIL="vous@domaine.eu" ADMIN_PASSWORD="un-mot-de-passe-solide"
export ADYEN_ENVIRONMENT=test ADYEN_API_KEY=... ADYEN_MERCHANT_ACCOUNT=... ADYEN_CLIENT_KEY=... ADYEN_HMAC_KEY=...
# optionnel : PAYONEER_MERCHANT_CODE=... PAYONEER_API_TOKEN=... PAYONEER_BASE_URL=https://api.live.oscato.com
# optionnel : RAILWAY_TOKEN, VERCEL_TOKEN (sinon login interactif), SITE_DOMAIN=www.votre-domaine.eu
npm run deploy
```

Le script `scripts/deploy.sh` enchaîne les étapes suivantes :
1. **Railway** : il crée le projet, ajoute PostgreSQL, crée le service `api`, injecte `DATABASE_URL=${{Postgres.DATABASE_URL}}`, génère un `JWT_SECRET` (conservé lors des redéploiements) puis déploie le Dockerfile.
2. Au premier démarrage, l'API applique les migrations, charge le catalogue de départ et crée le compte admin.
3. **Vercel** : il lie le projet `apps/web`, pose `NEXT_PUBLIC_API_URL` et `NEXT_PUBLIC_SITE_URL` (production et preview), puis déploie en production.
4. Il reconfigure le CORS de l'API avec l'URL Vercel réelle, lance un test de santé et affiche les URLs de webhook.

### Configurer Adyen (recommandé pour l'Europe)
1. Customer Area → *Developers › API credentials* : créez une clé API et une **client key**, puis ajoutez l'URL Vercel dans *Allowed origins*.
2. *Developers › Webhooks* : créez un **Standard webhook** vers `https://<api>/api/webhooks/adyen` (JSON), générez la **HMAC key** et placez-la dans `ADYEN_HMAC_KEY`.
3. *Settings › Payment methods* : activez Cartes, SEPA Direct Debit, iDEAL, Bancontact, Klarna, etc. Le Drop-in les affiche automatiquement selon le pays.
4. En production : `ADYEN_ENVIRONMENT=live` et `ADYEN_LIVE_PREFIX` (préfixe d'URL live fourni par Adyen).

### Activer Klarna (via Adyen)
Klarna n'est **pas** une intégration séparée : c'est un moyen de paiement du Drop-in Adyen. Il suffit de l'activer sur votre compte marchand, aucune variable d'environnement n'est à ajouter.

1. Customer Area → *Settings › Payment methods* → **Add payment method → Klarna** (choisissez les variantes proposées : payer maintenant / plus tard / en plusieurs fois). En live, l'activation passe par une validation Adyen/Klarna (à demander à votre interlocuteur Adyen) ; en environnement `test`, elle est en général disponible sans validation.
2. Testez le tunnel complet en `ADYEN_ENVIRONMENT=test` avec les données de test Klarna fournies par Adyen, puis passez en `live`.
3. Le Drop-in n'affiche Klarna qu'aux acheteurs éligibles (pays, devise, montant, panier). La boutique facture en EUR : **vérifiez avec Adyen les pays où Klarna accepte l'EUR** dans votre contrat.
4. Vérifiez aussi le **délai de capture** (Customer Area → *Account › Settings*) : selon les pays, Klarna impose de capturer à l'expédition.
5. Côté site, retirez `klarna` de `NEXT_PUBLIC_PAYMENT_BADGES` (Vercel) tant que Klarna n'est pas actif en production, pour ne pas l'afficher dans la vitrine.

Ce que le code envoie pour que Klarna accepte la commande (`apps/api/src/payments/adyen.js`) : un panier complet dont le total égale le montant (**produits + ligne de livraison**), la TVA de chaque ligne (`taxAmount` + `taxPercentage` en points de base), l'adresse de facturation (identique à l'adresse de livraison, avec le numéro séparé de la rue quand c'est possible), le nom, l'e-mail et le téléphone. Au retour de paiement, le résultat Adyen n'est accepté que s'il correspond **à cette commande** (référence + montant) ; les webhooks vérifient aussi le montant, la devise et le fournisseur. Ces règles sont couvertes par `npm test` (`apps/api/test/adyen.test.js`).

### Payoneer Checkout
L'intégration utilise la page de paiement hébergée (requête LIST `integration: HOSTED` → redirection). Les notifications arrivent sur `/api/webhooks/payoneer` et sont authentifiées par un secret dans l'URL et par la correspondance `longId` / `transactionId`. Payoneer n'est utilisable que si `PAYONEER_NOTIFICATION_SECRET` est défini (valeur aléatoire propre, générée par `deploy.sh`) : tant que le fournisseur n'est pas activé, l'URL du webhook répond 404. **À vérifier avant la mise en ligne** : l'éligibilité de votre entité et les noms de champs et codes de statut fournis avec votre compte marchand (la doc publique Payoneer Checkout est limitée et Payoneer n'accepte que les cartes, sans SEPA).

## 3. Catalogue

- **Catalogue de départ** : 30 produits curés (instantané d'octobre 2026). Les doublons régionaux de Reactive Outdoor sont regroupés en variantes de taille ou de pack, avec des textes originaux en EN/FR/DE.
- **Synchronisation complète** : bouton *Admin › Produits › « Synchroniser les catalogues »*, ou `npm run catalog:import` (options `--draft`, `--sync-stock`, `--archive-missing`, `--dry-run`, `--brand=kilos-gear`). Elle s'appuie sur les flux publics Shopify `/products.json` des deux marques et ignore les doublons US/UK/AU/CA, les produits test et ceux sans prix. Les prix USD (Kilos Gear) sont convertis avec `FX_USD_EUR`, et `PRICE_MULTIPLIER` permet d'appliquer une marge.
- Les produits importés arrivent en **brouillon** depuis l'admin, pour relecture et traduction avant publication.
- Les 30 produits de départ ont tous leurs photos (66 au total, galeries comprises), servies par le CDN Shopify de vos boutiques et redimensionnées via `?width=`, donc sans coût d'optimisation Vercel. La synchro importe jusqu'à 12 photos par produit.

> Les deux boutiques sources appartiennent au propriétaire de Vanguard Outdoor : photos et descriptions sont réutilisées avec son autorisation.

## 4. Design & thèmes

Deux thèmes, choisis par la variable `NEXT_PUBLIC_THEME` sur Vercel (ou `THEME=` au déploiement) :

| Thème | Palette | Usage |
|---|---|---|
| `forest` (défaut) | vert forêt `#16291F`, mousse `#52703F`, lichen `#A9C27A`, sable `#F7F4EC`, braise `#B4521F` pour les boutons d'achat et les promos | ambiance nature / végétation |
| `classic` | noir / blanc / rouge `#D7261E` | brief d'origine |

Toutes les couleurs passent par des variables CSS (`apps/web/src/app/globals.css`), contrastes vérifiés WCAG AA. Le hero combine une photo lifestyle (`HERO_IMAGE` dans `apps/web/src/lib/theme.ts`), des montagnes et une lisière de sapins dessinées en SVG ; si la photo ne charge pas, l'illustration reste.

**Système de design** (tout se règle dans `globals.css` et `tailwind.config.ts`) :
- **Boutons compacts** : 36 px par défaut (`.btn`), modificateurs `.btn-xs` (28), `.btn-sm` (32), `.btn-lg` (40, boutons d'achat) ; variantes `-primary`, `-dark`, `-outline`, `-soft`, `-ghost`, `-ghost-light`. Les boutons-icônes (`.icon-btn`) mesurent 36 px mais gardent une zone tactile de 44 px.
- **Typographie fluide** (`clamp()`), grilles qui s'adaptent de 320 px à 1440 px, aucun saut de mise en page au défilement (en-tête de hauteur fixe).
- **Mouvement** : uniquement `transform` / `opacity` (pas de recalcul de mise en page), courbes `--ease-out` et `--ease-spring` ; apparition au défilement (`<Reveal>`), panneaux panier / menu / filtres animés à l'entrée **et** à la sortie, parallaxe du hero en CSS pur, barre d'achat collante sur mobile.
- **Accessibilité** : `prefers-reduced-motion` désactive toutes les animations, focus piégé et Échap dans les panneaux (`lib/useDialog.ts`), lien « Aller au contenu ».
- Vitrine des moyens de paiement : `NEXT_PUBLIC_PAYMENT_BADGES` (voir plus bas).

## 5. Fonctionnalités

- **Accueil** : hero, catégories, best-sellers, univers des deux marques, newsletter (opt-in RGPD horodaté).
- **Catalogue fusionné** : 8 catégories, filtres prix / marque / disponibilité / promo, tri, recherche et pagination. Les URLs de filtres sont partageables et passent en `noindex`.
- **Fiche produit** : variantes localisées, stock, estimation de livraison par pays, badges de confiance, JSON-LD `Product`.
- **Panier** (persisté) avec re-tarification serveur, puis **checkout** en une page : pays européens uniquement, standard / express, livraison offerte selon un seuil par zone, TVA incluse calculée selon le taux du pays (OSS).
- **Compte client** : inscription, connexion JWT, historique des commandes, suivi avec timeline et lien transporteur. Suivi invité par n° de commande + e-mail.
- **Admin** : tableau de bord (CA, panier moyen, ventes 14 j, top produits, stock faible), commandes (statuts, transporteur + n° de suivi → passage auto en « Expédiée », notes internes, restockage en cas d'annulation), produits (CRUD multilingue, variantes, prix barrés, stock, vedette), clients, synchro catalogues.
- **SEO Europe** : routes `/en /fr /de`, `hreflang` + `x-default`, canonicals, sitemap multilingue, robots, Open Graph dynamique, JSON-LD (OnlineStore, Product, BreadcrumbList), détection de langue (navigateur, cookie, pays Vercel).
- **Sécurité** : prix toujours recalculés côté serveur, webhooks idempotents (HMAC Adyen vérifié, montant / devise / fournisseur contrôlés), résultat de paiement toujours rattaché à sa commande, stock décrémenté une seule fois au paiement, rate-limit sur l'authentification (par IP **et** par compte), Helmet, CORS restreint, mots de passe en **scrypt** (hors du thread principal : une rafale de connexions ne fige pas l'API), refus de démarrer en production avec un `JWT_SECRET` faible, jetons et secrets masqués dans les journaux d'accès, mot de passe `ADMIN_PASSWORD` prioritaire sur tout compte déjà inscrit avec la même adresse.
- **Newsletter** : inscription sans doublon, désinscription par lien signé (`/xx/newsletter/unsubscribe`, à placer dans chaque e-mail : `unsubscribeUrl(email, locale)` dans `apps/api/src/lib/newsletter.js`). Une adresse désinscrite le reste. Il n'y a pas encore de double opt-in : il demande un prestataire d'e-mails (voir « Avant la mise en ligne »).

## 6. Variables d'environnement

Voir `apps/api/.env.example` et `apps/web/.env.example`. Les principales :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Postgres (Railway : `${{Postgres.DATABASE_URL}}`) |
| `JWT_SECRET` | secret de signature des tokens : **aléatoire, 32 caractères minimum** (`openssl rand -hex 48`), sinon l'API refuse de démarrer en production |
| `FRONTEND_URL`, `CORS_ORIGINS`, `PUBLIC_API_URL` | URLs croisées Vercel ↔ Railway |
| `PAYMENT_PROVIDERS` | `adyen`, `adyen,payoneer`… (le premier est le défaut) |
| `ADYEN_*`, `PAYONEER_*` | identifiants PSP (`PAYONEER_NOTIFICATION_SECRET` : valeur aléatoire propre, obligatoire pour activer Payoneer) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | premier administrateur : à définir **avant** l'ouverture du site, puis à retirer des variables une fois connecté |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` | côté Vercel |
| `NEXT_PUBLIC_THEME` | `forest` (défaut) ou `classic` |
| `NEXT_PUBLIC_PAYMENT_BADGES` | moyens de paiement affichés dans la vitrine (liste séparée par des virgules, `klarna` inclus par défaut) |

## 7. Avant la mise en ligne
- [ ] Remplacer les `[PLACEHOLDERS]` des pages légales (`apps/web/src/lib/legal.ts`) par vos informations (raison sociale, TVA, adresse) et les faire valider.
- [ ] Immatriculation au guichet unique **OSS** pour la TVA UE, et vérification des taux dans `apps/api/src/lib/europe.js`.
- [ ] Ajuster les tarifs et seuils de livraison (`SHIPPING_RATES`) selon vos contrats transporteurs.
- [ ] Ajouter l'envoi d'e-mails transactionnels (confirmation, expédition), par exemple Resend ou Brevo. Les événements sont déjà prêts dans `order_events`. Le même prestataire permettra le **double opt-in** de la newsletter (e-mail de confirmation) ; chaque e-mail marketing doit contenir `unsubscribeUrl(email, locale)`.
- [ ] Ajouter une vérification d'e-mail avant de rattacher les commandes invitées à un compte.
- [ ] Activer Klarna chez Adyen, le tester en `test`, vérifier pays / devise / capture (voir « Activer Klarna »).
- [ ] **Vercel** : définir *Root Directory* = `apps/web`, et les variables `NEXT_PUBLIC_API_URL` et `NEXT_PUBLIC_SITE_URL` **avant le premier build** (sinon le sitemap et les URL canoniques pointent vers `localhost`). Vercel n'héberge que la boutique : l'API et PostgreSQL restent sur Railway (ou équivalent).
- [ ] Générer un `JWT_SECRET` long et aléatoire (`openssl rand -hex 48`) et ne jamais réutiliser la valeur de `.env.example`.
