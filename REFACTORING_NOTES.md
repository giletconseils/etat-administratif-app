# Refactoring - Nouveau système de jointure automatique

## Nouvelles fonctionnalités implémentées

### 1. Panel de sélection des ensembles de sous-traitants
- **Localisation** : Panel en haut de l'interface principale
- **Fonctionnalité** : Permet d'activer/désactiver les ensembles TR, U1, U1P, U2, U3, U4
- **Par défaut** : Tous les ensembles sont activés
- **Interface** : Checkboxes avec boutons "Tout activer" / "Tout désactiver"

### 2. Jointure automatique avec les fichiers CSV
- **Endpoint** : `/api/join/auto-join`
- **Fonctionnalité** : Jointure automatique entre les SIRETs et les fichiers CSV par statut activé
- **Champ de jointure** : SIRET (recherche flexible sur différents noms de colonnes)
- **Résultat** : Entreprises trouvées dans la base + SIRETs non trouvés pour vérification API

### 3. Système de rate limiting avec streaming
- **Endpoint** : `/api/check-siret/stream`
- **Fonctionnalité** : Streaming en temps réel des résultats de vérification INSEE
- **Rate limiting** : 25 requêtes/minute (respecte la limite INSEE de 30/min)
- **Interface** : Progress bar avec indicateur de la ligne en cours de traitement

### 4. Affichage des entreprises radiées
- **Style** : Lignes en rouge pour les entreprises radiées
- **Indicateurs** : Badges colorés (rouge pour radiée, vert pour active)
- **Date de cessation** : Affichée en rouge pour les entreprises radiées
- **UI** : Design sobre et minimal comme demandé

## Architecture technique

### Nouveaux endpoints
1. **`/api/join/auto-join`** : Jointure automatique avec les fichiers CSV
2. **`/api/check-siret/stream`** : Streaming des résultats de vérification INSEE

### Modifications principales
1. **`page.tsx`** : Ajout du panel de sélection et du streaming
2. **Interface utilisateur** : Amélioration de l'affichage des résultats
3. **Gestion d'état** : Nouveaux états pour le streaming et les statuts activés

### Flux de traitement
1. **Sélection des ensembles** : L'utilisateur choisit quels ensembles utiliser
2. **Jointure automatique** : Recherche dans les fichiers CSV activés
3. **Vérification API** : Pour les SIRETs non trouvés, vérification via API INSEE
4. **Affichage en temps réel** : Résultats affichés au fur et à mesure
5. **Interface finale** : Tableau avec entreprises radiées en rouge

## Utilisation

1. **Sélectionner les ensembles** : Activer/désactiver les ensembles de sous-traitants souhaités
2. **Charger les fichiers** : Fichier entreprises (obligatoire) + fichier dettes (optionnel)
3. **Lancer la vérification** : Le système effectue automatiquement :
   - Jointure avec les fichiers CSV activés
   - Vérification API pour les SIRETs non trouvés
   - Affichage en temps réel des résultats
4. **Consulter les résultats** : Entreprises radiées affichées en rouge avec indicateurs visuels

## Avantages du nouveau système

- **Performance** : Jointure locale d'abord, API seulement si nécessaire
- **Transparence** : Affichage en temps réel du progrès
- **Flexibilité** : Choix des ensembles de sous-traitants à utiliser
- **UX améliorée** : Interface claire avec indicateurs visuels
- **Respect des limites** : Rate limiting automatique pour l'API INSEE
