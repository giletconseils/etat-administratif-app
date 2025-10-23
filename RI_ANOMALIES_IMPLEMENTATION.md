# Implémentation - Détection des anomalies de déclarations de RI

## ✅ Fonctionnalités implémentées

### Phase 1 : Infrastructure de données

#### 1.1 Fichiers CSV de base créés
- ✅ `/data/csv-files/assureurs/assureurs.csv` - Liste des assureurs avec % RI par défaut
- ✅ `/data/csv-files/missions/missions.csv` - Missions DU copiées depuis le fichier fourni

#### 1.2 Statistiques RI par assureur (valeurs par défaut)
```
Fidélia (1)         : 60%
Dynaren (3)         : 30%
FilAssistance (4)   : 20%
Opteven (7)         : 70%
Mutuaide (8)        : 40%
AXA (10)            : 0%
EAF (11)            : 75%
Foncia (25)         : 0%
GMF (26)            : 35%
SOFRATEL (28)       : 0%
Stelliant B2B (29)  : 0%
Stelliant B2C (36)  : 0%
```

#### 1.3 API Routes créées
- ✅ `POST /api/data/upload-dataset` - Upload de CSV (sous-traitants, missions, assureurs)
- ✅ `GET /api/data/list-datasets` - Liste des datasets avec métadonnées
- ✅ `GET /api/data/assureurs` - Récupère la liste des assureurs
- ✅ `PUT /api/data/assureurs` - Met à jour les % RI

### Phase 2 : Onglet Données

#### 2.1 Page /data créée
- ✅ Interface de gestion des datasets
- ✅ Section "Base sous-traitants" avec upload CSV
- ✅ Section "Missions (DU)" avec upload CSV
- ✅ Section "Assureurs et % RI" avec tableau éditable
- ✅ Fonctionnalités :
  - Affichage des métadonnées (dernière modification, nombre de lignes)
  - Upload drag & drop pour remplacer les datasets
  - Édition en ligne des % RI par assureur
  - Bouton "Sauvegarder les modifications"
  - Bouton "Réinitialiser aux valeurs par défaut"

#### 2.2 Navigation
- ✅ Onglet "Données" ajouté dans le header principal
- ✅ Navigation entre : Analyse / Données / Jointures

### Phase 3 : Traitement RI Anomalies

#### 3.1 Types et interfaces
- ✅ `web/src/lib/treatments/ri-anomalies/types.ts`
  - `RIAnomalyResult` - Résultat global de l'analyse
  - `AssureurDetail` - Détails par assureur
  - `Mission` - Structure d'une mission
  - `Assureur` - Structure d'un assureur

#### 3.2 Executor
- ✅ `web/src/lib/treatments/ri-anomalies/executor.ts`
- ✅ Logique implémentée :
  1. Chargement des missions depuis le CSV
  2. Filtrage par SIRET
  3. Chargement des % RI par assureur
  4. Groupement des missions DU par prescriber_id (assureur)
  5. Calcul pour chaque assureur :
     - Nombre de missions DU
     - RI théorique = missions × % RI
     - RI réel = missions avec `SERVICE_B2CSDU_ORDER → external_id` rempli
     - Écart en %
  6. Agrégation des résultats globaux
  7. Détermination du statut :
     - ⚠️ **Warning** : écart < -20% (sous-déclaration)
     - ✓ **Conforme** : -20% ≤ écart ≤ +10%
     - ✨ **Excellent** : écart > +10%

#### 3.3 API Route
- ✅ `POST /api/treatments/ri-anomalies`
  - Paramètre : `{ siret: string }`
  - Retourne : `RIAnomalyResult`

#### 3.4 Registry mis à jour
- ✅ Traitement "ri-anomalies" activé (`enabled: true`)
- ✅ Incompatibilité définie avec "radiation-check"

### Phase 4 : Interface utilisateur

#### 4.1 Contraintes dans TreatmentSelector
- ✅ RI anomalies désactivé si :
  - CSV uploadé (fichier CSV chargé dans l'interface)
  - "Ensemble de sous-traitants" sélectionné
  - Nombre de SIRETs ≠ 1 (zéro ou plusieurs)
- ✅ Affichage d'un message explicatif pour chaque contrainte
- ✅ Icône ⚠️ pour indiquer les contraintes actives

#### 4.2 Composant RIAnomalyResults
- ✅ `web/src/components/RIAnomalyResults.tsx`
- ✅ Vue résumé avec :
  - SIRET et dénomination de l'entreprise
  - 4 métriques clés : Missions DU, RI Théorique, RI Réel, Écart %
  - Badge de statut coloré (Warning/Conforme/Excellent)
- ✅ Vue détaillée (dépliant) :
  - Tableau groupé par assureur
  - Colonnes : Assureur, Missions reçues, RI théorique, RI déclaré, Écart %
  - Code couleur pour les écarts
- ✅ Légende explicative

#### 4.3 Intégration dans la page principale
- ✅ Détection du traitement "ri-anomalies" sélectionné
- ✅ Appel de l'API dédiée au lieu du flow standard
- ✅ Affichage conditionnel de `RIAnomalyResults` vs `ResultsTable`
- ✅ Passage automatique à l'étape 3 une fois l'analyse terminée
- ✅ Suivi de l'onglet actif (search/base/csv) pour les contraintes

## 📋 Comment utiliser la fonctionnalité

### 1. Préparer les données (première utilisation)

1. Aller sur la page **"Données"** (onglet dans le header)
2. Vérifier que les datasets sont présents :
   - ✓ Base sous-traitants (déjà présente)
   - ✓ Missions (copiée automatiquement)
   - ✓ Assureurs (créée avec valeurs par défaut)

3. Si nécessaire, ajuster les % RI par assureur :
   - Éditer directement dans le tableau
   - Cliquer sur "Sauvegarder les modifications"

### 2. Analyser un SIRET

1. Aller sur la page **"Analyse"**
2. **Étape 1 : Choix des données**
   - Sélectionner l'onglet **"Recherche SIRET/SIREN"**
   - Saisir **UN SEUL SIRET** (exemple : `85053188000019`)
   - Cliquer sur "Suivant : Choisir les traitements"

3. **Étape 2 : Traitement**
   - Sélectionner **"Détecter les anomalies de déclarations de RI"**
   - Le traitement "radiation-check" sera automatiquement désélectionné (incompatible)
   - Cliquer sur "Lancer l'analyse"

4. **Étape 3 : Résultats**
   - L'analyse s'affiche automatiquement
   - Vue résumé : métriques globales et statut
   - Cliquer pour déplier les détails par assureur

### 3. Mettre à jour les missions

Pour ajouter de nouvelles missions :

1. Aller sur **"Données"**
2. Section **"Missions (DU)"**
3. Cliquer sur **"Remplacer le fichier"**
4. Sélectionner le nouveau CSV avec les colonnes :
   - `prescriber_id` (ID assureur)
   - `company_id` ou `SERVICE_EMERGENCY_INTERVENTION → company_id`
   - `siret` ou `SERVICE_USER_COMPANY - company_id → siret`
   - `SERVICE_B2CSDU_ORDER → external_id` (présence = RI déclaré)

## 🎨 Codes couleurs et statuts

| Statut | Couleur | Condition | Signification |
|--------|---------|-----------|---------------|
| ⚠️ Sous-déclaration | Rouge | Écart < -20% | Alerte : l'artisan déclare beaucoup moins de RI que prévu |
| ✓ Conforme | Vert | -20% ≤ Écart ≤ +10% | Normal : déclarations dans la fourchette attendue |
| ✨ Excellent | Bleu | Écart > +10% | Très bien : l'artisan déclare plus de RI que prévu |

## 🔧 Architecture technique

### Structure des fichiers créés

```
/data/csv-files/
├── assureurs/
│   └── assureurs.csv
└── missions/
    └── missions.csv

/web/src/
├── app/
│   ├── data/
│   │   └── page.tsx                      [Nouvelle page]
│   └── api/
│       ├── data/
│       │   ├── upload-dataset/route.ts   [Nouvelle API]
│       │   ├── list-datasets/route.ts    [Nouvelle API]
│       │   └── assureurs/route.ts        [Nouvelle API]
│       └── treatments/
│           └── ri-anomalies/route.ts     [Nouvelle API]
├── lib/
│   └── treatments/
│       └── ri-anomalies/
│           ├── types.ts                  [Nouveaux types]
│           └── executor.ts               [Nouvelle logique]
└── components/
    ├── RIAnomalyResults.tsx             [Nouveau composant]
    └── TreatmentSelector.tsx            [Modifié - contraintes]
```

### Fichiers modifiés

- `web/src/app/layout.tsx` - Ajout de la navigation
- `web/src/app/page.tsx` - Intégration du traitement RI
- `web/src/lib/treatments/registry.ts` - Activation du traitement
- `web/src/components/TreatmentSelector.tsx` - Ajout des contraintes
- `web/src/components/ui/Tabs.tsx` - Ajout de onValueChange

## 🚀 Prochaines étapes (V2)

Pour les futures améliorations :

1. **Support multi-SIRET** : Analyser plusieurs SIRETs en une fois
2. **Export des résultats** : Télécharger les résultats en Excel
3. **Graphiques** : Visualisation des écarts par assureur
4. **Historique** : Suivi de l'évolution dans le temps
5. **Alertes automatiques** : Notification pour les gros écarts
6. **Disponibilité pour base sous-traitants** : Analyse de toute la base

## 📝 Notes importantes

- Le traitement RI anomalies est **uniquement disponible pour la recherche manuelle d'un SIRET unique**
- Les % RI par assureur sont **modifiables** et persistent dans le CSV
- Les missions doivent être **mises à jour régulièrement** pour avoir des analyses pertinentes
- Le calcul du RI théorique est basé sur le **nombre de missions × % RI de l'assureur**
- Une mission est considérée comme ayant généré une RI si `SERVICE_B2CSDU_ORDER → external_id` est rempli

## ✨ Résumé

L'implémentation complète de la détection des anomalies de déclarations de RI est terminée et fonctionnelle. Le système peut maintenant :

✅ Gérer les datasets de base (sous-traitants, missions, assureurs)  
✅ Permettre l'édition des % RI par assureur  
✅ Analyser un SIRET pour détecter les sous-déclarations de RI  
✅ Afficher des résultats détaillés avec statut et détails par assureur  
✅ Appliquer des contraintes intelligentes (un seul SIRET en recherche manuelle)  

Le système est prêt à être utilisé !

