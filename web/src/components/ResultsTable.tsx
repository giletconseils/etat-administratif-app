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
