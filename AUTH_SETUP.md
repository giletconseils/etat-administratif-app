# Configuration de l'authentification Magic Link

## 1. Configuration de Resend

1. Créez un compte sur [Resend](https://resend.com)
2. Vérifiez votre domaine d'envoi (ou utilisez le domaine de test)
3. Générez une clé API dans [API Keys](https://resend.com/api-keys)

## 2. Configuration des variables d'environnement

Créez un fichier `web/.env.local` avec les variables suivantes :

```env
# Resend API key for sending magic link emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# JWT Secret for signing tokens (generate a strong random string)
# You can generate one with: openssl rand -base64 32
JWT_SECRET=your-very-secure-secret-key-change-this-in-production

# Magic link expiry time (default: 15m)
MAGIC_LINK_EXPIRY=15m

# Application URL (used to generate magic links)
APP_URL=http://localhost:3000

# Node environment
NODE_ENV=development
```

### Générer un JWT_SECRET sécurisé

```bash
# macOS/Linux
openssl rand -base64 32

# Ou en Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 3. Configuration de la whitelist d'emails

Éditez le fichier `data/csv-files/config/authorized-emails.csv` pour ajouter les emails autorisés :

```csv
email,name
john.doe@example.com,John Doe
jane.smith@example.com,Jane Smith
```

## 4. Démarrage de l'application

```bash
cd web
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 5. Test de l'authentification

1. Accédez à http://localhost:3000
2. Vous serez redirigé vers `/login`
3. Entrez un email de la whitelist
4. Consultez votre boîte mail pour le lien de connexion
5. Cliquez sur le lien pour vous connecter

## 6. Production

Pour la production, assurez-vous de :

1. Utiliser un JWT_SECRET fort et unique
2. Configurer APP_URL avec votre domaine HTTPS
3. Vérifier votre domaine sur Resend
4. Activer HTTPS (les cookies secure sont activés automatiquement)

## Architecture de sécurité

### Magic Links
- Expiration : 15 minutes par défaut
- JWT signé avec secret fort
- Un seul usage (validation puis création de session)

### Sessions
- Durée : 7 jours
- Cookie httpOnly, secure (production), sameSite=lax
- JWT signé avec le même secret

### Rate Limiting
- Maximum 3 magic links par heure et par email
- Rate limiting en mémoire (utiliser Redis en production pour cluster)

### Whitelist
- Vérification stricte des emails autorisés
- Messages d'erreur génériques pour ne pas révéler les emails autorisés

## Fichiers créés

```
web/
├── src/
│   ├── lib/
│   │   ├── auth-utils.ts                           # Utilitaires auth
│   │   └── email-templates/
│   │       └── magic-link.tsx                      # Template email
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/
│   │   │       ├── send-magic-link/route.ts        # Envoi magic link
│   │   │       ├── verify-magic-link/route.ts      # Vérification token
│   │   │       ├── logout/route.ts                 # Déconnexion
│   │   │       └── check/route.ts                  # Vérification session
│   │   └── login/
│   │       ├── page.tsx                            # Page de connexion
│   │       └── verify/page.tsx                     # Page de vérification
│   ├── components/
│   │   └── LogoutButton.tsx                        # Bouton déconnexion
│   └── middleware.ts                               # Protection des routes
└── .env.local                                      # À créer (voir ci-dessus)

data/csv-files/config/
└── authorized-emails.csv                           # Whitelist emails
```

## Dépannage

### Erreur "Email invalide"
- Vérifiez que l'email est bien dans `authorized-emails.csv`
- Vérifiez qu'il n'y a pas d'espaces ou de caractères spéciaux

### Email non reçu
- Vérifiez votre clé API Resend
- Vérifiez les logs de l'API route
- Consultez le dashboard Resend pour voir le statut d'envoi
- Vérifiez votre dossier spam

### Token invalide ou expiré
- Le magic link expire après 15 minutes
- Chaque token ne peut être utilisé qu'une seule fois
- Demandez un nouveau lien de connexion

### Rate limiting
- Maximum 3 tentatives par heure et par email
- Attendez 1 heure ou redémarrez le serveur (rate limiting en mémoire)

