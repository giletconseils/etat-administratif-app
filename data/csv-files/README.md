# Gestion des fichiers CSV d'entreprises

Ce dossier contient les fichiers CSV d'entreprises organisés par statut réseau.

## Structure des dossiers

- **U4/** - Entreprises avec statut U4
- **U3/** - Entreprises avec statut U3  
- **U2/** - Entreprises avec statut U2
- **U1/** - Entreprises avec statut U1
- **U1P/** - Entreprises avec statut U1P
- **TR/** - Entreprises avec statut TR

## Comment ajouter des fichiers

1. **Manuellement via l'IDE** : Copiez vos fichiers CSV directement dans le dossier correspondant au statut
2. **Via l'interface web** : Utilisez la page de gestion des fichiers à l'adresse `/files`

## Format des fichiers

Les fichiers CSV doivent contenir au minimum une colonne avec les numéros SIRET des entreprises.

### Colonnes recommandées :
- `Siret` ou `SIRET` - Numéro SIRET (requis)
- `Tel` ou `Telephone` - Numéro de téléphone (optionnel)
- `Denomination` - Nom de l'entreprise (optionnel)

## Exemple de structure de fichier

```csv
"ID","Entreprise","Nom","Statut","Siret","Email","Tel","Doc à jour","Métier","Ville","Code postal"
"12303","AA PLOMBERIE ET CHAUFFAGE","AIT HADDOU","2","75320618400034","aitzak830@gmail.com","+33623052627","true","6,22,25","SETE","34200"
```

## Accès via l'application

L'application peut lire automatiquement les fichiers stockés dans ces dossiers pour effectuer les vérifications d'état administratif des entreprises.
