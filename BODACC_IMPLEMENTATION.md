# Implémentation de l'API BODACC pour la détection des procédures collectives

## Vue d'ensemble

Cette implémentation permet de détecter automatiquement les procédures collectives en cours (redressement judiciaire, liquidation judiciaire, sauvegarde, etc.) pour des entreprises à partir de leur SIREN/SIRET en utilisant l'API officielle BODACC.

## Fonctionnalités

### ✅ Détection des procédures collectives
- **Redressement judiciaire** : Jugements d'ouverture de redressement judiciaire
- **Liquidation judiciaire** : Jugements d'ouverture de liquidation judiciaire  
- **Sauvegarde** : Procédures de sauvegarde
- **Concordat** : Procédures de concordat
- **Plan de redressement** : Plans de redressement
- **Liquidation amiable** : Liquidations amiables

### ✅ Classification des statuts
- **Procédure en cours** : Détectée quand le dernier avis n'est pas une clôture
- **Procédure terminée** : Détectée quand le dernier avis est une clôture

### ✅ API officielle BODACC
- Utilise l'API v2.1 BODACC : `https://www.bodacc.fr/api/explore/v2.1/catalog/datasets/annonces-commerciales/records`
- Filtre par SIREN et procédures collectives uniquement
- Récupère le dernier avis pour déterminer l'état récent

## Logique de détection

### Règles BODACC implémentées

1. **Si 0 enregistrement** → Pas de procédure publiée (ou antérieure à 2008)

2. **Si 1+ enregistrement** → Analyser le dernier avis (trié par `dateparution DESC`) :
   - **Ouverture** : "Jugement d'ouverture de redressement judiciaire", "Jugement d'ouverture de liquidation judiciaire", "procédure de sauvegarde" → **Procédure en cours**
   - **Évolution/Conversion** : Changement d'état (RJ → LJ) → **Procédure en cours**  
   - **Clôture** : "Clôture pour insuffisance d'actif", "Jugement de clôture" → **Procédure terminée**

3. **Règle pratique** : Si le dernier avis n'est pas une clôture, considérer la procédure comme en cours

## Utilisation

### API Endpoint
```bash
POST /api/enrich-bodacc
Content-Type: application/json

{
  "companies": [
    {
      "siret": "38076713700011",
      "denomination": "NOM ENTREPRISE",
      "estRadiee": false
    }
  ]
}
```

### Réponse
```json
{
  "enrichedCompanies": [
    {
      "siret": "38076713700011",
      "denomination": "NOM ENTREPRISE", 
      "estRadiee": false,
      "procedure": "Jugement d'ouverture de liquidation judiciaire",
      "procedureType": "LIQUIDATION_JUDICIAIRE",
      "hasActiveProcedures": true
    }
  ],
  "stats": {
    "total": 1,
    "withProcedures": 1,
    "withActiveProcedures": 1,
    "errors": 0
  }
}
```

### Hook React
```typescript
import { useBodaccEnrichment } from '@/lib/hooks/useBodaccEnrichment';

const { enrichWithBodacc, isEnriching, enrichmentStats } = useBodaccEnrichment();

// Enrichir des entreprises
const enrichedCompanies = await enrichWithBodacc(companies);
```

## Architecture

### Fichiers modifiés
- `src/lib/bodacc-api.ts` : Service principal pour l'API BODACC
- `src/app/api/enrich-bodacc/route.ts` : Endpoint API pour l'enrichissement
- `src/lib/types.ts` : Types TypeScript mis à jour
- `src/lib/hooks/useBodaccEnrichment.ts` : Hook React pour l'utilisation

### Cache
- Cache en mémoire de 24h pour éviter les requêtes répétées
- Clé de cache basée sur le SIREN

### Gestion d'erreurs
- Gestion des erreurs réseau
- Gestion des erreurs de parsing JSON
- Fallback gracieux en cas d'erreur

## Tests

### Test avec un SIREN en liquidation judiciaire
```bash
curl -X POST http://localhost:3000/api/enrich-bodacc \
  -H "Content-Type: application/json" \
  -d '{
    "companies": [
      {
        "siret": "38076713700011",
        "denomination": "BLANQUART",
        "estRadiee": false
      }
    ]
  }'
```

**Résultat attendu** : Détection de "Jugement d'ouverture de liquidation judiciaire" avec `hasActiveProcedures: true`

## Performance

- **Traitement par batch** : Maximum 5 SIRENs simultanés
- **Cache** : 24h pour éviter les requêtes répétées
- **Pause entre batches** : 1 seconde pour respecter l'API BODACC

## Conformité

- ✅ Utilise l'API officielle BODACC v2.1
- ✅ Respecte les quotas et limites de l'API
- ✅ Implémente les règles de détection officielles BODACC
- ✅ Gestion gracieuse des erreurs
