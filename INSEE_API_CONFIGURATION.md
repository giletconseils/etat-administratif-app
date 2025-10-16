# Configuration API INSEE - Migration Complète

## ✅ Migration Terminée

Le comportement mock a été **complètement supprimé**. L'application utilise maintenant **exclusivement l'API INSEE Sirene V3**.

## Configuration Requise

### 1. Créer un fichier `.env.local` dans le dossier `web/`

```bash
# Méthode 1: OAuth2 (recommandée)
SIRENE_KEY=votre_consumer_key_ici
SIRENE_SECRET=votre_consumer_secret_ici

# Méthode 2: Clé d'intégration (fallback)
INSEE_INTEGRATION_KEY=votre_cle_integration_ici
```

### 2. Obtenir vos clés API INSEE

1. **Allez sur** https://api.insee.fr/catalogue/
2. **Créez un compte** ou connectez-vous
3. **Souscrivez à l'API Sirene V3**
4. **Générez vos clés d'accès** :
   - Consumer Key (`SIRENE_KEY`)
   - Consumer Secret (`SIRENE_SECRET`)
   - Ou clé d'intégration (`INSEE_INTEGRATION_KEY`)

### 3. Redémarrer l'application

```bash
cd web
npm run dev
```

## Fonctionnalités Implémentées

### ✅ Authentification OAuth2
- Gestion automatique des tokens d'accès
- Cache des tokens avec expiration
- Renouvellement automatique

### ✅ Gestion des erreurs robuste
- Erreurs réseau gérées
- Codes HTTP INSEE interprétés
- Logs détaillés pour le debugging

### ✅ Respect des limites de taux
- Concurrence limitée à 3 requêtes simultanées
- Délais entre les batches
- Gestion des erreurs de rate limiting

### ✅ Parsing des réponses INSEE
- Détection automatique des entreprises radiées
- Extraction des dénominations
- Gestion des dates de cessation

## Types d'erreurs gérées

- `SIRET_NOT_FOUND` : SIRET inexistant ou radié
- `HTTP_XXX` : Erreur HTTP de l'API INSEE
- `INVALID_RESPONSE` : Réponse INSEE malformée
- `NETWORK_ERROR` : Problème de connexion
- `NO_API_CONFIGURED` : Aucune clé API configurée

## Suppression Complète du Mock

### ❌ Fichiers supprimés
- `src/lib/inseeLocal.ts` (lecture CSV locale)
- `StockEtablissement_utf8.csv`
- `StockEtablissement_utf8.zip`
- `query_result_*.csv`

### ❌ Code supprimé
- Toutes les fonctions mock
- Lectures de fichiers CSV locaux
- Logique de fallback vers données locales

## Avantages de la migration

- ✅ **Données en temps réel** de l'INSEE
- ✅ **Plus de faux positifs/negatifs**
- ✅ **Fonctionne avec tous les SIRET français**
- ✅ **Données officielles et à jour**
- ✅ **Architecture moderne et sécurisée**

## Limitations

- ⚠️ **Rate limiting** : 30 requêtes/minute
- ⚠️ **Connexion internet** requise
- ⚠️ **Clés API** à renouveler périodiquement

## Test

L'API est maintenant prête à être testée avec vos vrais SIRET. Tous les appels passent exclusivement par l'API INSEE officielle.
