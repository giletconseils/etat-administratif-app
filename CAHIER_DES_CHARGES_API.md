# 📋 Cahier des charges - Intégration API État Administratif

## 🎯 Vue d'ensemble

**Objectif** : Intégrer l'API de vérification d'état administratif des entreprises dans le système d'information existant pour automatiser la vérification des sous-traitants.

---

## 🔧 Architecture API

### **URL de base**
```
Production : https://etat-administratif-app.railway.app
Staging    : https://staging-etat-administratif-app.railway.app
Local      : http://localhost:3000
```

### **Endpoints disponibles**

#### 1. **API de vérification par SIRET**
```
POST https://etat-administratif-app.railway.app/api/check-siret/stream
```

**Payload :**
```json
{
  "sirets": ["38076713700017", "12345678901234"],
  "data": [
    {
      "siret": "38076713700017",
      "phone": "+33123456789"
    }
  ]
}
```

**Réponse :** Stream Server-Sent Events (SSE) avec :
- `progress` : Progression du traitement
- `result` : Résultat individuel par SIRET
- `complete` : Fin du traitement avec statistiques

#### 2. **API de jointure avec base sous-traitants**
```
POST https://etat-administratif-app.railway.app/api/join/simple-join
```

**Payload :**
```json
{
  "sirets": ["38076713700017"],
  "enabledStatuses": {
    "U4": true,
    "U3": true,
    "U2": false,
    "U1": true,
    "U1P": false,
    "TR": true
  },
  "csvData": "SIRET,Denomination\n38076713700017,ENTREPRISE TEST"
}
```

#### 3. **API de jointure par téléphone**
```
POST https://etat-administratif-app.railway.app/api/join/phone-join
```

**Payload :**
```json
{
  "phones": ["+33123456789", "0123456789"],
  "enabledStatuses": {
    "U4": true,
    "U3": true,
    "U2": false,
    "U1": true,
    "U1P": false,
    "TR": true
  }
}
```

#### 4. **API d'enrichissement BODACC**
```
POST https://etat-administratif-app.railway.app/api/enrich-bodacc
```

**Payload :**
```json
{
  "results": [
    {
      "siret": "38076713700017",
      "denomination": "ENTREPRISE TEST",
      "estRadiee": false
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "enrichedResults": [
    {
      "siret": "38076713700017",
      "denomination": "ENTREPRISE TEST",
      "estRadiee": false,
      "hasActiveProcedures": true,
      "procedure": "Sauvegarde",
      "procedureType": "Procédure de sauvegarde"
    }
  ],
  "stats": {
    "total": 1,
    "withProcedures": 1,
    "withActiveProcedures": 1,
    "errors": 0
  }
}
```

---

## 📊 Format des données

### **Structure de réponse standard**

```typescript
interface CompanyStatus {
  siret: string;                    // SIRET de l'entreprise
  denomination?: string;            // Nom de l'entreprise
  estRadiee: boolean;                  // true si radiée
  dateCessation?: string | null;   // Date de cessation (ISO)
  phone?: string;                   // Téléphone associé
  error?: string;                   // Message d'erreur si applicable
  
  // Données BODACC (procédures collectives)
  procedure?: string;               // Nom de la procédure
  procedureType?: string;           // Type de procédure
  hasActiveProcedures?: boolean;    // true si en procédure active
  bodaccError?: string;            // Erreur BODACC si applicable
}
```

### **Statistiques de traitement**

```typescript
interface ProcessingStats {
  total: number;                    // Nombre total d'entreprises analysées
  radiees: number;                  // Nombre d'entreprises radiées
  enProcedure: number;              // Nombre en procédure collective
  radieesOuEnProcedure: number;     // Nombre radiées OU en procédure
  actives: number;                  // Nombre d'entreprises actives
  errors: number;                   // Nombre d'erreurs
}
```

---

## ⚡ Contraintes techniques

### **1. Limites API INSEE**
- **Taux** : 30 requêtes/minute maximum
- **Délai** : 2 secondes entre chaque requête
- **Authentification** : Clé d'intégration requise
- **Timeout** : 60 secondes par requête

### **2. Limites API BODACC**
- **Taux** : 100 requêtes/minute maximum
- **Délai** : 600ms entre chaque requête
- **Authentification** : Clé API BODACC requise
- **Timeout** : 30 secondes par requête
- **Données** : Historique des 3 dernières années
- **Types de procédures** : Sauvegarde, Redressement, Liquidation

### **3. Gestion des volumes**
- **Petits volumes** (≤ 250 SIRETs) : Traitement automatique
- **Gros volumes** (> 250 SIRETs) : Découpage en chunks de 250
- **Streaming** : Résultats en temps réel via SSE
- **Heartbeat** : Toutes les 30 secondes pour maintenir la connexion

### **4. Gestion d'erreurs**
- **Retry automatique** : 3 tentatives avec backoff exponentiel
- **Erreurs consécutives** : Arrêt après 10 erreurs consécutives
- **Types d'erreurs** :
  - `NETWORK_ERROR` : Problème réseau
  - `QUOTA_EXCEEDED` : Limite API dépassée
  - `INVALID_SIRET` : SIRET invalide
  - `API_ERROR` : Erreur API INSEE
  - `BODACC_ERROR` : Erreur API BODACC

---

## 🔐 Configuration requise

### **Variables d'environnement**

```bash
# API INSEE (obligatoire)
INSEE_INTEGRATION_KEY=your-integration-key

# Base de données (optionnel pour enrichissement)
DATABASE_URL=postgresql://...

# BODACC API (optionnel mais recommandé)
BODACC_API_KEY=your-bodacc-key
BODACC_API_URL=https://api.bodacc.fr
```

### **Dépendances système**
- **Node.js** : ≥ 18.0.0
- **Next.js** : 15.5.5+
- **Runtime** : Node.js (serverless compatible)

---

## 🚀 Intégration recommandée

### **1. Architecture recommandée**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Votre SI      │───▶│   API Gateway    │───▶│  État Admin API │
│                 │    │   (Load Balancer)│    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Base de données│
                       │   (PostgreSQL)   │
                       └──────────────────┘
```

### **2. Patterns d'intégration**

#### **A. Intégration synchrone (petits volumes)**
```javascript
const response = await fetch('/api/check-siret/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sirets: ['38076713700017'] })
});

// Traitement du stream SSE
const reader = response.body.getReader();
// ... logique de traitement
```

#### **B. Intégration asynchrone (gros volumes)**
```javascript
// 1. Démarrer le traitement
const jobId = await startBatchProcessing(sirets);

// 2. Polling des résultats
const results = await pollResults(jobId);

// 3. Récupération des résultats finaux
const finalResults = await getFinalResults(jobId);
```

### **3. Gestion des chunks**

```javascript
// Découpage automatique en chunks
const chunks = createSiretChunks(sirets, 250);

// Traitement séquentiel des chunks
for (const chunk of chunks) {
  await processChunk(chunk);
  await delay(2000); // Respect du taux API
}
```

---

## 📈 Monitoring et observabilité

### **Métriques à surveiller**
- **Taux de succès** : % de requêtes réussies
- **Temps de traitement** : Durée moyenne par SIRET
- **Erreurs API** : Nombre et types d'erreurs
- **Utilisation quota** : Consommation API INSEE

### **Logs disponibles**
```javascript
// Logs de progression
console.log('[API] Stream route called');
console.log('[API] Received sirets:', sirets.length);
console.log('[API] Integration key exists:', !!integrationKey);

// Logs de traitement
console.log(`🔄 Traitement direct de ${cleaned.length} SIRETs`);
console.log(`✅ ${chunks.length} chunks créés de max 250 SIRETs`);

// Logs d'erreur
console.error('❌ Erreur INSEE:', error);
console.error('❌ Trop d\'erreurs consécutives');
```

---

## 🔄 Workflows d'intégration

### **Workflow 1 : Vérification ponctuelle**
1. **Input** : Liste de SIRETs à vérifier
2. **Traitement** : Appel API synchrone
3. **Output** : Résultats immédiats
4. **Usage** : Vérification manuelle, validation ponctuelle

### **Workflow 2 : Vérification en lot**
1. **Input** : Fichier CSV avec SIRETs
2. **Traitement** : Découpage en chunks + traitement asynchrone
3. **Output** : Fichier de résultats
4. **Usage** : Audit périodique, import en masse

### **Workflow 3 : Vérification continue**
1. **Input** : Stream de SIRETs (webhook, queue)
2. **Traitement** : Vérification en temps réel
3. **Output** : Notifications, alertes
4. **Usage** : Monitoring continu, alertes automatiques

---

## 🛡️ Sécurité et conformité

### **Authentification**
- **API Key** : Clé d'intégration INSEE requise
- **HTTPS** : Communication chiffrée obligatoire
- **Rate Limiting** : Respect des limites API

### **Données sensibles**
- **SIRETs** : Chiffrement en transit
- **Téléphones** : Anonymisation possible
- **Logs** : Pas de données personnelles

### **Conformité RGPD**
- **Minimisation** : Seules les données nécessaires
- **Rétention** : Pas de stockage permanent
- **Droit à l'oubli** : Suppression automatique

---

## 📋 Checklist d'intégration

### **Phase 1 : Préparation**
- [ ] Obtenir clé API INSEE
- [ ] Configurer environnement de test
- [ ] Tester avec échantillon de SIRETs
- [ ] Valider format des données

### **Phase 2 : Développement**
- [ ] Implémenter client API
- [ ] Gérer authentification
- [ ] Implémenter retry logic
- [ ] Tester gestion d'erreurs

### **Phase 3 : Tests**
- [ ] Tests unitaires
- [ ] Tests d'intégration
- [ ] Tests de charge
- [ ] Tests de récupération

### **Phase 4 : Déploiement**
- [ ] Configuration production
- [ ] Monitoring en place
- [ ] Documentation utilisateur
- [ ] Formation équipe

---

## 📞 Support et maintenance

### **Contact technique**
- **Documentation** : README.md du projet
- **Issues** : GitHub Issues
- **Support** : Contact développeur

### **Maintenance prévue**
- **Mise à jour API** : Suivi des évolutions INSEE
- **Monitoring** : Surveillance continue
- **Backup** : Sauvegarde configuration

---

## 📊 Exemples d'utilisation

### **Exemple 1 : Vérification simple**
```javascript
const sirets = ['38076713700017'];
const results = await checkSirets(sirets);
console.log(results); // [{ siret: '38076713700017', estRadiee: false, ... }]
```

### **Exemple 1bis : Appel direct API**
```javascript
const response = await fetch('https://etat-administratif-app.railway.app/api/check-siret/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sirets: ['38076713700017'] })
});
```

### **Exemple 2 : Vérification en lot**
```javascript
const sirets = ['38076713700017', '12345678901234', ...]; // 1000 SIRETs
const results = await checkSiretsBatch(sirets);
console.log(`Traités: ${results.length}, Radiées: ${results.filter(r => r.estRadiee).length}`);
```

### **Exemple 3 : Intégration avec base existante**
```javascript
const subcontractors = await getSubcontractorsFromDB();
const sirets = subcontractors.map(s => s.siret);
const results = await checkSirets(sirets);
await updateSubcontractorStatus(results);
```

### **Exemple 4 : Enrichissement BODACC**
```javascript
// 1. Vérification INSEE
const inseeResults = await checkSirets(['38076713700017']);

// 2. Enrichissement BODACC
const bodaccResults = await enrichBodacc(inseeResults);

// 3. Résultats complets
console.log(bodaccResults); // [{ siret: '38076713700017', hasActiveProcedures: true, procedure: 'Sauvegarde' }]
```

---

**Version** : 1.0  
**Date** : Décembre 2024  
**Auteur** : Équipe Développement
