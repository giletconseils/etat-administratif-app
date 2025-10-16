# Système Simplifié - Vérification SIRET

## Architecture simplifiée

### Fichier unique
- **Base de données** : `data/csv-files/base-sous-traitants/sous-traitants.csv`
- **Contenu** : Tous les sous-traitants avec leur statut dans la colonne `status`

### Mapping des statuts
La colonne `status` contient des codes numériques :
- **5** = TR (Travailleur Réseau)
- **4** = U4 
- **3** = U3
- **2** = U2
- **1** = U1
- **0** = U1P

### Processus de vérification

1. **Sélection des statuts** : L'utilisateur choisit quels statuts inclure via le panel
2. **Jointure** : Recherche des entreprises dans le fichier `sous-traitants.csv` filtré par statut
3. **Affichage immédiat** : Les résultats de la jointure s'affichent instantanément
4. **Vérification SIRENE** : Pour les SIRETs non trouvés, vérification via API INSEE avec streaming
5. **Résultats finaux** : Affichage de tous les résultats avec entreprises radiées en rouge

## Endpoints

### `/api/join/simple-join`
- **Fonction** : Jointure avec le fichier sous-traitants filtré par statut
- **Input** : Liste des SIRETs + statuts activés
- **Output** : Entreprises trouvées + SIRETs non trouvés

### `/api/check-siret/stream`
- **Fonction** : Vérification SIRENE avec streaming
- **Input** : Liste des SIRETs non trouvés
- **Output** : Streaming des résultats en temps réel

## Interface utilisateur

### Panel de sélection
- Checkboxes pour chaque statut (TR, U1, U1P, U2, U3, U4)
- Boutons "Tout activer" / "Tout désactiver"
- Compteur d'ensembles activés

### Processus
- **Pas de stepper** : Affichage direct des résultats
- **Streaming** : Progress bar pour la vérification SIRENE
- **Résultats** : Tableau avec entreprises radiées en rouge

### Affichage des résultats
- **Lignes rouges** : Entreprises radiées
- **Badges** : Indicateurs visuels (rouge/vert)
- **Source** : "Base sous-traitants" ou "API"

## Avantages du système simplifié

- **Performance** : Un seul fichier à traiter
- **Simplicité** : Pas de stepper complexe
- **Transparence** : Affichage immédiat des résultats
- **Flexibilité** : Filtrage par statut
- **UX optimisée** : Interface épurée et intuitive
