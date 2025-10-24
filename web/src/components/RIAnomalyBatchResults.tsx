import React, { useState } from "react";
import { RIAnomalyResult, RIThresholds, DEFAULT_RI_THRESHOLDS } from "@/lib/treatments/ri-anomalies/types";
import * as XLSX from 'xlsx';

interface RIAnomalyBatchResultsProps {
  results: RIAnomalyResult[];
  minMissions?: number;
  thresholds?: RIThresholds;
}

export function RIAnomalyBatchResults({ results, minMissions = 5, thresholds = DEFAULT_RI_THRESHOLDS }: RIAnomalyBatchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSirets, setExpandedSirets] = useState<Set<string>>(new Set());
  const resultsPerPage = 50;

  // Statistiques
  const totalAnalyzed = results.length;
  const withWarning = results.filter(r => r.status === 'warning').length;
  const fraudPercentage = totalAnalyzed > 0 ? (withWarning / totalAnalyzed * 100).toFixed(1) : "0.0";

  // Pagination
  const totalPages = Math.ceil(totalAnalyzed / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = results.slice(startIndex, endIndex);

  // Export vers Excel avec détails par assureur
  const exportToCSV = () => {
    // Feuille 1: Vue synthétique
    const exportData = results.map((result, index) => ({
      'Rang': index + 1,
      'SIRET': result.siret,
      'Dénomination': result.denomination,
      'Missions DU': result.totalMissionsDU,
      'RI Théorique': result.riTheorique.toFixed(1),
      'RI Réel': result.riReel,
      'Écart %': result.ecartPercent.toFixed(1),
      'Statut': result.status === 'warning' ? 'Sous-déclaration' : result.status === 'excellent' ? 'Excellent' : 'Conforme',
      'Nb Prescripteurs': result.detailsByPrescripteur?.length || 0,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Largeurs des colonnes - feuille synthétique
    ws['!cols'] = [
      { wch: 6 },  // Rang
      { wch: 15 }, // SIRET
      { wch: 35 }, // Dénomination
      { wch: 12 }, // Missions DU
      { wch: 14 }, // RI Théorique
      { wch: 10 }, // RI Réel
      { wch: 10 }, // Écart %
      { wch: 18 }, // Statut
      { wch: 12 }, // Nb Prescripteurs
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, 'Vue synthétique');
    
    // Feuille 2: Détails par prescripteur pour chaque intervenant réseau
    const detailsData: Array<Record<string, string | number>> = [];
    results.forEach((result) => {
      if (result.detailsByPrescripteur && result.detailsByPrescripteur.length > 0) {
        result.detailsByPrescripteur.forEach((detail) => {
          detailsData.push({
            'SIRET': result.siret,
            'Dénomination': result.denomination,
            'Rang': result.ranking || 0,
            'Prescripteur ID': detail.prescripteurId,
            'Prescripteur': detail.prescripteurName,
            'Missions DU': detail.missionsDU,
            'RI Théorique': formatNumber(detail.riTheorique),
            'RI Réel': detail.riReel,
            'Écart %': detail.ecartPercent.toFixed(1),
            'Statut Prescripteur': 
              detail.ecartPercent < thresholds.warningThreshold ? 'Sous-déclaration' :
              detail.ecartPercent > thresholds.excellentThreshold ? 'Excellent' : 
              'Conforme',
          });
        });
      }
    });
    
    if (detailsData.length > 0) {
      const wsDetails = XLSX.utils.json_to_sheet(detailsData);
      
      // Largeurs des colonnes - feuille détails
      wsDetails['!cols'] = [
        { wch: 15 }, // SIRET
        { wch: 35 }, // Dénomination
        { wch: 6 },  // Rang
        { wch: 12 }, // Prescripteur ID
        { wch: 30 }, // Prescripteur
        { wch: 12 }, // Missions DU
        { wch: 14 }, // RI Théorique
        { wch: 10 }, // RI Réel
        { wch: 10 }, // Écart %
        { wch: 18 }, // Statut Prescripteur
      ];
      
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Détails par prescripteur');
    }
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `ri_anomalies_batch_${dateStr}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
  };

  // Helper pour obtenir la couleur selon l'écart
  const getEcartColor = (ecart: number) => {
    if (ecart < thresholds.warningThreshold) return 'text-red-400 font-semibold';
    if (ecart < 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'warning':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20 whitespace-nowrap">⚠️ Sous-déclaration</span>;
      case 'excellent':
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">✨ Excellent</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-400 border border-green-500/20 whitespace-nowrap">✓ Conforme</span>;
    }
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

  const formatNumber = (value: number) => {
    return Math.round(value * 10) / 10;
  };

  const formatPercent = (value: number) => {
    return value.toFixed(1) + "%";
  };

  return (
    <div className="space-y-6">
      {/* Card synthèse - style inspiré de "Traitement en cours" */}
      <div className="card-surface p-6">
        {/* Header compact */}
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-cursor-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-cursor-text-primary">Analyse terminée</h2>
            <p className="text-sm text-cursor-text-secondary">
              {totalAnalyzed} intervenants réseaux analysés • {minMissions}+ mission{minMissions > 1 ? 's' : ''} (3 derniers mois)
            </p>
          </div>
        </div>

        {/* Statistiques en une seule card */}
        <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-3">
          {/* Anomalies détectées */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-cursor-text-secondary">Anomalies RI</span>
            <span className="text-sm font-semibold text-red-400">{withWarning} sous-déclarations ({fraudPercentage}%)</span>
          </div>

          {/* Barre de progression */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cursor-text-muted">Taux de fraude potentielle</span>
              <span className="text-blue-400 font-semibold tabular-nums">{fraudPercentage}%</span>
            </div>
            <div className="w-full bg-cursor-bg-tertiary rounded-full h-2 overflow-hidden border border-cursor-border-primary/30">
              <div 
                className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(100, parseFloat(fraudPercentage))}%`,
                  maxWidth: '100%'
                }}
              ></div>
            </div>
          </div>

          {/* Statistiques compactes */}
          <div className="pt-3 border-t border-blue-500/10 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-400">{totalAnalyzed}</div>
              <div className="text-xs text-cursor-text-muted">Analysés</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-400">{withWarning}</div>
              <div className="text-xs text-cursor-text-muted">Anomalies</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">{totalAnalyzed - withWarning}</div>
              <div className="text-xs text-cursor-text-muted">Conformes</div>
            </div>
          </div>
        </div>

        {/* Bouton export sobre */}
        <div className="mt-4">
          <button
            onClick={exportToCSV}
            className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exporter en Excel (synthèse + détails par assureur)</span>
          </button>
        </div>
      </div>

      {/* Tableau des résultats */}
      <div className="card-surface overflow-hidden transition-all duration-500 ease-out hover:mx-[-10%] hover:shadow-2xl hover:shadow-blue-500/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cursor-bg-tertiary border-b border-cursor-border-primary/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">Rang</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">SIRET</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">Dénomination</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">Missions</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">RI Théo.</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">RI Réel</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">Écart %</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-cursor-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cursor-border-primary/20">
              {paginatedResults.map((result) => {
                const isExpanded = expandedSirets.has(result.siret);
                const hasDetails = result.detailsByPrescripteur && result.detailsByPrescripteur.length > 0;
                
                return (
                  <React.Fragment key={result.siret}>
                    <tr 
                      className={`transition-colors ${hasDetails ? 'cursor-pointer hover:bg-cursor-bg-tertiary/50' : ''}`}
                      onClick={() => hasDetails && toggleExpanded(result.siret)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-cursor-text-primary tabular-nums">
                        #{result.ranking}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-cursor-text-primary">
                        {result.siret}
                      </td>
                      <td className="px-6 py-4 text-sm text-cursor-text-primary">
                        {result.denomination}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-cursor-text-primary tabular-nums">
                        {result.totalMissionsDU}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-cursor-text-secondary tabular-nums">
                        {result.riTheorique.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-cursor-text-primary tabular-nums">
                        {result.riReel}
                      </td>
                      <td className={`px-6 py-4 text-sm text-right tabular-nums ${getEcartColor(result.ecartPercent)}`}>
                        {result.ecartPercent >= 0 ? '+' : ''}{result.ecartPercent.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {getStatusBadge(result.status)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasDetails && (
                          <div className="inline-flex items-center gap-1 px-3 py-1 text-sm text-cursor-text-primary">
                            <svg
                              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
                            <span>{result.detailsByPrescripteur.length}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {/* Ligne expandée pour afficher les détails par assureur */}
                    {isExpanded && hasDetails && (
                      <tr className="bg-cursor-bg-secondary/50">
                        <td colSpan={9} className="px-6 py-6">
                          <div className="ml-8">
                            <div className="flex items-center gap-2 mb-3">
                              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              <h4 className="text-sm font-semibold text-cursor-text-primary">
                                Détails par prescripteur ({result.detailsByPrescripteur.length})
                              </h4>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full border border-cursor-border-primary rounded-lg overflow-hidden">
                                <thead className="bg-cursor-bg-tertiary">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-cursor-text-secondary">
                                      Prescripteur
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-cursor-text-secondary">
                                      Missions reçues
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-cursor-text-secondary">
                                      RI théorique
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-cursor-text-secondary">
                                      RI déclaré
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-cursor-text-secondary">
                                      Écart %
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {result.detailsByPrescripteur.map((detail, index) => (
                                    <tr
                                      key={detail.prescripteurId}
                                      className={`${
                                        index % 2 === 0 ? 'bg-cursor-bg-primary' : 'bg-cursor-bg-secondary'
                                      } border-t border-cursor-border-primary`}
                                    >
                                      <td className="px-6 py-3 text-sm text-cursor-text-primary">
                                        <div className="font-medium">{detail.prescripteurName}</div>
                                        <div className="text-cursor-text-muted text-xs">ID: {detail.prescripteurId}</div>
                                      </td>
                                      <td className="px-6 py-3 text-sm text-right text-cursor-text-primary tabular-nums">
                                        {detail.missionsDU}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-right text-cursor-text-secondary tabular-nums">
                                        {formatNumber(detail.riTheorique)}
                                      </td>
                                      <td className="px-6 py-3 text-sm text-right text-cursor-text-primary tabular-nums">
                                        {detail.riReel}
                                      </td>
                                      <td
                                        className={`px-6 py-3 text-sm text-right font-medium tabular-nums ${
                                          detail.ecartPercent < thresholds.warningThreshold
                                            ? 'text-red-400'
                                            : detail.ecartPercent > thresholds.excellentThreshold
                                            ? 'text-blue-400'
                                            : 'text-green-400'
                                        }`}
                                      >
                                        {detail.ecartPercent >= 0 ? '+' : ''}
                                        {formatPercent(detail.ecartPercent)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-cursor-border-primary bg-cursor-bg-tertiary flex items-center justify-between">
            <div className="text-sm text-cursor-text-secondary">
              Affichage de {startIndex + 1} à {Math.min(endIndex, totalAnalyzed)} sur {totalAnalyzed} résultats
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm text-cursor-text-primary bg-cursor-bg-primary border border-cursor-border-primary rounded hover:bg-cursor-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Précédent
              </button>
              <span className="text-sm text-cursor-text-secondary">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm text-cursor-text-primary bg-cursor-bg-primary border border-cursor-border-primary rounded hover:bg-cursor-bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="card-surface p-4">
        <h3 className="text-sm font-semibold text-cursor-text-primary mb-3">Légende</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-4 h-4 rounded bg-red-500/20 border border-red-500/40 mt-0.5"></span>
            <div>
              <div className="font-medium text-red-400">Sous-déclaration</div>
              <div className="text-xs text-cursor-text-muted">Écart &lt; {thresholds.warningThreshold}%</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-4 h-4 rounded bg-green-500/20 border border-green-500/40 mt-0.5"></span>
            <div>
              <div className="font-medium text-green-400">Conforme</div>
              <div className="text-xs text-cursor-text-muted">{thresholds.warningThreshold}% ≤ Écart ≤ +{thresholds.excellentThreshold}%</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0 w-4 h-4 rounded bg-blue-500/20 border border-blue-500/40 mt-0.5"></span>
            <div>
              <div className="font-medium text-blue-400">Excellent</div>
              <div className="text-xs text-cursor-text-muted">Écart &gt; +{thresholds.excellentThreshold}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


