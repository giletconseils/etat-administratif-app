# Mise à jour - Sélection exclusive des traitements incompatibles

## 🎯 Changement implémenté

Les traitements incompatibles (comme "radiation-check" et "ri-anomalies") **se désélectionnent automatiquement** l'un l'autre lors de la sélection.

## ✨ Comportement

### Avant
- L'utilisateur pouvait sélectionner les deux traitements incompatibles
- Un message d'avertissement jaune s'affichait
- L'utilisateur devait manuellement désélectionner un traitement

### Après
- Quand l'utilisateur sélectionne "radiation-check" → "ri-anomalies" est **automatiquement désélectionné**
- Quand l'utilisateur sélectionne "ri-anomalies" → "radiation-check" est **automatiquement désélectionné**
- Plus de message d'avertissement (pas nécessaire)
- Expérience utilisateur plus fluide et intuitive

## 🔧 Implémentation technique

### Fichier modifié
- `web/src/components/TreatmentSelector.tsx`

### Logique implémentée

```typescript
const handleTreatmentToggle = (treatmentId: TreatmentType) => {
  // ...validations...
  
  if (!isSelected) {
    // Lors de l'ajout d'un traitement :
    
    // 1. Supprimer tous les traitements incompatibles avec le nouveau
    newSelection = newSelection.filter(t => !treatment.incompatibleWith?.includes(t));
    
    // 2. Supprimer tous les traitements qui considèrent le nouveau comme incompatible
    newSelection = newSelection.filter(t => {
      const selectedTreatment = allTreatments.find(tr => tr.id === t);
      return !selectedTreatment?.incompatibleWith?.includes(treatmentId);
    });
    
    // 3. Ajouter le nouveau traitement
    newSelection.push(treatmentId);
  }
}
```

### Nettoyage effectué
- ✅ Suppression du state `incompatibilityWarning`
- ✅ Suppression du `useEffect` de vérification de compatibilité
- ✅ Suppression de l'UI du message d'avertissement jaune
- ✅ Suppression de l'import inutilisé `areTreatmentsCompatible`
- ✅ Code simplifié et plus maintenable

## 📋 Scénarios testés

### Scénario 1 : Radiation-check → RI Anomalies
1. "radiation-check" est sélectionné par défaut
2. L'utilisateur clique sur "ri-anomalies"
3. **Résultat** : "radiation-check" est désélectionné, "ri-anomalies" est sélectionné

### Scénario 2 : RI Anomalies → Radiation-check
1. "ri-anomalies" est sélectionné
2. L'utilisateur clique sur "radiation-check"
3. **Résultat** : "ri-anomalies" est désélectionné, "radiation-check" est sélectionné

### Scénario 3 : Désélection
1. Un traitement est sélectionné
2. L'utilisateur clique à nouveau dessus
3. **Résultat** : Le traitement est désélectionné normalement

## 💡 Avantages

1. **UX améliorée** : Comportement intuitif, pas besoin de désélectionner manuellement
2. **Moins de confusion** : Pas de warning à interpréter
3. **Code plus propre** : Moins de logique, moins de state
4. **Cohérent** : Correspond au comportement habituel des boutons radio exclusifs

## 🔮 Extensibilité

Si à l'avenir d'autres traitements incompatibles sont ajoutés, la logique s'appliquera automatiquement grâce à la propriété `incompatibleWith` dans le registry.

Exemple pour ajouter un nouveau traitement incompatible :

```typescript
// web/src/lib/treatments/registry.ts
'nouveau-traitement': {
  id: 'nouveau-traitement',
  name: 'Nouveau traitement',
  description: '...',
  enabled: true,
  incompatibleWith: ['radiation-check', 'ri-anomalies'], // Auto-désélection
}
```

## ✅ Status

- ✅ Implémenté
- ✅ Testé (pas d'erreurs de linter)
- ✅ Prêt pour utilisation

L'expérience utilisateur est maintenant plus fluide et intuitive !

