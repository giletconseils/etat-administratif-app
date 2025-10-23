import { promises as fs } from "fs";
import path from "path";
import Papa from "papaparse";
import { RIAnomalyResult, AssureurDetail, Mission, Assureur, RIThresholds, DEFAULT_RI_THRESHOLDS } from "./types";

const MISSIONS_PATH = path.join(
  process.cwd(),
  "../data/csv-files/missions/missions.csv"
);

const ASSUREURS_PATH = path.join(
  process.cwd(),
  "../data/csv-files/assureurs/assureurs.csv"
);

/**
 * Load missions from CSV file
 */
async function loadMissions(): Promise<Mission[]> {
  try {
    const content = await fs.readFile(MISSIONS_PATH, "utf-8");
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    });

    return parsed.data.map((row) => ({
      prescriber_id: parseInt(row.prescriber_id || "0", 10),
      company_id: parseInt(
        row["SERVICE_EMERGENCY_INTERVENTION → company_id"] ||
          row.company_id ||
          "0",
        10
      ),
      siret:
        row["SERVICE_USER_COMPANY - company_id → siret"] ||
        row.siret ||
        "",
      has_ri:
        !!(row["SERVICE_B2CSDU_ORDER → external_id"] || "").trim() &&
        row["SERVICE_B2CSDU_ORDER → external_id"] !== "",
    }));
  } catch (error) {
    console.error("Error loading missions:", error);
    throw new Error("Impossible de charger les missions");
  }
}

/**
 * Load assureur percentages from CSV file
 */
async function loadAssureurs(): Promise<Map<number, Assureur>> {
  try {
    const content = await fs.readFile(ASSUREURS_PATH, "utf-8");
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    });

    const assureursMap = new Map<number, Assureur>();
    parsed.data.forEach((row) => {
      const id = parseInt(row.id, 10);
      if (!isNaN(id)) {
        assureursMap.set(id, {
          id,
          name: row.name,
          ri_percentage: parseFloat(row.ri_percentage || "0"),
        });
      }
    });

    return assureursMap;
  } catch (error) {
    console.error("Error loading assureurs:", error);
    throw new Error("Impossible de charger les assureurs");
  }
}

/**
 * Get company name from sous-traitants database
 */
async function getCompanyName(siret: string): Promise<string> {
  try {
    const soustraitantsPath = path.join(
      process.cwd(),
      "../data/csv-files/base-sous-traitants/sous-traitants.csv"
    );
    const content = await fs.readFile(soustraitantsPath, "utf-8");
    const parsed = Papa.parse<Record<string, string>>(content, {
      header: true,
      skipEmptyLines: true,
    });

    const company = parsed.data.find((row) => row.siret === siret);
    return company?.name || "Entreprise inconnue";
  } catch (error) {
    console.error("Error loading company name:", error);
    return "Entreprise inconnue";
  }
}

/**
 * Execute RI anomaly detection for a given SIRET
 */
async function executeSingle(
  siret: string,
  missions: Mission[],
  assureursMap: Map<number, Assureur>,
  thresholds: RIThresholds = DEFAULT_RI_THRESHOLDS
): Promise<RIAnomalyResult> {
  const denomination = await getCompanyName(siret);

  // Filter missions for this SIRET
  const siretMissions = missions.filter((m) => m.siret === siret);

  if (siretMissions.length === 0) {
    return {
      siret,
      denomination,
      totalMissionsDU: 0,
      riTheorique: 0,
      riReel: 0,
      ecartPercent: 0,
      status: "ok",
      detailsByAssureur: [],
    };
  }

  // Group missions by prescriber_id (assureur)
  const missionsByAssureur = new Map<number, Mission[]>();
  siretMissions.forEach((mission) => {
    if (!missionsByAssureur.has(mission.prescriber_id)) {
      missionsByAssureur.set(mission.prescriber_id, []);
    }
    missionsByAssureur.get(mission.prescriber_id)!.push(mission);
  });

  // Calculate statistics by assureur
  const detailsByAssureur: AssureurDetail[] = [];
  let totalMissionsDU = 0;
  let totalRITheorique = 0;
  let totalRIReel = 0;

  missionsByAssureur.forEach((missions, assureurId) => {
    const assureur = assureursMap.get(assureurId);
    const assureurName = assureur?.name || `Assureur ${assureurId}`;
    const riPercentage = assureur?.ri_percentage || 0;

    const missionsDU = missions.length;
    const riTheorique = (missionsDU * riPercentage) / 100;
    const riReel = missions.filter((m) => m.has_ri).length;
    const ecart = riReel - riTheorique;
    const ecartPercent = riTheorique > 0 ? (ecart / riTheorique) * 100 : 0;

    totalMissionsDU += missionsDU;
    totalRITheorique += riTheorique;
    totalRIReel += riReel;

    detailsByAssureur.push({
      assureurId,
      assureurName,
      missionsDU,
      riTheorique,
      riReel,
      ecartPercent,
    });
  });

  // Calculate global statistics
  const ecartGlobal = totalRIReel - totalRITheorique;
  const ecartPercentGlobal =
    totalRITheorique > 0 ? (ecartGlobal / totalRITheorique) * 100 : 0;

  // Determine status using custom thresholds
  let status: "warning" | "ok" | "excellent";
  if (ecartPercentGlobal < thresholds.warningThreshold) {
    status = "warning";
  } else if (ecartPercentGlobal > thresholds.excellentThreshold) {
    status = "excellent";
  } else {
    status = "ok";
  }

  // Sort details by assureur name
  detailsByAssureur.sort((a, b) => a.assureurName.localeCompare(b.assureurName));

  return {
    siret,
    denomination,
    totalMissionsDU,
    riTheorique: totalRITheorique,
    riReel: totalRIReel,
    ecartPercent: ecartPercentGlobal,
    status,
    detailsByAssureur,
  };
}

/**
 * Execute RI anomaly detection for multiple SIRETs
 */
export async function execute(
  sirets: string | string[], 
  thresholds: RIThresholds = DEFAULT_RI_THRESHOLDS
): Promise<RIAnomalyResult[]> {
  // Normalize input to array
  const siretArray = Array.isArray(sirets) ? sirets : [sirets];

  // Load shared data once
  const missions = await loadMissions();
  const assureursMap = await loadAssureurs();

  // Process all SIRETs
  const results = await Promise.all(
    siretArray.map((siret) => executeSingle(siret, missions, assureursMap, thresholds))
  );

  return results;
}

/**
 * Execute RI anomaly detection for ALL subcontractors (batch mode)
 * Filters based on enabled statuses and only keeps those with at least minMissions
 */
export async function executeAll(
  minMissions: number = 5,
  enabledStatuses?: Record<string, boolean>,
  thresholds: RIThresholds = DEFAULT_RI_THRESHOLDS
): Promise<RIAnomalyResult[]> {
  try {
    // 1. Charger toute la base sous-traitants
    const soustraitantsPath = path.join(
      process.cwd(),
      "../data/csv-files/base-sous-traitants/sous-traitants.csv"
    );
    const soustraitantsContent = await fs.readFile(soustraitantsPath, "utf-8");
    const soustraitantsParsed = Papa.parse<Record<string, string>>(soustraitantsContent, {
      header: true,
      skipEmptyLines: true,
    });

    // 2. Mapping des labels vers codes numériques
    const STATUS_CODE_MAP: Record<string, number> = {
      'TR': 5,
      'U3': 4,
      'U4': 3,
      'U2': 2,
      'U1': 1,
      'U1P': 0
    };

    // 3. Déterminer quels codes de statut sont autorisés
    let allowedStatusCodes: number[];
    
    if (enabledStatuses && Object.values(enabledStatuses).some(v => v)) {
      // Si des statuts spécifiques sont activés, n'utiliser que ceux-ci
      // MAIS toujours exclure U3 et U4 pour le traitement RI
      allowedStatusCodes = Object.entries(enabledStatuses)
        .filter(([label, enabled]) => enabled && label !== 'U3' && label !== 'U4')
        .map(([label]) => STATUS_CODE_MAP[label])
        .filter(code => code !== undefined);
      
      console.log(`[RI Batch] Statuts sélectionnés (hors U3/U4):`, 
        Object.entries(enabledStatuses)
          .filter(([label, enabled]) => enabled && label !== 'U3' && label !== 'U4')
          .map(([label]) => label)
      );
    } else {
      // Si aucun statut n'est spécifié, utiliser tous sauf U3/U4 (comportement par défaut)
      allowedStatusCodes = [5, 2, 1, 0]; // TR, U2, U1, U1P
      console.log(`[RI Batch] Aucun statut spécifié, utilisation par défaut (tous sauf U3/U4)`);
    }

    console.log(`[RI Batch] Codes de statut autorisés:`, allowedStatusCodes);

    // 4. Filtrer les sous-traitants selon les statuts autorisés
    const filteredSubcontractors = soustraitantsParsed.data.filter((row) => {
      const status = parseInt(row.status || "0", 10);
      return allowedStatusCodes.includes(status);
    });

    console.log(`[RI Batch] Total sous-traitants: ${soustraitantsParsed.data.length}`);
    console.log(`[RI Batch] Après filtre de statuts: ${filteredSubcontractors.length}`);

    // 5. Charger les missions et assureurs
    const missions = await loadMissions();
    const assureursMap = await loadAssureurs();

    // 6. Pour chaque sous-traitant, compter ses missions
    const subcontractorsWithMissionCount = filteredSubcontractors.map((sub) => {
      const siret = sub.siret || "";
      const missionCount = missions.filter((m) => m.siret === siret).length;
      return {
        siret,
        status: parseInt(sub.status || "0", 10),
        missionCount,
      };
    });

    // 7. Filtrer ceux avec missions >= minMissions
    const eligibleSubcontractors = subcontractorsWithMissionCount.filter(
      (sub) => sub.missionCount >= minMissions
    );

    console.log(`[RI Batch] Avec au moins ${minMissions} mission(s): ${eligibleSubcontractors.length}`);

    // 8. Exécuter executeSingle() pour chacun
    const results = await Promise.all(
      eligibleSubcontractors.map(async (sub) => {
        const result = await executeSingle(sub.siret, missions, assureursMap, thresholds);
        return {
          ...result,
          status_reseau: sub.status,
        };
      })
    );

    // 9. Trier par ecartPercent croissant (plus négatif d'abord = sous-déclaration)
    const sortedResults = results.sort((a, b) => a.ecartPercent - b.ecartPercent);

    // 10. Ajouter le ranking
    const rankedResults = sortedResults.map((result, index) => ({
      ...result,
      ranking: index + 1,
    }));

    console.log(`[RI Batch] Résultats finaux: ${rankedResults.length}`);

    return rankedResults;
  } catch (error) {
    console.error("Error in executeAll:", error);
    throw new Error("Impossible d'analyser tous les sous-traitants");
  }
}
