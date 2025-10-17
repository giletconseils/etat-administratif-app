# Railway Dockerfile - AUCUNE limite de temps !
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY web/package*.json ./
COPY web/ ./

# Installer les dépendances
RUN npm ci --only=production

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "run", "start"]
