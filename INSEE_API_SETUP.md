# Configuration API INSEE Sirene

## Pourquoi configurer l'API ?
Votre base locale INSEE ne contient pas tous les SIRET de vos fichiers. L'API INSEE vous permettra de vérifier l'état administratif de tous les SIRET en temps réel.

## Étapes de configuration

### 1. Obtenir les clés API
1. Allez sur https://api.insee.fr/catalogue/
2. Créez un compte ou connectez-vous
3. Demandez un accès à l'API Sirene V3
4. Récupérez votre `consumer_key` et `consumer_secret`

### 2. Configurer les variables d'environnement
Créez un fichier `.env.local` dans le dossier `web/` avec :

```bash
SIRENE_KEY=votre_consumer_key_ici
SIRENE_SECRET=votre_consumer_secret_ici
```

### 3. Redémarrer l'application
```bash
cd web
npm run dev
```

## Avantages
- ✅ Vérification en temps réel de l'état administratif
- ✅ Données INSEE officielles et à jour
- ✅ Plus de faux positifs/negatifs
- ✅ Fonctionne avec tous les SIRET français

## Limitations
- Rate limiting : 30 requêtes/minute
- Nécessite une connexion internet
- Clés API à renouveler périodiquement



