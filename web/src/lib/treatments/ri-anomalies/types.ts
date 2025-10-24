// Types for RI Anomalies Detection

export interface RIAnomalyResult {
  siret: string;
  denomination: string;
  totalMissionsDU: number;
  riTheorique: number;
  riReel: number;
  ecartPercent: number;
  status: 'warning' | 'ok' | 'excellent';
  detailsByPrescripteur: PrescripteurDetail[];
  status_reseau?: number; // Pour filtrer U3/U4
  ranking?: number; // Pour le tri dans le mode batch
  work_ids?: number[]; // Métiers associés aux missions
}

export interface RIAnomaliesResults {
  results: RIAnomalyResult[];
  mode?: 'siret' | 'batch'; // Mode d'exécution
  minMissions?: number; // Seuil minimum de missions (mode batch)
  totalAnalyzed?: number; // Nombre total analysé
  totalFiltered?: number; // Nombre après filtres
}

export interface RIThresholds {
  warningThreshold: number; // Seuil de sous-déclaration (par défaut -20)
  excellentThreshold: number; // Seuil d'excellence (par défaut +10)
}

export const DEFAULT_RI_THRESHOLDS: RIThresholds = {
  warningThreshold: -20,
  excellentThreshold: 10,
};

export interface PrescripteurDetail {
  prescripteurId: number;
  prescripteurName: string;
  missionsDU: number;
  riTheorique: number;
  riReel: number;
  ecartPercent: number;
}

export interface Mission {
  prescriber_id: number;
  company_id: number;
  siret: string;
  has_ri: boolean; // True if SERVICE_B2CSDU_ORDER → external_id is not empty
  work_id: number; // ID du métier
}

export interface Prescripteur {
  id: number;
  name: string;
  ri_percentage: number;
}
