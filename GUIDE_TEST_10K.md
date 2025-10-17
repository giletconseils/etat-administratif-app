# 🚀 Guide de Test avec 10 000 Entreprises sur Railway

## ✅ Déploiement Railway Réussi !

Votre application est maintenant déployée sur Railway avec **AUCUNE limite de temps** ! 🎉

## 📊 Test avec 10 000 Entreprises

### 🎯 **Performances Attendues**

Avec la configuration actuelle :
- **Batch size** : 30 SIRETs par lot
- **Pause entre lots** : 60 secondes
- **Temps estimé** : ~6-8 heures pour 10 000 entreprises

**Calcul :**
```
10 000 SIRETs ÷ 30 par lot = 334 lots
334 lots × 60s de pause = 20 040 secondes = ~5h 34min
+ Temps de traitement API (~2-3h)
= Total : ~6-8 heures
```

### 📝 **Comment Tester**

1. **Préparez votre fichier CSV** avec 10 000 SIRETs
   ```csv
   siret,nom,montant
   12345678901234,Entreprise A,1000
   98765432109876,Entreprise B,2000
   ...
   ```

2. **Uploadez le fichier** sur votre app Railway

3. **Sélectionnez votre clé API INSEE** (OAuth2 ou Integration Key)

4. **Lancez le scan** et laissez tourner

5. **Surveillez les logs** dans Railway Dashboard
   - Nombre de lots traités
   - Erreurs éventuelles
   - Progression en temps réel

### 🔍 **Surveillance en Temps Réel**

Dans Railway Dashboard, vous verrez :
```
📦 Lot 1/334: SIRETs 1-30 (30 SIRETs)
⏸️  Pause de 60s entre les lots...
📦 Lot 2/334: SIRETs 31-60 (30 SIRETs)
...
```

### ⚠️ **Si Erreurs API**

L'application gère automatiquement :
- **3 tentatives** pour chaque SIRET en erreur réseau
- **Backoff exponentiel** : 2s, 4s, 8s entre tentatives
- **10 erreurs consécutives max** avant arrêt de sécurité

Si vous voyez "Trop d'erreurs consécutives", vérifiez :
1. **Quota API INSEE** : Limite quotidienne atteinte ?
2. **Clé API valide** : Expire dans combien de temps ?
3. **Réseau Railway** : Problème temporaire ?

### 🎯 **Optimisations Possibles**

Si vous voulez aller plus vite (mais risque quota API) :

**Option 1 : Batches plus rapides**
```typescript
// dans stream/route.ts
const BATCH_SIZE = 50; // Au lieu de 30
const PAUSE_BETWEEN_BATCHES = 30000; // 30s au lieu de 60s
```
⚠️ Risque : Plus de chances de dépasser le quota API

**Option 2 : Mode parallèle** (pour les très gros volumes)
- Lancer 2-3 instances Railway en parallèle
- Diviser votre fichier en chunks
- Fusionner les résultats ensuite

### 📈 **Résultats Attendus**

À la fin du traitement :
- ✅ **Fichier CSV enrichi** avec statut de radiation
- ✅ **Statistiques détaillées** : Radiées, Actives, Erreurs
- ✅ **Export téléchargeable** directement depuis l'interface

### 🚨 **Limites à Connaître**

- **Quota API INSEE** : Vérifiez votre limite quotidienne
- **Stockage Railway** : Fichiers temporaires nettoyés automatiquement
- **Mémoire** : Railway alloue automatiquement selon besoin

## 🎉 **C'est Parti !**

Votre application Railway est prête à traiter des dizaines de milliers d'entreprises sans limite de temps !

**Prochaines étapes :**
1. ✅ Redéployez sur Railway (erreurs ESLint corrigées)
2. ✅ Testez avec un petit fichier (100 SIRETs) pour valider
3. ✅ Lancez votre scan de 10 000 entreprises !
4. ✅ Surveillez les logs Railway
5. ✅ Récupérez vos résultats enrichis

---

**🚀 Railway = AUCUNE LIMITE DE TEMPS = LIBERTÉ TOTALE !** 🎯

