import { HeaderMap, DetectionType, CsvRow } from '@/lib/types';

interface FileUploaderProps {
  onFileProcessed: (file: File) => Promise<{ success: boolean; message: string }>;
  rows: CsvRow[];
  headerMap: HeaderMap;
  detectionType: DetectionType;
  onHeaderMapChange: (headerMap: HeaderMap) => void;
}

export function FileUploader({ 
  onFileProcessed, 
  rows, 
  headerMap, 
  detectionType, 
  onHeaderMapChange 
}: FileUploaderProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await onFileProcessed(file);
      if (!result.success) {
        alert(result.message);
      }
    }
  };

  const getDisplayName = (header: string) => {
    return header.startsWith('col_') 
      ? `Colonne ${parseInt(header.replace('col_', '')) + 1}` 
      : header;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded border border-cursor-border-primary bg-cursor-bg-secondary flex items-center justify-center">
            <svg className="w-3 h-3 text-cursor-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-medium text-cursor-text-primary">Fichier CSV</h3>
            <p className="text-sm text-cursor-text-secondary">Ou téléchargez votre fichier CSV</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => document.getElementById('csv-file-input')?.click()}
          className="px-4 py-2 border border-cursor-border-primary rounded text-cursor-text-primary hover:bg-cursor-hover transition-colors"
        >
          Choisir un fichier
        </button>
        <span className="text-sm text-cursor-text-secondary">
          {rows.length > 0 ? `${rows.length} lignes chargées` : 'Aucun fichier choisi'}
        </span>
      </div>
      
      <input
        id="csv-file-input"
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="text-sm text-cursor-text-muted">
        Détection automatique des colonnes SIRET/téléphone et montants
      </div>
      
      {rows.length > 0 && (
        <div className="space-y-3 p-4 bg-cursor-bg-tertiary rounded border border-cursor-border-primary">
          <div className="text-sm text-cursor-text-primary font-medium">Configuration des colonnes</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-cursor-text-secondary">
                {detectionType === 'phone' ? 'Téléphone' : 'SIRET'}
              </label>
              <select
                value={headerMap.siret || ''}
                onChange={(e) => onHeaderMapChange({ ...headerMap, siret: e.target.value })}
                className="w-full input-cursor"
              >
                {rows.length > 0 && Object.keys(rows[0]).map((header) => (
                  <option key={header} value={header}>
                    {getDisplayName(header)}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-cursor-text-secondary">Montant (optionnel)</label>
              <select
                value={headerMap.montant || ''}
                onChange={(e) => onHeaderMapChange({ ...headerMap, montant: e.target.value })}
                className="w-full input-cursor"
              >
                <option value="">Aucune</option>
                {rows.length > 0 && Object.keys(rows[0]).map((header) => (
                  <option key={header} value={header}>
                    {getDisplayName(header)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {!headerMap.montant && (
            <div className="text-xs text-cursor-text-muted">
              💡 Sélectionnez une colonne de montant pour calculer automatiquement la somme totale.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
