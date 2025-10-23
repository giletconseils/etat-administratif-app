import { Checked, HeaderMap, StreamingProgress } from '@/lib/types';
import { formatAmount } from '@/lib/amount-utils';

interface ResultsTableProps {
  filtered: Checked[];
  headerMap: HeaderMap;
  streamingProgress: StreamingProgress | null;
  stats: { total: number; current: number } | null;
  onExport: () => void;
}

export function ResultsTable({ 
  filtered, 
  headerMap, 
  streamingProgress, 
  stats, 
  onExport 
}: ResultsTableProps) {
  // Si l'analyse est terminée et qu'il n'y a aucun résultat
  const isAnalysisComplete = !streamingProgress && stats && stats.current > 0;
  const hasNoResults = filtered.length === 0 && isAnalysisComplete;

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
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-white">{filtered.length}</span> entreprises radiées ou en procédure sur <span className="font-semibold text-white">{stats?.current || 0}</span> analysées
          {streamingProgress && (
            <span className="ml-2 text-gray-400">
              (Total: <span className="font-medium text-gray-300">{stats?.total || 0}</span>)
            </span>
          )}
        </div>
        {filtered.length > 0 && (
          <button
            onClick={onExport}
            className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 border border-blue-600 rounded-lg transition-colors"
          >
            Exporter
          </button>
        )}
      </div>
      <div className="card-surface rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-800 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-white">SIRET</th>
              <th className="px-4 py-3 font-medium text-white">Dénomination</th>
              <th className="px-4 py-3 font-medium text-white">Téléphone</th>
              <th className="px-4 py-3 font-medium text-white">Statut</th>
              <th className="px-4 py-3 font-medium text-white">Date cessation</th>
              <th className="px-4 py-3 font-medium text-white">Procédure</th>
              <th className="px-4 py-3 font-medium text-white">En procédure active</th>
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
