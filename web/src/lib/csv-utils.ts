import Papa from 'papaparse';
import { CsvRow, DetectionResult } from './types';

// Fonction pour détecter automatiquement la colonne SIRET ou téléphone
export function detectSiretOrPhoneColumn(data: CsvRow[]): DetectionResult {
  if (!data || data.length === 0) {
    return { type: 'error', message: 'Aucune donnée trouvée dans le fichier' };
  }

  const headers = Object.keys(data[0] || {});
  
  // 1. Détection de colonne SIRET
  const siretCandidates = headers.filter(header => {
    const lowerHeader = header.toLowerCase();
    return lowerHeader.includes('siret') || 
           lowerHeader.includes('numero') ||
           lowerHeader.includes('num') ||
           lowerHeader.includes('id');
  });

  // Vérifier si une des colonnes candidats contient des SIRETs valides
  for (const candidate of siretCandidates) {
    const sampleValues = data.slice(0, Math.min(10, data.length)).map(row => row[candidate]);
    const validSirets = sampleValues.filter(value => {
      const cleaned = (value || '').toString().replace(/[^0-9]/g, '');
      return cleaned.length === 14 && /^\d{14}$/.test(cleaned);
    });
    
    if (validSirets.length > 0) {
      return { 
        type: 'siret', 
        column: candidate, 
        message: `Colonne SIRET détectée: ${candidate} (${validSirets.length} SIRETs valides trouvés)`
      };
    }
  }

  // 2. Détection de colonne téléphone
  const phoneCandidates = headers.filter(header => {
    const lowerHeader = header.toLowerCase().trim();
    return lowerHeader.includes('tel') || 
           lowerHeader.includes('phone') ||
           lowerHeader.includes('telephone') ||
           lowerHeader.includes('mobile') ||
           lowerHeader === 'tel' ||
           lowerHeader === 'phone';
  });

  // Vérifier si une des colonnes téléphone contient des numéros français valides
  for (const candidate of phoneCandidates) {
    const sampleValues = data.slice(0, Math.min(10, data.length)).map(row => row[candidate]);
    const validPhones = sampleValues.filter(value => {
      if (!value) return false;
      const cleaned = value.toString().replace(/[^0-9+]/g, '');
      // Format français: +33XXXXXXXXX ou 33XXXXXXXXX ou 0XXXXXXXXX
      return /^(\+33|33|0)[1-9]\d{8}$/.test(cleaned) || /^[1-9]\d{8}$/.test(cleaned);
    });
    
    if (validPhones.length > 0) {
      return { 
        type: 'phone', 
        column: candidate, 
        message: `Colonne téléphone détectée: ${candidate} (${validPhones.length} numéros français trouvés). La jointure avec la base entreprise sera effectuée pour enrichir avec les SIRETs.`
      };
    }
  }

  // 3. Aucune colonne appropriée trouvée
  return { 
    type: 'error', 
    message: 'Trop d\'informations : Impossible d\'identifier automatiquement une colonne SIRET ou téléphone. Veuillez vérifier que votre fichier contient une colonne avec des SIRETs (14 chiffres) ou des numéros de téléphone français (+33XXXXXXXXX, 33XXXXXXXXX, ou 0XXXXXXXXX).'
  };
}

// Fonction pour détecter automatiquement la colonne SIRET ou téléphone dans un fichier sans en-têtes
export function detectSiretOrPhoneColumnNoHeader(data: string[][]): DetectionResult {
  if (!data || data.length === 0) {
    return { type: 'error', message: 'Aucune donnée trouvée dans le fichier' };
  }

  const numColumns = data[0]?.length || 0;
  if (numColumns === 0) {
    return { type: 'error', message: 'Aucune colonne trouvée dans le fichier' };
  }

  // Analyser chaque colonne pour détecter SIRETs ou téléphones
  for (let colIndex = 0; colIndex < numColumns; colIndex++) {
    // Prendre un échantillon de valeurs de cette colonne
    const sampleValues = data.slice(0, Math.min(10, data.length))
      .map(row => row[colIndex])
      .filter(value => value && value.trim() !== '');

    if (sampleValues.length === 0) continue;

    // Test 1: Détection de SIRETs
    const validSirets = sampleValues.filter(value => {
      const cleaned = value.toString().replace(/[^0-9]/g, '');
      return cleaned.length === 14 && /^\d{14}$/.test(cleaned);
    });
    
    if (validSirets.length > 0) {
      return { 
        type: 'siret', 
        columnIndex: colIndex, 
        message: `Colonne SIRET détectée (colonne ${colIndex + 1}) : ${validSirets.length} SIRETs valides trouvés`
      };
    }

    // Test 2: Détection de téléphones
    const validPhones = sampleValues.filter(value => {
      if (!value) return false;
      const cleaned = value.toString().replace(/[^0-9+]/g, '');
      // Format français: +33XXXXXXXXX ou 33XXXXXXXXX ou 0XXXXXXXXX ou 9 chiffres
      const isValid = /^(\+33|33|0)[1-9]\d{8}$/.test(cleaned) || 
                      /^[1-9]\d{8}$/.test(cleaned) ||
                      (cleaned.length === 11 && cleaned.startsWith('33')) ||
                      (cleaned.length === 10 && cleaned.startsWith('0'));
      return isValid;
    });
    
    if (validPhones.length > 0) {
      return { 
        type: 'phone', 
        columnIndex: colIndex, 
        message: `Colonne téléphone détectée (colonne ${colIndex + 1}) : ${validPhones.length} numéros français trouvés. La jointure avec la base entreprise sera effectuée pour enrichir avec les SIRETs.`
      };
    }
  }

  // Aucune colonne appropriée trouvée
  return { 
    type: 'error', 
    message: 'Trop d\'informations : Impossible d\'identifier automatiquement une colonne SIRET ou téléphone. Veuillez vérifier que votre fichier contient une colonne avec des SIRETs (14 chiffres) ou des numéros de téléphone français (+33XXXXXXXXX, 33XXXXXXXXX, ou 0XXXXXXXXX).'
  };
}

// Fonction pour détecter automatiquement les colonnes de montants
export function detectAmountColumn(data: string[][]): { columnIndex: number, message: string } | null {
  if (!data || data.length === 0) return null;

  const numColumns = data[0]?.length || 0;
  
  // Analyser chaque colonne pour détecter des montants
  for (let colIndex = 0; colIndex < numColumns; colIndex++) {
    const sampleValues = data.slice(0, Math.min(10, data.length))
      .map(row => row[colIndex])
      .filter(value => value && value.trim() !== '');

    if (sampleValues.length === 0) continue;

    // Éviter les colonnes qui sont clairement des téléphones (11 chiffres commençant par 33 ou 0)
    const isPhoneColumn = sampleValues.every(value => {
      const cleaned = value.toString().replace(/[^0-9]/g, '');
      return /^(33|0)\d{9}$/.test(cleaned) || /^33\d{9}$/.test(cleaned);
    });
    
    if (isPhoneColumn) {
      continue;
    }

    // Test pour détecter des montants (nombres avec virgules ou points, mais pas des téléphones)
    const validAmounts = sampleValues.filter(value => {
      const cleaned = value.toString().replace(/[^\d.,]/g, '');
      // Accepter les formats: 123.45, 123,45, 1234,56, etc.
      // Mais rejeter les téléphones (11 chiffres commençant par 33 ou 0)
      const isValid = (/^\d+[.,]\d{1,2}$/.test(cleaned) || /^\d+$/.test(cleaned)) && 
                     !/^(33|0)\d{9}$/.test(cleaned) && 
                     !/^33\d{9}$/.test(cleaned);
      return isValid;
    });
    
    if (validAmounts.length > 0) {
      return { 
        columnIndex: colIndex, 
        message: `Colonne montant détectée (colonne ${colIndex + 1}): ${validAmounts.length} montants trouvés`
      };
    }
  }

  return null;
}

// Fonction pour convertir une valeur CSV en nombre
export function parseAmount(value: string | number): number {
  if (!value || (typeof value === 'string' && value.trim() === '')) return 0;
  
  // Si c'est déjà un nombre, le retourner directement
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  
  // Nettoyer la valeur string mais garder le signe négatif et les chiffres, virgules, points
  const cleaned = value.toString().replace(/[^\d.,-]/g, '');
  
  // Remplacer la virgule par un point pour le parsing
  const normalized = cleaned.replace(',', '.');
  
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

// Fonction pour normaliser un numéro de téléphone
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Nettoyer le numéro (garder seulement les chiffres et le +)
  const cleaned = phone.toString().replace(/[^0-9+]/g, '');
  
  // Si le numéro est déjà au format +33XXXXXXXXX, le garder tel quel
  if (cleaned.startsWith('+33') && cleaned.length === 12) {
    return cleaned;
  }
  
  // Convertir les différents formats français en format normalisé +33XXXXXXXXX
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    // 33XXXXXXXXX -> +33XXXXXXXXX
    return '+' + cleaned;
  } else if (cleaned.startsWith('0') && cleaned.length === 10) {
    // 0XXXXXXXXX -> +33XXXXXXXXX
    return '+33' + cleaned.substring(1);
  } else if (cleaned.length === 9 && /^[1-9]\d{8}$/.test(cleaned)) {
    // 9 chiffres commençant par 1-9 -> +33XXXXXXXXX
    return '+33' + cleaned;
  }
  
  // Si le format n'est pas reconnu, retourner vide
  return '';
}

// Fonction pour parser un fichier CSV
export function parseCsvFile(file: File): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        resolve(result.data as CsvRow[]);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Fonction pour parser un fichier CSV sans en-têtes
export function parseCsvFileNoHeader(file: File): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        resolve(result.data);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
