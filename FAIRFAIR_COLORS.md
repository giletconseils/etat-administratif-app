# Couleurs FairFair - Guide d'utilisation

Ce document décrit comment utiliser les couleurs de la marque FairFair dans l'application.

## 🎨 Palette de couleurs

Les couleurs FairFair sont maintenant disponibles en tant que variables CSS et classes Tailwind dans toute l'application.

### Couleurs principales

| Couleur | Hex | Variable CSS | Tailwind |
|---------|-----|--------------|----------|
| **Bleu principal** | `#00A7E1` | `var(--fairfair-blue)` | `bg-fairfair-blue` / `text-fairfair-blue` |
| **Bleu hover** | `#0090C4` | `var(--fairfair-blue-hover)` | `bg-fairfair-blue-hover` / `hover:bg-fairfair-blue-hover` |
| **Bleu foncé** | `#007BA8` | `var(--fairfair-blue-dark)` | `bg-fairfair-blue-dark` |
| **Orange** | `#F47920` | `var(--fairfair-orange)` | `bg-fairfair-orange` / `text-fairfair-orange` |
| **Rose** | `#E94CA6` | `var(--fairfair-pink)` | `bg-fairfair-pink` / `text-fairfair-pink` |
| **Vert** | `#8DC63F` | `var(--fairfair-green)` | `bg-fairfair-green` / `text-fairfair-green` |

## 📝 Utilisation

### 1. Avec Tailwind CSS (Recommandé)

```tsx
// Bouton avec le bleu FairFair
<button className="bg-fairfair-blue hover:bg-fairfair-blue-hover text-white">
  Cliquer ici
</button>

// Texte avec couleur FairFair
<p className="text-fairfair-orange">Texte en orange FairFair</p>

// Background avec opacité
<div className="bg-fairfair-blue/20">
  Fond bleu avec 20% d'opacité
</div>

// Bordure
<div className="border-2 border-fairfair-green">
  Bordure verte FairFair
</div>
```

### 2. Avec les variables CSS

```tsx
// Dans un style inline
<button style={{ backgroundColor: 'var(--fairfair-blue)' }}>
  Bouton bleu
</button>

// Dans un fichier CSS
.mon-bouton {
  background-color: var(--fairfair-blue);
}

.mon-bouton:hover {
  background-color: var(--fairfair-blue-hover);
}
```

### 3. Classe de bouton pré-stylée

Une classe `.btn-fairfair-primary` est disponible pour les boutons principaux :

```tsx
<button className="btn-fairfair-primary px-4 py-2 rounded-lg">
  Bouton FairFair
</button>
```

Cette classe applique automatiquement :
- Le fond bleu FairFair
- Le texte blanc
- L'effet hover avec le bleu hover
- L'effet active avec le bleu foncé
- Les transitions fluides

## 🎯 Exemples d'utilisation

### Bouton principal d'action

```tsx
<button className="bg-fairfair-blue hover:bg-fairfair-blue-hover text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200">
  Se connecter
</button>
```

### Badge ou tag

```tsx
<span className="inline-flex items-center px-3 py-1 rounded-full bg-fairfair-orange/20 text-fairfair-orange border border-fairfair-orange/30">
  Nouveau
</span>
```

### Gradient avec les couleurs FairFair

```tsx
<div className="bg-gradient-to-r from-fairfair-blue to-fairfair-pink p-6 rounded-lg">
  Contenu avec gradient
</div>
```

### Orbe animé (comme sur la page de login)

```tsx
<div className="absolute w-[500px] h-[500px] bg-gradient-to-br from-fairfair-blue/25 via-fairfair-blue/15 to-transparent rounded-full blur-[100px]">
</div>
```

## 🔄 Migration du code existant

Pour migrer les boutons existants vers les couleurs FairFair :

**Avant :**
```tsx
<button className="bg-blue-600 hover:bg-blue-700">
  Bouton
</button>
```

**Après :**
```tsx
<button className="bg-fairfair-blue hover:bg-fairfair-blue-hover">
  Bouton
</button>
```

## 📦 Fichiers concernés

- **Variables CSS** : `web/src/app/globals.css` (lignes 25-31)
- **Configuration Tailwind** : `web/tailwind.config.ts` (lignes 50-60)
- **Classes de boutons** : `web/src/app/globals.css` (lignes 170-186)

## 🎨 Cohérence visuelle

Pour maintenir la cohérence de la marque FairFair :

1. **Utilisez le bleu FairFair** pour tous les boutons d'action principaux (CTA)
2. **Utilisez l'orange** pour les éléments d'alerte ou d'importance
3. **Utilisez le rose** pour les accents secondaires
4. **Utilisez le vert** pour les confirmations et succès

## ⚠️ Important

- Ne codez plus les couleurs en dur (`#00A7E1`) - utilisez toujours les variables ou classes Tailwind
- Cela permet de maintenir la cohérence et facilite les changements futurs
- Les classes Tailwind bénéficient du tree-shaking pour optimiser la taille du bundle

