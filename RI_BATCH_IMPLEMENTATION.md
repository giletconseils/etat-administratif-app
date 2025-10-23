# Implémentation - Mode Batch pour Détection de Fraude RI

## 📋 Résumé

Refonte complète de l'architecture de navigation et ajout du mode batch pour la détection des anomalies de déclarations de RI. Cette implémentation permet maintenant d'analyser l'ensemble de la base sous-traitants pour identifier les fraudes potentielles.

## ✅ Fonctionnalités Implémentées

### 1. Nouvelle Architecture de Navigation

#### 1.1 Page d'Accueil Redesignée
- **Fichier**: `/web/src/app/page.tsx` (nouveau)
- **Fonctionnalités**:
  - Pills de catégories stylées (Enrichissement / Détection d'anomalies / Intervenants réseau)
  - Cards de traitements groupées par catégorie
  - Design moderne avec glassmorphism et animations
  - Redirection vers `/analyse?treatment=[id]`

#### 1.2 Page d'Analyse Refactorisée
- **Fichier**: `/web/src/app/analyse/page.tsx` (déplacé depuis `/web/src/app/page.tsx`)
- **Changements**:
  - Récupération du traitement depuis URL query params
  - Stepper amélioré à 3 étapes :
    - **Étape 1**: Configuration (données + paramètres spécifiques au traitement)
    - **Étape 2**: Traitement en cours (affichage automatique pendant l'analyse)
    - **Étape 3**: Résultats
  - Affichage du traitement sélectionné dans l'étape 1
  - Bouton "Lancer l'analyse" directement dans l'étape 1
  - Paramètre `minMissions` avec slider pour le mode batch RI

#### 1.3 Navigation Header
- **Fichier**: `/web/src/app/layout.tsx`
- **Changement**: Ajout du lien "Accueil" et "Analyse"

### 2. Extension du Traitement RI Anomalies

#### 2.1 Types Étendus
- **Fichier**: `/web/src/lib/treatments/ri-anomalies/types.ts`
- **Ajouts**:
  ```typescript
  interface RIAnomalyResult {
    // ... champs existants
    status_reseau?: number;  // Pour filtrer U3/U4
    ranking?: number;        // Pour le tri dans le mode batch
  }
  
  interface RIAnomaliesResults {
    results: RIAnomalyResult[];
    mode?: 'siret' | 'batch';
    minMissions?: number;
    totalAnalyzed?: number;
    totalFiltered?: number;
  }
  ```

#### 2.2 Executor avec Support Batch
- **Fichier**: `/web/src/lib/treatments/ri-anomalies/executor.ts`
- **Nouvelle fonction**: `executeAll(minMissions: number = 5)`
- **Logique**:
  1. Charge toute la base sous-traitants
  2. Filtre `status ≠ 3` et `status ≠ 4` (exclut U3/U4)
  3. Pour chaque sous-traitant, compte ses missions
  4. Filtre ceux avec `missions >= minMissions`
  5. Exécute `executeSingle()` pour chacun
  6. Trie par `ecartPercent` croissant (sous-déclarations d'abord)
  7. Ajoute le ranking

#### 2.3 API Route Étendue
- **Fichier**: `/web/src/app/api/treatments/ri-anomalies/route.ts`
- **Modes supportés**:
  - **Mode SIRET**: `{ sirets: string[] }` → utilise `execute()`
  - **Mode BATCH**: `{ mode: 'batch', minMissions?: number }` → utilise `executeAll()`
- **Timeout**: Augmenté à 300s (5 minutes) pour le mode batch

#### 2.4 Registry Mis à Jour
- **Fichier**: `/web/src/lib/treatments/registry.ts`
- **Changement**: Retrait de la contrainte `incompatibleWith: ['radiation-check']`
- **Description**: Mise à jour pour mentionner le mode batch

### 3. Interface Utilisateur - Mode Batch

#### 3.1 Composant de Résultats Batch
- **Fichier**: `/web/src/components/RIAnomalyBatchResults.tsx` (nouveau)
- **Fonctionnalités**:
  - **Card synthèse** avec 3 métriques :
    - Nombre total de sous-traitants analysés
    - Nombre avec sous-déclaration (écart < -20%)
    - Pourcentage de fraude potentielle
  - **Tableau trié** avec pagination (50 résultats/page) :
    - Colonnes : Rang, SIRET, Dénomination, Missions DU, RI Théorique, RI Réel, Écart %, Statut
    - Code couleur automatique selon l'écart
    - Tri par défaut : écart % croissant
  - **Bouton Export Excel** :
    - Exporte TOUS les résultats (pas seulement la page courante)
    - Format : `ri_anomalies_batch_[date].xlsx`
  - **Légende** explicative des codes couleur

#### 3.2 Intégration dans la Page d'Analyse
- Détection automatique du mode selon l'onglet sélectionné :
  - Onglet "Recherche SIRET" → Mode SIRET
  - Onglet "Ensemble sous-traitants" → Mode BATCH
- Affichage conditionnel :
  - Mode BATCH → `RIAnomalyBatchResults`
  - Mode SIRET → `RIAnomalyResults`
- Paramètre `minMissions` visible uniquement en mode batch

## 🎯 Utilisation

### Mode SIRET (Existant)
1. Aller sur la page d'accueil
2. Cliquer sur "Détecter les anomalies de déclarations de RI"
3. Onglet "Recherche SIRET/SIREN"
4. Saisir un ou plusieurs SIRETs
5. Cliquer sur "Lancer l'analyse"

### Mode BATCH (Nouveau)
1. Aller sur la page d'accueil
2. Cliquer sur "Détecter les anomalies de déclarations de RI"
3. Onglet "Ensemble de sous-traitants"
4. Ajuster le slider "Nombre minimum de missions DU" (défaut: 5)
5. Cliquer sur "Lancer l'analyse"
6. Les résultats s'affichent triés par ordre croissant d'écart % (fraudes potentielles en premier)
7. Cliquer sur "Exporter en Excel" pour télécharger tous les résultats

## 📊 Filtres Appliqués en Mode Batch

1. **Statut réseau**: Exclut automatiquement U3 (status = 3) et U4 (status = 4)
   - **Interface**: Les cases U3 et U4 sont désactivées visuellement avec un badge "Exclu"
   - Les utilisateurs ne peuvent pas sélectionner ces statuts en mode RI anomalies
   - Un message d'avertissement explique l'exclusion
2. **Nombre de missions**: Seuls les sous-traitants avec ≥ `minMissions` missions DU sont analysés
3. **Tri**: Résultats triés par écart % croissant (sous-déclarations les plus importantes en premier)

## 🔍 Détection de Fraude

Les critères de détection sont basés sur l'écart entre RI théorique et RI réel :

| Statut | Écart % | Couleur | Signification |
|--------|---------|---------|---------------|
| ⚠️ Sous-déclaration | < -20% | Rouge | Fraude potentielle - sous-déclaration significative |
| ✓ Conforme | -20% à +10% | Vert | Déclarations dans la norme |
| ✨ Excellent | > +10% | Bleu | Sur-déclaration |

## 📁 Fichiers Créés

```
/web/src/app/
  page.tsx                                    [Nouveau - Page d'accueil]
  analyse/
    page.tsx                                  [Déplacé depuis page.tsx]

/web/src/components/
  RIAnomalyBatchResults.tsx                  [Nouveau - Résultats batch]

/RI_BATCH_IMPLEMENTATION.md                  [Nouveau - Cette doc]
```

## 📝 Fichiers Modifiés

```
/web/src/app/layout.tsx                      [Navigation mise à jour]
/web/src/lib/treatments/ri-anomalies/
  types.ts                                    [Types étendus]
  executor.ts                                 [Fonction executeAll()]
/web/src/app/api/treatments/ri-anomalies/
  route.ts                                    [Support mode batch]
/web/src/lib/treatments/registry.ts          [Incompatibilité retirée]
```

## 🚀 Améliorations Techniques

1. **Performance**:
   - Timeout API augmenté à 5 minutes pour le mode batch
   - Chargement unique des missions et assureurs
   - Traitement parallèle avec `Promise.all()`

2. **UX**:
   - Stepper clair avec 3 étapes bien définies
   - Feedback visuel pendant le traitement (étape 2)
   - Transition automatique entre les étapes
   - Pagination pour les gros volumes de résultats

3. **Export**:
   - Export Excel avec formatage automatique
   - Largeurs de colonnes optimisées
   - Nom de fichier avec date automatique

## 💡 Prochaines Améliorations Possibles

1. **Filtres additionnels**:
   - Filtrer par zone géographique
   - Filtrer par plage d'écart %
   - Filtrer par assureur spécifique

2. **Visualisations**:
   - Graphiques de distribution des écarts
   - Cartographie des fraudes
   - Évolution temporelle

3. **Alertes**:
   - Notifications automatiques pour nouveaux cas de fraude
   - Seuils configurables
   - Rapports périodiques

4. **Performance**:
   - Mise en cache des résultats
   - Streaming des résultats en mode batch
   - Traitement asynchrone en arrière-plan

## ✨ Résumé

L'implémentation est complète et fonctionnelle. Le système peut maintenant :

✅ Proposer une page d'accueil moderne avec sélection de traitement par catégories  
✅ Analyser l'ensemble de la base sous-traitants en mode batch  
✅ Filtrer automatiquement les statuts U3/U4  
✅ Appliquer un seuil configurable de nombre de missions  
✅ Trier les résultats par ordre de suspicion de fraude  
✅ Exporter tous les résultats en Excel  
✅ Maintenir le support du mode SIRET unique  

**Le système est prêt à détecter les fraudes à grande échelle ! 🎉**

