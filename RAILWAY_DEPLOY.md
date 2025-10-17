# 🚀 Déploiement Railway - Guide étape par étape

## 🎯 Objectif
Déployer l'app sur Railway pour traiter 10 000 entreprises SANS limite de temps !

## 📋 Étapes de déploiement

### 1. Créer compte Railway (2 minutes)
```bash
# Aller sur https://railway.app
# Cliquer "Sign up with GitHub"
# Autoriser Railway à accéder à vos repos
```

### 2. Créer nouveau projet (1 minute)
```bash
# Dans Railway dashboard
# Cliquer "New Project"
# Sélectionner "Deploy from GitHub repo"
# Choisir votre repo: giletconseils/etat-administratif-app
```

### 3. Configurer les variables d'environnement (2 minutes)
```bash
# Dans votre projet Railway
# Aller dans "Variables" tab
# Ajouter ces variables :

SIRENE_KEY=votre_consumer_key_ici
SIRENE_SECRET=votre_consumer_secret_ici
INSEE_INTEGRATION_KEY=d425454d-9a00-403d-a545-4d9a00603df7
NODE_ENV=production
```

### 4. Déploiement automatique (2 minutes)
```bash
# Railway détecte automatiquement Next.js
# Déploie depuis le dossier /web
# URL générée automatiquement
# Exemple: https://etat-administratif-app-production.up.railway.app
```

### 5. Test avec 10 000 entreprises
```bash
# Aller sur votre URL Railway
# Lancer le scan complet
# AUCUNE limite de temps !
# Traitement en 6-8 heures sans interruption
```

## 🎉 Résultat

✅ **AUCUNE limite** de temps  
✅ **$5/mois** au lieu de $20 Vercel Pro  
✅ **10 000 entreprises** en un seul traitement  
✅ **6-8 heures** de traitement continu  

## 🔧 Configuration Railway

### Variables d'environnement requises :
- `SIRENE_KEY` : Votre clé INSEE
- `SIRENE_SECRET` : Votre secret INSEE  
- `INSEE_INTEGRATION_KEY` : Votre clé d'intégration
- `NODE_ENV=production`

### Port automatique :
Railway détecte automatiquement le port 3000 de Next.js.

## 📊 Comparaison

| Plateforme | Limite | Coût | 10k entreprises |
|------------|--------|------|-----------------|
| Vercel Hobby | 5min | Gratuit | ❌ Impossible |
| Vercel Pro | 15min | $20/mois | ❌ 50 chunks |
| **Railway** | **Illimité** | **$5/mois** | **✅ Direct** |

## 🚀 Action immédiate

1. **Aller sur railway.app** (maintenant)
2. **Connecter votre repo** (1min)
3. **Configurer variables** (2min)
4. **Déployer** (2min)
5. **Tester 10k** (6-8h)

**Total setup : 5 minutes pour traiter 10 000 entreprises !**
