# Configuration API INSEE - Version 2024

## ✅ Migration terminée : Plus de mock, uniquement API INSEE !

L'application utilise maintenant **exclusivement** l'API INSEE officielle. Tous les comportements mock ont été supprimés.

## Configuration requise

### Option 1 : Authentification OAuth2 (Recommandée)

1. **Créez un compte sur le portail INSEE** : https://api.insee.fr/catalogue/
2. **Souscrivez à l'API Sirene V3**
3. **Générez vos clés** dans la section "Mes applications"
4. **Créez un fichier `.env.local`** dans le dossier `web/` avec :
```bash
SIRENE_KEY=votre_consumer_key_ici
SIRENE_SECRET=votre_consumer_secret_ici
```

### Option 2 : Clé d'intégration (Alternative)

Si vous avez déjà une clé d'intégration :
```bash
INSEE_INTEGRATION_KEY=votre_cle_integration_ici
```

**Note :** Utilisez SOIT les clés OAuth2 SOIT la clé d'intégration, pas les deux.

## Redémarrage

```bash
cd web
npm run dev
```

## Fonctionnalités

- ✅ **100% API INSEE** - Plus de données locales ou mock
- ✅ **Cache des tokens** - Optimisation des performances
- ✅ **Gestion des erreurs** - Messages clairs pour chaque cas
- ✅ **Rate limiting** - Respect des limites INSEE (30 req/min)
- ✅ **Concurrence contrôlée** - Traitement par batch optimisé

## Types d'erreurs

- `SIRET_NOT_FOUND` : SIRET radié ou inexistant
- `HTTP_XXX` : Erreur API INSEE
- `NETWORK_ERROR` : Problème de connexion
- `NO_API_CONFIGURED` : Clés manquantes

## Avantages

- ✅ Données INSEE officielles et à jour
- ✅ Plus de faux positifs/negatifs
- ✅ Fonctionne avec tous les SIRET français
- ✅ Gestion automatique des tokens


