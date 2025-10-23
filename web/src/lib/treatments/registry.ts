// Treatment registry with metadata for all available treatments

import { TreatmentMetadata, TreatmentType } from './types';

export const TREATMENT_REGISTRY: Record<TreatmentType, TreatmentMetadata> = {
  'radiation-check': {
    id: 'radiation-check',
    name: 'Identifier les radiations / procédures',
    description: 'Vérifie le statut administratif des entreprises (radiées, en procédure collective)',
    enabled: true,
  },
  'ri-anomalies': {
    id: 'ri-anomalies',
    name: 'Détecter les anomalies de déclarations de RI',
    description: 'Analyse les déclarations de responsabilité pour détecter les anomalies (à venir)',
    enabled: false, // Not yet implemented
  },
};

export function getTreatmentMetadata(treatmentType: TreatmentType): TreatmentMetadata {
  return TREATMENT_REGISTRY[treatmentType];
}

export function getAllTreatments(): TreatmentMetadata[] {
  return Object.values(TREATMENT_REGISTRY);
}

export function getEnabledTreatments(): TreatmentMetadata[] {
  return getAllTreatments().filter(t => t.enabled);
}

export function areTreatmentsCompatible(treatments: TreatmentType[]): boolean {
  for (const treatment of treatments) {
    const metadata = getTreatmentMetadata(treatment);
    if (metadata.incompatibleWith) {
      for (const incompatible of metadata.incompatibleWith) {
        if (treatments.includes(incompatible)) {
          return false;
        }
      }
    }
  }
  return true;
}

