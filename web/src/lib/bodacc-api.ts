// Service pour interroger l'API BODACC et récupérer les informations de procédure
// Basé sur l'API officielle BODACC via OpenDataSoft

export type BodaccProcedureType = 
  | 'REDRESSEMENT_JUDICIAIRE'
  | 'LIQUIDATION_JUDICIAIRE' 
  | 'SAUVEGARDE'
  | 'CONCORDAT'
  | 'PLAN_DE_REDRESSEMENT'
  | 'LIQUIDATION_AMINABLE'
  | 'AUTRE';

export interface BodaccAnnouncement {
  dateparution: string;
  numeroannonce: string;
  numerojo: string;
  registre: string[]; // SIREN sous forme de tableau
  nom: string;
  typeavis: string;
  typeavis_lib: string;
  familleavis: string;
  texte: string;
  region: string;
  departement: string;
  tribunal: string;
  jugement?: string; // Chaîne JSON à parser
  [key: string]: unknown;
}

export interface BodaccProcedure {
  type: BodaccProcedureType;
  name: string;
  dateDebut?: string;
  dateFin?: string;
  tribunal?: string;
  status: 'EN_COURS' | 'TERMINEE';
  typeavis?: string;
  typeavis_lib?: string;
  dateparution?: string;
}

export interface BodaccResult {
  siren: string;
  procedures: BodaccProcedure[];
  hasProcedures: boolean;
  hasActiveProcedures: boolean;
  lastUpdate?: string;
  error?: string;
}

// Configuration de l'API BODACC officielle
const BODACC_BASE_URL_V2 = 'https://www.bodacc.fr/api/explore/v2.1/catalog/datasets/annonces-commerciales/records';
const BODACC_BASE_URL_V1 = 'https://www.bodacc.fr/api/records/1.0/search/';

// Cache pour éviter les requêtes répétées
const bodaccCache = new Map<string, { result: BodaccResult; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures

// Fonction pour nettoyer et extraire le SIREN d'un SIRET
export function extractSirenFromSiret(siret: string): string {
  const cleaned = siret.replace(/[^0-9]/g, '').trim();
  return cleaned.length >= 9 ? cleaned.substring(0, 9) : cleaned;
}

// Fonction pour déterminer le type de procédure à partir du typeavis_lib
function detectProcedureType(typeavis_lib: string): BodaccProcedureType {
  const text = typeavis_lib.toLowerCase();
  
  if (text.includes('redressement judiciaire') || text.includes('jugement d\'ouverture de redressement judiciaire')) {
    return 'REDRESSEMENT_JUDICIAIRE';
  }
  if (text.includes('liquidation judiciaire') || text.includes('jugement d\'ouverture de liquidation judiciaire')) {
    return 'LIQUIDATION_JUDICIAIRE';
  }
  if (text.includes('sauvegarde') || text.includes('procédure de sauvegarde')) {
    return 'SAUVEGARDE';
  }
  if (text.includes('concordat')) {
    return 'CONCORDAT';
  }
  if (text.includes('plan de redressement')) {
    return 'PLAN_DE_REDRESSEMENT';
  }
  if (text.includes('liquidation amiable')) {
    return 'LIQUIDATION_AMINABLE';
  }
  
  return 'AUTRE';
}

// Fonction pour déterminer le statut de la procédure selon les règles BODACC
function detectProcedureStatus(typeavis_lib: string): 'EN_COURS' | 'TERMINEE' {
  const text = typeavis_lib.toLowerCase();
  
  // Clôture = procédure terminée
  if (text.includes('clôture') || 
      text.includes('cloture') || 
      text.includes('jugement de clôture') ||
      text.includes('clôture pour insuffisance d\'actif') ||
      text.includes('cloture pour insuffisance d\'actif')) {
    return 'TERMINEE';
  }
  
  // Ouverture/Évolution/Conversion = procédure en cours
  if (text.includes('ouverture') || 
      text.includes('jugement d\'ouverture') ||
      text.includes('redressement judiciaire') ||
      text.includes('liquidation judiciaire') ||
      text.includes('sauvegarde') ||
      text.includes('évolution') ||
      text.includes('conversion')) {
    return 'EN_COURS';
  }
  
  // Par défaut, on considère que la procédure est en cours
  return 'EN_COURS';
}

// Fonction pour déterminer si une procédure est active selon les règles BODACC
function isProcedureActive(typeavis_lib: string): boolean {
  const status = detectProcedureStatus(typeavis_lib);
  return status === 'EN_COURS';
}

// Fonction pour récupérer les procédures BODACC pour un SIREN
export async function fetchBodaccProcedures(siren: string): Promise<BodaccResult> {
  // Vérifier le cache
  const cached = bodaccCache.get(siren);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.result;
  }

  try {
    // Utiliser l'API v2.1 BODACC selon les spécifications
    // Filtre: SIREN + procédures collectives + plus récent
    const params = new URLSearchParams({
      where: `registre='${siren}' AND familleavis='collective'`,
      order_by: 'dateparution DESC',
      limit: '1' // On récupère seulement le dernier avis pour déterminer l'état récent
    });

    const url = `${BODACC_BASE_URL_V2}?${params.toString()}`;
    
    console.log(`[BODACC API] Fetching data for SIREN ${siren}: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Etat-Administratif-App/1.0'
      },
      cache: 'no-store'
    });

    console.log(`[BODACC API] Response status for SIREN ${siren}: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`[BODACC API] Error for SIREN ${siren}: ${response.status} ${response.statusText}`);
      return {
        siren,
        procedures: [],
        hasProcedures: false,
        hasActiveProcedures: false,
        error: `HTTP_${response.status}`
      };
    }

    const data = await response.json() as {
      results?: Array<BodaccAnnouncement>;
      total_count?: number;
    };


    // Si aucun enregistrement → pas de procédure
    if (!data.results || data.results.length === 0) {
      const result: BodaccResult = {
        siren,
        procedures: [],
        hasProcedures: false,
        hasActiveProcedures: false,
        lastUpdate: new Date().toISOString()
      };
      
      // Mettre en cache le résultat vide
      bodaccCache.set(siren, { result, timestamp: Date.now() });
      return result;
    }

    // Traiter le dernier avis (le plus récent)
    const latestAnnouncement = data.results[0];
    if (!latestAnnouncement) {
      const result: BodaccResult = {
        siren,
        procedures: [],
        hasProcedures: false,
        hasActiveProcedures: false,
        lastUpdate: new Date().toISOString()
      };
      
      bodaccCache.set(siren, { result, timestamp: Date.now() });
      return result;
    }

    // Déterminer le type et le statut selon les règles BODACC
    // Parser le champ jugement s'il existe
    let jugementNature = '';
    let jugementFamille = '';
    
    if (latestAnnouncement.jugement && typeof latestAnnouncement.jugement === 'string') {
      try {
        const jugementParsed = JSON.parse(latestAnnouncement.jugement);
        jugementNature = jugementParsed.nature || '';
        jugementFamille = jugementParsed.famille || '';
      } catch (error) {
        console.warn(`Failed to parse jugement for SIREN ${siren}:`, error);
      }
    }
    
    // Priorité: jugement.nature > jugement.famille > typeavis_lib
    const procedureText = jugementNature || jugementFamille || latestAnnouncement.typeavis_lib || '';
    
    
    const procedureType = detectProcedureType(procedureText);
    const procedureStatus = detectProcedureStatus(procedureText);
    const isActive = isProcedureActive(procedureText);

    const procedure: BodaccProcedure = {
      type: procedureType,
      name: procedureText || 'Procédure inconnue',
      dateDebut: latestAnnouncement.dateparution,
      tribunal: latestAnnouncement.tribunal,
      status: procedureStatus,
      typeavis: latestAnnouncement.typeavis,
      typeavis_lib: latestAnnouncement.typeavis_lib,
      dateparution: latestAnnouncement.dateparution
    };

    const result: BodaccResult = {
      siren,
      procedures: [procedure],
      hasProcedures: true,
      hasActiveProcedures: isActive,
      lastUpdate: new Date().toISOString()
    };

    // Mettre en cache le résultat
    bodaccCache.set(siren, { result, timestamp: Date.now() });
    
    console.log(`[BODACC API] Final result for SIREN ${siren}: procedure ${procedureType}, active: ${isActive}`);
    return result;

  } catch (error) {
    console.error(`Error fetching BODACC data for SIREN ${siren}:`, error);
    return {
      siren,
      procedures: [],
      hasProcedures: false,
      hasActiveProcedures: false,
      error: `NETWORK_ERROR: ${error instanceof Error ? error.message : 'unknown'}`
    };
  }
}

// Fonction pour récupérer les procédures BODACC pour plusieurs SIRENs
export async function fetchBodaccProceduresBatch(sirens: string[]): Promise<BodaccResult[]> {
  const results: BodaccResult[] = [];
  
  // Traiter par batch pour éviter de surcharger l'API
  const batchSize = 5;
  for (let i = 0; i < sirens.length; i += batchSize) {
    const batch = sirens.slice(i, i + batchSize);
    
    const batchPromises = batch.map(siren => fetchBodaccProcedures(siren));
    const batchResults = await Promise.all(batchPromises);
    
    results.push(...batchResults);
    
    // Petite pause entre les batches pour être respectueux de l'API
    if (i + batchSize < sirens.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

// Fonction utilitaire pour formater le nom de la procédure
export function formatProcedureName(type: BodaccProcedureType): string {
  const names: Record<BodaccProcedureType, string> = {
    'REDRESSEMENT_JUDICIAIRE': 'Redressement judiciaire',
    'LIQUIDATION_JUDICIAIRE': 'Liquidation judiciaire',
    'SAUVEGARDE': 'Sauvegarde',
    'CONCORDAT': 'Concordat',
    'PLAN_DE_REDRESSEMENT': 'Plan de redressement',
    'LIQUIDATION_AMINABLE': 'Liquidation amiable',
    'AUTRE': 'Autre procédure'
  };
  
  return names[type] || type;
}

// Fonction utilitaire pour vérifier si une entreprise est en procédure active
export function hasActiveProcedures(result: BodaccResult): boolean {
  return result.hasActiveProcedures;
}
