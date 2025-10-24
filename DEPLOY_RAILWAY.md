# 🚂 Déploiement sur Railway - Guide Complet

## Prérequis

1. ✅ Code pushé sur GitHub (branche `main`)
2. ✅ Compte Resend créé avec clé API
3. ✅ Compte Railway : [railway.app](https://railway.app)

## 📝 Étape 1 : Préparer les variables d'environnement

### Générer un JWT_SECRET sécurisé

Exécutez cette commande localement et **copiez le résultat** :

```bash
openssl rand -base64 32
```

Résultat exemple : `kX7Hj9mP2wQ5vN8zL4yR6tU3bA1cD0eF9gH2jK4lM6nP8qR0s`

### Récupérer votre clé Resend

1. Allez sur [resend.com/api-keys](https://resend.com/api-keys)
2. Si vous n'avez pas encore créé de clé, cliquez sur "Create API Key"
3. Copiez la clé (commence par `re_...`)

## 🚀 Étape 2 : Créer le projet sur Railway

### 2.1 Déploiement initial

1. Connectez-vous à [railway.app](https://railway.app)
2. Cliquez sur "New Project"
3. Sélectionnez "Deploy from GitHub repo"
4. Choisissez le dépôt `etat-administratif-app`
5. Railway détectera automatiquement Next.js

### 2.2 Configuration du service

Railway va créer un service. Attendez que le premier déploiement se termine (il échouera probablement car les variables ne sont pas configurées - c'est normal).

## ⚙️ Étape 3 : Configurer les variables d'environnement

### 3.1 Accéder aux variables

1. Dans votre projet Railway, cliquez sur votre service
2. Allez dans l'onglet **"Variables"**
3. Cliquez sur **"+ New Variable"** pour chaque variable ci-dessous

### 3.2 Variables à ajouter

Ajoutez **TOUTES** ces variables (cliquez sur "+ New Variable" pour chaque) :

#### Variables obligatoires :

```
JWT_SECRET
```
**Valeur** : Le secret généré avec `openssl rand -base64 32` (étape 1)
**Important** : NE PAS inclure les guillemets, juste la valeur

```
RESEND_API_KEY
```
**Valeur** : Votre clé Resend (commence par `re_...`)

```
APP_URL
```
**Valeur** : `https://votre-app.railway.app` (remplacez par l'URL réelle de Railway)
**Note** : Railway vous donne une URL. Allez dans Settings → Domains pour la voir

```
NODE_ENV
```
**Valeur** : `production`

```
MAGIC_LINK_EXPIRY
```
**Valeur** : `15m`

#### Variables optionnelles :

```
EMAIL_FROM
```
**Valeur** : `Gilet Conseils <noreply@votre-domaine.fr>`
**Note** : Seulement si vous avez configuré un domaine vérifié sur Resend. Sinon, laisser vide (utilisera `onboarding@resend.dev`)

### 3.3 Obtenir l'URL de votre application

1. Dans Railway, allez dans **Settings** → **Domains**
2. Railway génère automatiquement un domaine : `xxx.railway.app`
3. Copiez cette URL
4. Retournez dans **Variables** et mettez à jour `APP_URL` avec cette valeur complète (avec `https://`)

Exemple :
```
APP_URL=https://etat-administratif-app-production.railway.app
```

## 🔄 Étape 4 : Redéployer

Une fois toutes les variables configurées :

1. Dans Railway, allez dans l'onglet **"Deployments"**
2. Cliquez sur le dernier déploiement
3. Cliquez sur **"Redeploy"** (ou attendez que Railway redéploie automatiquement)
4. Surveillez les logs pour vérifier qu'il n'y a pas d'erreurs

## ✅ Étape 5 : Vérifier le déploiement

### 5.1 Tester la redirection

1. Ouvrez votre URL Railway dans un navigateur
2. Vous devriez être **automatiquement redirigé** vers `/login`
3. Si oui : ✅ Le middleware fonctionne !

### 5.2 Tester l'authentification

1. Sur la page `/login`, entrez un email de la whitelist
   - Les emails autorisés sont dans : `data/csv-files/config/authorized-emails.csv`
2. Cliquez sur "Recevoir le lien"
3. Vérifiez votre boîte mail
4. Cliquez sur le magic link
5. Vous devriez être connecté et redirigé vers la page d'accueil

## 🐛 Dépannage

### Erreur "Service email non configuré"

➡️ **Solution** : Vérifiez que `RESEND_API_KEY` est bien configuré dans Railway

### Erreur "Service d'authentification non configuré"

➡️ **Solution** : Vérifiez que `JWT_SECRET` est bien configuré et n'est pas la valeur par défaut

### Erreur "Invalid token" ou liens qui ne fonctionnent pas

➡️ **Solutions possibles** :
- Vérifiez que `APP_URL` correspond exactement à votre domaine Railway (avec `https://`)
- Vérifiez que le domaine dans l'URL du magic link correspond à `APP_URL`
- Les magic links expirent après 15 minutes

### Email non reçu

➡️ **Solutions** :
1. Vérifiez vos spams
2. Dans Resend dashboard, allez dans [Logs](https://resend.com/logs) pour voir si l'email a été envoyé
3. Vérifiez que l'email est dans la whitelist (`authorized-emails.csv`)
4. Si vous utilisez un domaine personnalisé, vérifiez qu'il est bien vérifié sur Resend

### Voir les logs

Dans Railway :
1. Allez dans l'onglet **"Deployments"**
2. Cliquez sur le déploiement actif
3. Consultez les logs en temps réel

## 📊 Monitoring

### Vérifier les emails envoyés

1. Allez sur [resend.com/logs](https://resend.com/logs)
2. Vous verrez tous les emails envoyés avec leur statut

### Vérifier l'utilisation

- **Resend** : Plan gratuit = 3000 emails/mois
- **Railway** : Plan gratuit = 500h/mois, puis $5/mois

## 🔒 Sécurité en production

### ✅ Ce qui est déjà configuré :

- Cookies `httpOnly` ✅
- Cookies `secure` en production ✅
- Cookies `sameSite=lax` ✅
- JWT avec expiration ✅
- Rate limiting (3 tentatives/heure) ✅
- Whitelist d'emails ✅
- Middleware de protection des routes ✅

### 🔐 Recommandations supplémentaires :

1. **Sauvegardez votre JWT_SECRET** dans un gestionnaire de mots de passe
2. **Ne commitez JAMAIS** le fichier `.env.local` (déjà dans `.gitignore`)
3. **Utilisez HTTPS uniquement** (Railway le fait automatiquement)
4. **Configurez un domaine personnalisé** sur Railway pour une URL professionnelle

## 🎯 Checklist finale

Avant de considérer le déploiement comme réussi, vérifiez :

- [ ] Le site est accessible via l'URL Railway
- [ ] Redirection automatique vers `/login` fonctionne
- [ ] Formulaire de login s'affiche correctement
- [ ] Email reçu avec magic link
- [ ] Magic link fonctionne et connecte l'utilisateur
- [ ] Une fois connecté, accès à l'application OK
- [ ] Bouton de déconnexion visible dans le header
- [ ] Déconnexion fonctionne et redirige vers `/login`
- [ ] Email non autorisé = message générique (sécurité)

## 📞 Support

Si vous rencontrez des problèmes :

1. **Logs Railway** : Consultez les logs de déploiement
2. **Logs Resend** : [resend.com/logs](https://resend.com/logs)
3. **Vérifiez les variables** : Toutes les variables obligatoires sont présentes ?

## 🎉 C'est terminé !

Votre application est maintenant sécurisée par authentification magic link et déployée en production ! 🚀

