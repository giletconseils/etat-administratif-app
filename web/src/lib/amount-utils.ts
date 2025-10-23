import { CsvRow, Checked, HeaderMap, DetectionType } from './types';
import { parseAmount, normalizePhone } from './csv-utils';

// Fonction pour créer un mapping des montants depuis les données CSV
export function createAmountMap(
  rows: CsvRow[], 
  headerMap: HeaderMap, 
  detectionType: DetectionType
): Record<string, number> {
  if (!headerMap.montant || rows.length === 0) {
    return {};
  }
  
  const map: Record<string, number> = {};

  const normalizeSiret = (value: string | undefined): string | null => {
    if (!value) return null;
    const digits = value.toString().replace(/[^0-9]/g, '');
    return digits.length === 14 ? digits : digits || null;
  };
  
  rows.forEach((row, index) => {
    const amountValue = row[headerMap.montant!];
    if (amountValue) {
      const amount = parseAmount(amountValue);
      
      // Clé par téléphone si mode téléphone
      if (detectionType === 'phone' && headerMap.siret) {
        const phone = normalizePhone(row[headerMap.siret] || '');
        if (phone) {
          map[phone] = amount;
        }
      }
      
      // Clé par SIRET si disponible ET si on n'est pas en mode téléphone
      // En mode téléphone, `headerMap.siret` pointe en réalité vers la colonne téléphone
      if (headerMap.siret && detectionType !== 'phone') {
        const siret = normalizeSiret(row[headerMap.siret]);
        if (siret) {
          map[siret] = amount;
        }
      }
      
      // Clé par index comme fallback
      map[`index_${index}`] = amount;
    }
  });
  
  return map;
}

// Fonction pour enrichir les résultats avec les montants
export function enrichWithAmounts(
  results: Checked[], 
  amountMap: Record<string, number>
): Checked[] {
  if (Object.keys(amountMap).length === 0) {
    return results;
  }

  const normalizeSiret = (value: string | undefined): string | null => {
    if (!value) return null;
    const digits = value.toString().replace(/[^0-9]/g, '');
    return digits.length === 14 ? digits : digits || null;
  };

  return results.map((result, index) => {
    // PRÉSERVER le montant existant s'il est déjà défini et non-zéro
    if (result.montant !== undefined && result.montant !== 0) {
      return result;
    }

    let amount = 0;
    
    // 1. Par téléphone
    if (result.phone) {
      const phoneKey = normalizePhone(result.phone);
      if (phoneKey && amountMap[phoneKey] !== undefined) {
        amount = amountMap[phoneKey];
      }
    }
    // 2. Par SIRET
    else if (result.siret) {
      const siretKey = normalizeSiret(result.siret);
      if (siretKey && amountMap[siretKey] !== undefined) {
        amount = amountMap[siretKey];
      }
    }
    // 3. Par index (fallback)
    else if (amountMap[`index_${index}`]) {
      amount = amountMap[`index_${index}`];
    }
    
    return {
      ...result,
      montant: amount
    };
  });
}

// Fonction pour calculer le montant total des intervenants réseaux radiés
export function calculateTotalAmount(results: Checked[]): number {
  const radiees = results.filter(r => r.estRadiee);
  
  return radiees.reduce((sum, item) => {
    const montant = item.montant || 0;
    return sum + montant;
  }, 0);
}

// Fonction pour formater un montant en euros
export function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}
