# 🧪 Guide de Test Rapide - Correction HTTP/2

## 🎯 Objectif
Tester rapidement la correction de l'erreur `ERR_HTTP2_PROTOCOL_ERROR` sans attendre 15 minutes.

## 🚀 Solutions Implémentées

### 1. **Corrections HTTP/2**
- ✅ Réduction de la taille des lots : `50 → 25` SIRETs
- ✅ Augmentation des pauses : `30s → 45s` entre lots
- ✅ Reset de connexion après `150` requêtes (au lieu de 300)
- ✅ Heartbeat plus fréquent : `60s → 30s`
- ✅ Mécanisme de retry avec backoff exponentiel

### 2. **Mode Test Rapide**
- ✅ API `/api/test-stream` pour tests rapides
- ✅ Interface utilisateur avec boutons "Test 25 SIRETs" et "Test 100 SIRETs"
- ✅ Script de test en ligne de commande

## 🧪 Comment Tester

### Option 1 : Interface Web (Recommandé)
1. **Déployez** les modifications sur Railway
2. **Ouvrez** l'application dans votre navigateur
3. **Cliquez** sur "🧪 Test 25 SIRETs" (2-3 minutes)
4. **Observez** si l'erreur HTTP/2 apparaît
5. Si OK, testez "🧪 Test 100 SIRETs" (5-7 minutes)

### Option 2 : Script en Ligne de Commande
```bash
# Test local (25 SIRETs)
node test-http2-fix.js http://localhost:3000 25

# Test production (25 SIRETs)
node test-http2-fix.js https://etat-administratif-app-production.up.railway.app 25

# Test production (100 SIRETs)
node test-http2-fix.js https://etat-administratif-app-production.up.railway.app 100
```

## 📊 Critères de Succès

### ✅ **Test Réussi**
- Aucune erreur `ERR_HTTP2_PROTOCOL_ERROR`
- Tous les SIRETs traités avec succès
- Temps d'exécution raisonnable (< 10 minutes pour 100 SIRETs)

### ❌ **Test Échoué**
- Erreur HTTP/2 après ~150 requêtes
- Timeout ou crash de l'application
- Taux d'erreur > 10%

## 🔧 Paramètres de Test

### Mode Test (Optimisé)
```javascript
BATCH_SIZE = 10              // Petits lots
PAUSE_BETWEEN_BATCHES = 5s   // Pauses courtes
CONNECTION_RESET_AFTER = 30   // Reset fréquent
MAX_RETRIES = 2              // Moins de retries
```

### Mode Production (Robuste)
```javascript
BATCH_SIZE = 25              // Lots moyens
PAUSE_BETWEEN_BATCHES = 45s  // Pauses longues
CONNECTION_RESET_AFTER = 150  // Reset modéré
MAX_RETRIES = 3              // Retries complets
```

## 🚨 Dépannage

### Si l'erreur persiste :
1. **Vérifiez** les logs Railway pour les erreurs HTTP/2
2. **Augmentez** `PAUSE_BETWEEN_BATCHES` à 60s
3. **Réduisez** `BATCH_SIZE` à 15
4. **Diminuez** `CONNECTION_RESET_AFTER` à 100

### Si le test est trop lent :
1. **Réduisez** `PAUSE_BETWEEN_BATCHES` à 30s
2. **Augmentez** `BATCH_SIZE` à 35
3. **Augmentez** `CONNECTION_RESET_AFTER` à 200

## 📈 Monitoring

### Logs à Surveiller
```bash
# Railway logs
railway logs --follow

# Rechercher ces messages
grep "Reset connexion HTTP/2" logs
grep "ERR_HTTP2_PROTOCOL_ERROR" logs
grep "Retry" logs
```

### Métriques Importantes
- **Temps par lot** : < 2 minutes
- **Erreurs consécutives** : < 5
- **Taux de succès** : > 95%
- **Temps total** : < 10 minutes pour 100 SIRETs

## 🎯 Plan de Test Recommandé

1. **Test 25 SIRETs** (2-3 min) → Validation rapide
2. **Test 100 SIRETs** (5-7 min) → Validation robuste
3. **Test 500 SIRETs** (15-20 min) → Test de charge
4. **Test complet** (base sous-traitants) → Validation finale

## 🔄 Rollback

Si les corrections ne fonctionnent pas :
```bash
# Revenir aux paramètres précédents
git revert HEAD
git push origin main
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs Railway
2. Testez avec le script en ligne de commande
3. Ajustez les paramètres selon le guide
4. Contactez l'équipe de développement
