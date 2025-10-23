import { Checked, HeaderMap, StreamingProgress } from '@/lib/types';
import { TreatmentType } from '@/lib/treatments/types';
import { formatAmount } from '@/lib/amount-utils';

interface ResultsTableProps {
  filtered: Checked[];
  headerMap: HeaderMap;
  streamingProgress: StreamingProgress | null;
  stats: { total: number; current: number } | null;
  onExport: () => void;
  activeTreatments?: TreatmentType[]; // Track which treatments are active for conditional column display
}

export function ResultsTable({ 
  filtered, 
  headerMap, 
  streamingProgress, 
  stats, 
  onExport,
  activeTreatments = ['radiation-check'] // Default to radiation-check for backward compatibility
}: ResultsTableProps) {
  // Si l'analyse est terminée et qu'il n'y a aucun résultat
  const isAnalysisComplete = !streamingProgress && stats && stats.current > 0;
  const hasNoResults = filtered.length === 0 && isAnalysisComplete;
  
  // Check which treatments are active (for future conditional column rendering)
  const showRadiationColumns = activeTreatments.includes('radiation-check');

  // Debug logs
  console.log('[ResultsTable DEBUG]', {
    'filtered.length': filtered.length,
    'streamingProgress': streamingProgress,
    'stats': stats,
    'isAnalysisComplete': isAnalysisComplete,
    'hasNoResults': hasNoResults
  });

  if (hasNoResults) {
    return (
      <div className="mt-6">
        <div className="card-surface rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-cursor-text-primary mb-1">
                Tous vos sous-traitants sont en règle ✓
              </h3>
              <p className="text-cursor-text-secondary text-sm">
                Sur les <span className="font-semibold text-cursor-text-primary">{stats?.current || 0}</span> entreprises analysées, aucune n&apos;est radiée ou en procédure collective.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Header section résultats avec design élégant */}
      <div className="mb-6 relative">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-cursor-text-primary">Résultats de l&apos;analyse</h2>
              <p className="text-xs text-cursor-text-secondary mt-0.5">
                Entreprises nécessitant une attention particulière
              </p>
            </div>
          </div>
          
          {/* Indicateur d'état de l'analyse */}
          {streamingProgress ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600/10 border border-blue-600/20">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs font-medium text-blue-400">En cours...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600/10 border border-green-600/20">
              <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-medium text-green-400">Terminé</span>
            </div>
          )}
        </div>
        
        <div className="card-surface p-4 rounded-xl border border-[#2a2a2a] shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                <span className="text-sm text-cursor-text-secondary">
                  <span className="font-bold text-red-400 text-lg tabular-nums">{filtered.length}</span>
                  <span className="text-cursor-text-muted mx-1">/</span>
                  <span className="font-semibold text-cursor-text-primary tabular-nums">{stats?.current || 0}</span>
                </span>
              </div>
              <div className="h-6 w-px bg-[#2a2a2a]"></div>
              <span className="text-xs text-cursor-text-secondary">
                Entreprises radiées ou en procédure
                {streamingProgress && (
                  <span className="ml-2 text-cursor-text-muted">
                    (Total: <span className="font-medium text-cursor-text-secondary tabular-nums">{stats?.total || 0}</span>)
                  </span>
                )}
              </span>
            </div>
            
            {filtered.length > 0 && (
              <button
                onClick={onExport}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter
              </button>
            )}
          </div>
        </div>
        
        {/* Séparateur élégant */}
        <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent"></div>
      </div>
      <div className="card-surface rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-800 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-white">SIRET</th>
              <th className="px-4 py-3 font-medium text-white">Dénomination</th>
              <th className="px-4 py-3 font-medium text-white">Téléphone</th>
              {/* Radiation check treatment columns */}
              {showRadiationColumns && (
                <>
                  <th className="px-4 py-3 font-medium text-white">Statut</th>
                  <th className="px-4 py-3 font-medium text-white">Date cessation</th>
                  <th className="px-4 py-3 font-medium text-white">Procédure</th>
                  <th className="px-4 py-3 font-medium text-white">En procédure active</th>
                </>
              )}
              {headerMap.montant && (
                <th className="px-4 py-3 font-medium text-white">Montant</th>
              )}
              <th className="px-4 py-3 font-medium text-white">Source</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr 
                key={r.siret} 
                className="border-t border-neutral-100"
              >
                <td className="px-4 py-3 font-mono text-gray-600">{r.siret}</td>
                <td className="px-4 py-3">
                  {r.denomination || "—"}
                </td>
                <td className="px-4 py-3">{r.phone || "—"}</td>
                {/* Radiation check treatment columns */}
                {showRadiationColumns && (
                  <>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {r.estRadiee && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded">
                            Radiée
                          </span>
                        )}
                        {r.hasActiveProcedures && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs rounded">
                            En procédure
                          </span>
                        )}
                        {!r.estRadiee && !r.hasActiveProcedures && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded">
                            Active
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.dateCessation || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.procedure || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.hasActiveProcedures ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs rounded">
                          Oui
                        </span>
                      ) : (
                        <span className="text-gray-500">Non</span>
                      )}
                    </td>
                  </>
                )}
                {headerMap.montant && (
                  <td className="px-4 py-3">
                    {r.montant && r.montant > 0 ? (
                      <span className="font-medium">
                        {formatAmount(r.montant)} €
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className="px-4 py-3 text-xs text-gray-500">{r.fichier_source || "API"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={headerMap.montant ? 9 : 8}>
                  {streamingProgress 
                    ? "Analyse en cours..."
                    : "Aucune entreprise radiée ou en procédure détectée."
                  }
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
