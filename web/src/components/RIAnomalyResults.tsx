"use client";
import { useState } from "react";
import { RIAnomalyResult, RIThresholds, DEFAULT_RI_THRESHOLDS } from "@/lib/treatments/ri-anomalies/types";

interface RIAnomalyResultsProps {
  results: RIAnomalyResult[];
  thresholds?: RIThresholds;
}

export function RIAnomalyResults({ results, thresholds = DEFAULT_RI_THRESHOLDS }: RIAnomalyResultsProps) {
  const [expandedSirets, setExpandedSirets] = useState<Set<string>>(new Set());

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "warning":
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-900/30 text-red-400 border border-red-500/30 whitespace-nowrap">
            ⚠️ Sous-déclaration
          </span>
        );
      case "excellent":
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-blue-900/30 text-blue-400 border border-blue-500/30 whitespace-nowrap">
            ✨ Excellent
          </span>
        );
      case "ok":
        return (
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-900/30 text-green-400 border border-green-500/30 whitespace-nowrap">
            ✓ Conforme
          </span>
        );
      default:
        return null;
    }
  };

  const formatPercent = (value: number) => {
    return value.toFixed(1) + "%";
  };

  const formatNumber = (value: number) => {
    return Math.round(value * 10) / 10;
  };

  const toggleExpanded = (siret: string) => {
    const newExpanded = new Set(expandedSirets);
    if (newExpanded.has(siret)) {
      newExpanded.delete(siret);
    } else {
      newExpanded.add(siret);
    }
    setExpandedSirets(newExpanded);
  };

  // Calculate global statistics
  const globalStats = {
    totalCompanies: results.length,
    totalMissions: results.reduce((sum, r) => sum + r.totalMissionsDU, 0),
    totalRITheorique: results.reduce((sum, r) => sum + r.riTheorique, 0),
    totalRIReel: results.reduce((sum, r) => sum + r.riReel, 0),
    warnings: results.filter(r => r.status === 'warning').length,
    conformes: results.filter(r => r.status === 'ok').length,
    excellents: results.filter(r => r.status === 'excellent').length,
  };

  const renderResultCard = (result: RIAnomalyResult) => {
    const isExpanded = expandedSirets.has(result.siret);

    return (
      <div 
        key={result.siret} 
        className="bg-cursor-bg-tertiary border border-cursor-border-primary rounded-lg overflow-hidden mb-4 clickable-row cursor-pointer hover:border-blue-500/50"
        onClick={() => toggleExpanded(result.siret)}
      >
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
            <div>
              <div className="text-sm text-cursor-text-muted mb-1">SIRET</div>
              <div className="text-lg font-mono text-cursor-text-primary">
                {result.siret}
              </div>
            </div>
            <div>
              <div className="text-sm text-cursor-text-muted mb-1">Dénomination</div>
              <div className="text-lg font-medium text-cursor-text-primary">
                {result.denomination}
              </div>
            </div>
          </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-cursor-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-blue-400">
              {result.totalMissionsDU}
            </div>
            <div className="text-xs text-cursor-text-muted mt-1">Missions DU</div>
          </div>
          <div className="text-center p-4 bg-cursor-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-purple-400">
              {formatNumber(result.riTheorique)}
            </div>
            <div className="text-xs text-cursor-text-muted mt-1">RI Théorique</div>
          </div>
          <div className="text-center p-4 bg-cursor-bg-secondary rounded-lg">
            <div className="text-2xl font-bold text-green-400">
              {result.riReel}
            </div>
            <div className="text-xs text-cursor-text-muted mt-1">RI Déclaré</div>
          </div>
          <div className="text-center p-4 bg-cursor-bg-secondary rounded-lg">
            <div
              className={`text-2xl font-bold ${
                result.ecartPercent < -20
                  ? "text-red-400"
                  : result.ecartPercent > 10
                  ? "text-blue-400"
                  : "text-green-400"
              }`}
            >
              {result.ecartPercent >= 0 ? "+" : ""}
              {formatPercent(result.ecartPercent)}
            </div>
            <div className="text-xs text-cursor-text-muted mt-1">Écart</div>
          </div>
        </div>

          <div className="flex items-center justify-between pt-4 border-t border-cursor-border-primary mb-4">
            <div className="flex items-center gap-2">
              <svg
                className={`w-5 h-5 text-cursor-text-secondary expand-icon ${
                  isExpanded ? "expanded" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="text-sm text-cursor-text-muted">
                {isExpanded ? "Masquer les détails" : "Cliquez pour voir les détails par prescripteur"}
                {result.detailsByPrescripteur.length > 0 && ` (${result.detailsByPrescripteur.length})`}
              </span>
            </div>
            {getStatusBadge(result.status)}
          </div>
        </div>

        {/* Details by Prescripteur - expandable */}
        {isExpanded && result.detailsByPrescripteur.length > 0 && (
          <div className="bg-cursor-bg-secondary border-t border-cursor-border-primary p-6 expandable-row-content table-row-expand-enter">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cursor-border-primary">
                    <th className="text-left py-4 px-6 text-sm font-semibold text-cursor-text-primary">
                      Prescripteur
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-cursor-text-primary">
                      Missions reçues
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-cursor-text-primary">
                      RI théorique
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-cursor-text-primary">
                      RI déclaré
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-semibold text-cursor-text-primary">
                      Écart %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.detailsByPrescripteur.map((detail, index) => (
                    <tr
                      key={detail.prescripteurId}
                      className={`border-b border-cursor-border-primary ${
                        index % 2 === 0 ? "bg-cursor-bg-tertiary" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-sm text-cursor-text-primary font-medium">
                        <div>{detail.prescripteurName}</div>
                        <div className="text-xs text-cursor-text-muted">
                          ID: {detail.prescripteurId}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-right text-cursor-text-primary tabular-nums">
                        {detail.missionsDU}
                      </td>
                      <td className="py-4 px-6 text-sm text-right text-cursor-text-secondary tabular-nums">
                        {formatNumber(detail.riTheorique)}
                      </td>
                      <td className="py-4 px-6 text-sm text-right text-cursor-text-primary tabular-nums">
                        {detail.riReel}
                      </td>
                      <td
                        className={`py-4 px-6 text-sm text-right font-medium tabular-nums ${
                          detail.ecartPercent < thresholds.warningThreshold
                            ? "text-red-400"
                            : detail.ecartPercent > thresholds.excellentThreshold
                            ? "text-blue-400"
                            : "text-green-400"
                        }`}
                      >
                        {detail.ecartPercent >= 0 ? "+" : ""}
                        {formatPercent(detail.ecartPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card-surface p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-cursor-text-primary">
            Analyse des déclarations RI
          </h2>
          <p className="text-sm text-cursor-text-secondary">
            Réparations à l&apos;Identique - Comparaison théorique vs réel ({results.length} entreprise{results.length > 1 ? 's' : ''})
          </p>
        </div>
      </div>

      {/* Global Summary */}
      {results.length > 1 && (
        <div className="bg-gradient-to-r from-blue-900/20 to-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-cursor-text-primary mb-4">Récapitulatif global</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-cursor-bg-secondary rounded-lg">
              <div className="text-xl font-bold text-blue-400">{globalStats.totalCompanies}</div>
              <div className="text-xs text-cursor-text-muted mt-1">Intervenants réseaux</div>
            </div>
            <div className="text-center p-3 bg-cursor-bg-secondary rounded-lg">
              <div className="text-xl font-bold text-blue-400">{globalStats.totalMissions}</div>
              <div className="text-xs text-cursor-text-muted mt-1">Total Missions</div>
            </div>
            <div className="text-center p-3 bg-cursor-bg-secondary rounded-lg">
              <div className="text-xl font-bold text-blue-400">{formatNumber(globalStats.totalRITheorique)}</div>
              <div className="text-xs text-cursor-text-muted mt-1">RI Théorique</div>
            </div>
            <div className="text-center p-3 bg-cursor-bg-secondary rounded-lg">
              <div className="text-xl font-bold text-green-400">{globalStats.totalRIReel}</div>
              <div className="text-xs text-cursor-text-muted mt-1">RI Déclaré</div>
            </div>
          </div>
          <div className="flex gap-4 justify-center pt-4 border-t border-cursor-border-primary">
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{globalStats.warnings}</div>
              <div className="text-xs text-cursor-text-muted">⚠️ Sous-déclaration</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">{globalStats.conformes}</div>
              <div className="text-xs text-cursor-text-muted">✓ Conforme</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">{globalStats.excellents}</div>
              <div className="text-xs text-cursor-text-muted">✨ Excellent</div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Results */}
      <div className="space-y-4 transition-all duration-500 ease-out hover:mx-[-10%] hover:shadow-2xl hover:shadow-blue-500/10">
        {results.map(renderResultCard)}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-cursor-bg-secondary border border-cursor-border-primary rounded-lg">
        <div className="text-sm text-cursor-text-secondary space-y-2">
          <div className="font-medium text-cursor-text-primary mb-2">Légende :</div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>Sous-déclaration : Écart &lt; {thresholds.warningThreshold}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>Conforme : {thresholds.warningThreshold}% ≤ Écart ≤ +{thresholds.excellentThreshold}%</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>Excellent : Écart &gt; +{thresholds.excellentThreshold}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

