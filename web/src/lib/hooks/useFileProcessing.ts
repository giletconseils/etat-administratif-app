import { useState, useCallback } from 'react';
import { CsvRow, HeaderMap, DetectionType } from '../types';
import { 
  detectSiretOrPhoneColumnNoHeader, 
  detectAmountColumn,
  parseCsvFileNoHeader 
} from '../csv-utils';

export function useFileProcessing() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [headerMap, setHeaderMap] = useState<HeaderMap>({});
  const [detectionType, setDetectionType] = useState<DetectionType>(null);

  const processFile = useCallback(async (file: File) => {
    try {
      // Parser le fichier sans en-têtes
      const rowsNoHeader = await parseCsvFileNoHeader(file);
      
      if (!rowsNoHeader || rowsNoHeader.length === 0) {
        throw new Error('Aucune donnée trouvée dans le fichier');
      }
      
      // Détecter la colonne SIRET ou téléphone
      const detection = detectSiretOrPhoneColumnNoHeader(rowsNoHeader);
      
      if (detection.type === 'error') {
        throw new Error(detection.message);
      }
      
      // Détecter la colonne de montant
      const amountDetection = detectAmountColumn(rowsNoHeader);
      
      // Convertir en format avec en-têtes génériques
      const dataWithHeaders = rowsNoHeader.map((row) => {
        const obj: Record<string, string> = {};
        row.forEach((cell, colIndex) => {
          obj[`col_${colIndex}`] = cell || '';
        });
        return obj;
      });
      
      setRows(dataWithHeaders);
      
      // Mettre à jour headerMap avec les colonnes détectées
      const newHeaderMap: HeaderMap = { 
        siret: `col_${detection.columnIndex}` 
      };
      
      if (amountDetection) {
        newHeaderMap.montant = `col_${amountDetection.columnIndex}`;
      }
      
      setHeaderMap(newHeaderMap);
      setDetectionType(detection.type);
      
      return { success: true, message: detection.message };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur lors du traitement du fichier';
      return { success: false, message };
    }
  }, []);

  const reset = useCallback(() => {
    setRows([]);
    setHeaderMap({});
    setDetectionType(null);
  }, []);

  return {
    rows,
    headerMap,
    detectionType,
    processFile,
    reset,
    setHeaderMap
  };
}
