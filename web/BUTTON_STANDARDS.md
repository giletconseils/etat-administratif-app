# Standards des Boutons - Guide d'utilisation

Ce document décrit les classes CSS standardisées pour les boutons de l'application.

## Variables CSS Globales

Les variables suivantes sont définies dans `globals.css` et utilisées par toutes les classes de boutons :

### Tailles
- **Petit (sm)** : Hauteur 32px
- **Moyen (md)** : Hauteur 40px (par défaut)
- **Grand (lg)** : Hauteur 48px

### Variables disponibles
```css
/* Hauteurs */
--btn-height-sm: 2rem;      /* 32px */
--btn-height-md: 2.5rem;    /* 40px */
--btn-height-lg: 3rem;      /* 48px */

/* Padding horizontal */
--btn-padding-x-sm: 0.75rem;  /* 12px */
--btn-padding-x-md: 1rem;     /* 16px */
--btn-padding-x-lg: 1.5rem;   /* 24px */

/* Taille du texte */
--btn-text-size-sm: 0.75rem;  /* 12px */
--btn-text-size-md: 0.875rem; /* 14px */
--btn-text-size-lg: 1rem;     /* 16px */

/* Taille des icônes */
--btn-icon-size-sm: 0.875rem; /* 14px */
--btn-icon-size-md: 1rem;     /* 16px */
--btn-icon-size-lg: 1.25rem;  /* 20px */

/* Gap entre icône et texte */
--btn-gap-sm: 0.375rem;   /* 6px */
--btn-gap-md: 0.5rem;     /* 8px */
--btn-gap-lg: 0.625rem;   /* 10px */
```

## Classes CSS Standardisées

### Structure de base
Pour créer un bouton standardisé, combinez les classes suivantes :
1. `.btn-standard` - Classe de base (obligatoire)
2. Taille : `.btn-sm`, `.btn-md`, ou `.btn-lg`
3. Variant : `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`, `.btn-warning`
4. Optionnel : `.btn-full` pour 100% de largeur

### Exemples d'utilisation

#### Bouton Primary Moyen (Standard)
```jsx
<button className="btn-standard btn-md btn-primary">
  <svg>...</svg>
  <span>Exporter</span>
</button>
```

#### Bouton Primary Grand avec icône
```jsx
<button className="btn-standard btn-lg btn-primary">
  <svg>...</svg>
  <span>Nouvelle analyse</span>
</button>
```

#### Bouton Small Secondary
```jsx
<button className="btn-standard btn-sm btn-secondary">
  <svg>...</svg>
  <span>Annuler</span>
</button>
```

#### Bouton Full Width
```jsx
<button className="btn-standard btn-md btn-primary btn-full">
  <svg>...</svg>
  <span>Lancer l'analyse</span>
</button>
```

#### Bouton Danger
```jsx
<button className="btn-standard btn-md btn-danger">
  <svg>...</svg>
  <span>Supprimer</span>
</button>
```

## Variants disponibles

### `.btn-primary`
- Couleur : Bleu (#2563eb)
- Usage : Actions principales (soumettre, valider, continuer)

### `.btn-secondary`
- Couleur : Gris foncé avec bordure
- Usage : Actions secondaires (annuler, retour)

### `.btn-success`
- Couleur : Vert (#22C55E)
- Usage : Actions de succès (confirmer, ajouter)

### `.btn-danger`
- Couleur : Rouge (#EF4444)
- Usage : Actions destructives (supprimer, rejeter)

### `.btn-warning`
- Couleur : Orange (#F97316)
- Usage : Actions d'avertissement

## Migration des boutons existants

### Avant
```jsx
<button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2">
  <svg className="w-4 h-4">...</svg>
  <span>Exporter</span>
</button>
```

### Après
```jsx
<button className="btn-standard btn-md btn-primary">
  <svg>...</svg>
  <span>Exporter</span>
</button>
```

## Avantages

✅ **Cohérence** : Tous les boutons ont la même taille et le même style
✅ **Maintenabilité** : Un seul endroit pour modifier toutes les tailles
✅ **Icônes automatiques** : Les SVG sont redimensionnés automatiquement
✅ **Responsive** : Les tailles sont adaptées aux différents écrans
✅ **Accessibilité** : États disabled et hover gérés automatiquement

## Notes importantes

- Les icônes SVG à l'intérieur d'un bouton sont **automatiquement redimensionnées**
- L'espace (gap) entre l'icône et le texte est **standardisé**
- Les états `:hover` et `:disabled` sont **automatiquement gérés**
- Pas besoin de spécifier `flex`, `items-center`, `justify-center` - tout est inclus dans `.btn-standard`

## Exemples complets

### Bouton d'export (comme dans l'image)
```jsx
<button className="btn-standard btn-md btn-primary">
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  <span>Exporter</span>
</button>
```

### Bouton "Nouvelle analyse"
```jsx
<button className="btn-standard btn-md btn-primary btn-full">
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
  <span>Nouvelle analyse</span>
</button>
```

### Bouton "Réinitialiser"
```jsx
<button className="btn-standard btn-sm btn-secondary">
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M6 18L18 6M6 6l12 12" />
  </svg>
  <span>Réinitialiser</span>
</button>
```

