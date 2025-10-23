# 🌐 Documentation APIs Externes - INSEE SIRENE & BODACC

## 🎯 Vue d'ensemble

Ce document détaille l'utilisation des APIs externes utilisées par l'application État Administratif pour vérifier le statut des entreprises et leurs procédures collectives.

---

## 📊 API INSEE SIRENE V3

### **Informations générales**
- **Nom** : Service SIRENE de l'INSEE
- **Version** : V3 (dernière version)
- **Objectif** : Vérifier le statut administratif des entreprises françaises
- **Base URL** : `https://api.insee.fr`
- **Documentation** : [INSEE SIRENE V3](https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee)

### **Authentification**

#### **1. Obtenir les clés API**
1. Créer un compte sur [api.insee.fr](https://api.insee.fr)
2. Générer une application
3. Récupérer :
   - `SIRENE_KEY` (Consumer Key)
   - `SIRENE_SECRET` (Consumer Secret)

#### **2. Obtenir un token d'accès**
```bash
curl -X POST https://api.insee.fr/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id={SIRENE_KEY}&client_secret={SIRENE_SECRET}"
```

**Réponse :**
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### **Endpoints disponibles**

#### **Vérification par SIRET**
```bash
GET https://api.insee.fr/api-sirene/3.11/siret/{siret}
```

**Headers requis :**
```bash
Authorization: Bearer {access_token}
Accept: application/json
```

**Exemple de requête :**
```bash
curl -X GET "https://api.insee.fr/api-sirene/3.11/siret/38076713700017" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Accept: application/json"
```

### **Réponse INSEE SIRENE**

#### **Entreprise active**
```json
{
  "etablissement": {
    "siret": "38076713700017",
    "statutDiffusionEtablissement": "O",
    "dateCreationEtablissement": "2020-01-01",
    "trancheEffectifsEtablissement": "00",
    "dateDernierTraitementEtablissement": "2024-12-01T10:30:00",
    "etatAdministratifEtablissement": "A",
    "nomEtablissement": "ENTREPRISE TEST",
    "enseigne1Etablissement": "ET",
    "adresseEtablissement": {
      "numeroVoieEtablissement": "123",
      "typeVoieEtablissement": "RUE",
      "libelleVoieEtablissement": "DE LA PAIX",
      "codePostalEtablissement": "75001",
      "libelleCommuneEtablissement": "PARIS 1",
      "codeCommuneEtablissement": "75101"
    },
    "uniteLegale": {
      "etatAdministratifUniteLegale": "A",
      "denominationUniteLegale": "ENTREPRISE TEST",
      "categorieJuridiqueUniteLegale": "5710",
      "activitePrincipaleUniteLegale": "62.01Z",
      "nomenclatureActivitePrincipaleUniteLegale": "NAFRev2",
      "dateDebutActivite": "2020-01-01"
    }
  }
}
```

#### **Entreprise radiée**
```json
{
  "etablissement": {
    "siret": "38076713700017",
    "etatAdministratifEtablissement": "F",
    "dateDebutActivite": "2020-01-01",
    "dateDernierTraitementEtablissement": "2024-11-15T14:20:00",
    "uniteLegale": {
      "etatAdministratifUniteLegale": "C",
      "denominationUniteLegale": "ENTREPRISE RADIEE",
      "dateDebutActivite": "2020-01-01",
      "dateCessation": "2024-11-15"
    }
  }
}
```

### **Codes de statut**

| Code | Signification | Description |
|------|---------------|-------------|
| `A` | Actif | Entreprise en activité |
| `C` | Cessé | Entreprise radiée/cessée |
| `F` | Fermé | Établissement fermé |

### **Limites et contraintes**

#### **Rate Limiting**
- **Limite** : 30 requêtes/minute
- **Délai recommandé** : 2 secondes entre requêtes
- **Burst** : Pas de burst autorisé

#### **Quotas**
- **Gratuit** : 1000 requêtes/jour
- **Payant** : Selon abonnement
- **Reset** : Quotidien à minuit

#### **Timeouts**
- **Connexion** : 30 secondes
- **Lecture** : 60 secondes
- **Total** : 90 secondes maximum

### **Gestion d'erreurs**

#### **Erreurs courantes**
```json
// 401 - Non autorisé
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}

// 403 - Quota dépassé
{
  "error": "quota_exceeded",
  "error_description": "Daily quota exceeded"
}

// 404 - SIRET non trouvé
{
  "error": "not_found",
  "error_description": "SIRET not found"
}

// 429 - Rate limit dépassé
{
  "error": "rate_limit_exceeded",
  "error_description": "Too many requests"
}
```

#### **Codes HTTP**
- `200` : Succès
- `400` : Requête invalide
- `401` : Non autorisé
- `403` : Quota dépassé
- `404` : SIRET non trouvé
- `429` : Rate limit dépassé
- `500` : Erreur serveur

---

## 📋 API BODACC

### **Informations générales**
- **Nom** : Bulletin Officiel des Annonces Civiles et Commerciales
- **Objectif** : Vérifier les procédures collectives des entreprises
- **Base URL** : `https://api.bodacc.fr`
- **Documentation** : [BODACC API](https://api.bodacc.fr/documentation)

### **Authentification**

#### **1. Obtenir la clé API**
1. Créer un compte sur [api.bodacc.fr](https://api.bodacc.fr)
2. Générer une clé API
3. Récupérer : `BODACC_API_KEY`

#### **2. Utilisation de la clé**
```bash
curl -X GET "https://api.bodacc.fr/api/v1/procedures" \
  -H "Authorization: Bearer {BODACC_API_KEY}" \
  -H "Content-Type: application/json"
```

### **Endpoints disponibles**

#### **Recherche par SIREN**
```bash
GET https://api.bodacc.fr/api/v1/procedures?siren={siren}
```

**Paramètres :**
- `siren` : Numéro SIREN (9 chiffres)
- `date_debut` : Date de début (optionnel)
- `date_fin` : Date de fin (optionnel)
- `type` : Type de procédure (optionnel)

**Exemple de requête :**
```bash
curl -X GET "https://api.bodacc.fr/api/v1/procedures?siren=380767137" \
  -H "Authorization: Bearer {BODACC_API_KEY}" \
  -H "Content-Type: application/json"
```

### **Réponse BODACC**

#### **Entreprise avec procédures**
```json
{
  "procedures": [
    {
      "id": "12345678",
      "siren": "380767137",
      "type": "Sauvegarde",
      "dateOuverture": "2024-01-15",
      "dateCloture": null,
      "statut": "En cours",
      "tribunal": "Tribunal de commerce de Paris",
      "adresse": "123 RUE DE LA PAIX, 75001 PARIS",
      "montantCreance": 50000.00,
      "devise": "EUR",
      "observations": "Procédure de sauvegarde ouverte"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### **Entreprise sans procédures**
```json
{
  "procedures": [],
  "total": 0,
  "page": 1,
  "limit": 10
}
```

### **Types de procédures**

| Type | Code | Description |
|------|------|-------------|
| Sauvegarde | `SAUVEGARDE` | Procédure de sauvegarde |
| Redressement | `REDRESSEMENT` | Procédure de redressement judiciaire |
| Liquidation | `LIQUIDATION` | Procédure de liquidation judiciaire |
| Plan de continuation | `PLAN_CONTINUATION` | Plan de continuation |

### **Statuts des procédures**

| Statut | Description |
|--------|-------------|
| `En cours` | Procédure active |
| `Clôturée` | Procédure terminée |
| `Suspendue` | Procédure suspendue |

### **Limites et contraintes**

#### **Rate Limiting**
- **Limite** : 100 requêtes/minute
- **Délai recommandé** : 600ms entre requêtes
- **Burst** : 10 requêtes simultanées max

#### **Quotas**
- **Gratuit** : 100 requêtes/jour
- **Payant** : Selon abonnement
- **Reset** : Quotidien à minuit

#### **Timeouts**
- **Connexion** : 15 secondes
- **Lecture** : 30 secondes
- **Total** : 45 secondes maximum

### **Gestion d'erreurs**

#### **Erreurs courantes**
```json
// 401 - Non autorisé
{
  "error": "unauthorized",
  "message": "Invalid API key"
}

// 403 - Quota dépassé
{
  "error": "quota_exceeded",
  "message": "Daily quota exceeded"
}

// 404 - SIREN non trouvé
{
  "error": "not_found",
  "message": "SIREN not found"
}

// 429 - Rate limit dépassé
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests"
}
```

---

## 🔧 Intégration technique

### **Configuration des variables d'environnement**

```bash
# INSEE SIRENE
SIRENE_KEY=your-sirene-consumer-key
SIRENE_SECRET=your-sirene-consumer-secret

# BODACC
BODACC_API_KEY=your-bodacc-api-key
BODACC_API_URL=https://api.bodacc.fr

# URLs de base
INSEE_BASE_URL=https://api.insee.fr
INSEE_TOKEN_URL=https://api.insee.fr/token
INSEE_SIRET_URL=https://api.insee.fr/api-sirene/3.11/siret
```

### **Exemple d'intégration complète**

```javascript
// 1. Vérification INSEE
const inseeResponse = await fetch(`https://api.insee.fr/api-sirene/3.11/siret/${siret}`, {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Accept': 'application/json'
  }
});

// 2. Vérification BODACC
const siren = siret.substring(0, 9);
const bodaccResponse = await fetch(`https://api.bodacc.fr/api/v1/procedures?siren=${siren}`, {
  headers: {
    'Authorization': `Bearer ${bodaccApiKey}`,
    'Content-Type': 'application/json'
  }
});

// 3. Traitement des résultats
const inseeData = await inseeResponse.json();
const bodaccData = await bodaccResponse.json();

const result = {
  siret: siret,
  estRadiee: inseeData.etablissement.etatAdministratifEtablissement === 'F',
  hasActiveProcedures: bodaccData.procedures.length > 0,
  procedures: bodaccData.procedures
};
```

### **Gestion des erreurs**

```javascript
async function checkCompanyWithRetry(siret, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await checkCompany(siret);
      return result;
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Backoff exponentiel
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### **Monitoring et observabilité**

#### **Métriques à surveiller**
- **Taux de succès** : % de requêtes réussies
- **Temps de réponse** : Latence moyenne
- **Erreurs** : Nombre et types d'erreurs
- **Quotas** : Utilisation des quotas quotidiens

#### **Logs recommandés**
```javascript
console.log(`[INSEE] SIRET: ${siret}, Status: ${status}, Time: ${responseTime}ms`);
console.log(`[BODACC] SIREN: ${siren}, Procedures: ${procedures.length}, Time: ${responseTime}ms`);
console.error(`[ERROR] API: ${api}, Error: ${error.message}, Retry: ${attempt}/${maxRetries}`);
```

---

## 📞 Support et ressources

### **Documentation officielle**
- **INSEE SIRENE** : [api.insee.fr](https://api.insee.fr)
- **BODACC** : [api.bodacc.fr](https://api.bodacc.fr)

### **Support technique**
- **INSEE** : support@insee.fr
- **BODACC** : support@bodacc.fr

### **Communautés**
- **Stack Overflow** : Tags `insee-sirene`, `bodacc`
- **GitHub** : Exemples d'intégration

---

**Version** : 1.0  
**Date** : Décembre 2024  
**Auteur** : Équipe Développement
