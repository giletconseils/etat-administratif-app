import React, { useState, useMemo, useEffect } from "react";
import { RIAnomalyResult, RIThresholds, DEFAULT_RI_THRESHOLDS } from "@/lib/treatments/ri-anomalies/types";
import * as XLSX from 'xlsx';

interface Metier {
  id: number;
  name: string;
}

interface RIAnomalyBatchResultsProps {
  results: RIAnomalyResult[];
  minMissions?: number;
  thresholds?: RIThresholds;
}

export function RIAnomalyBatchResults({ results, minMissions = 5, thresholds = DEFAULT_RI_THRESHOLDS }: RIAnomalyBatchResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedSirets, setExpandedSirets] = useState<Set<string>>(new Set());
  const [selectedMetiers, setSelectedMetiers] = useState<number[]>([]);
  const [metiers, setMetiers] = useState<Metier[]>([]);
  const [metiersDropdownOpen, setMetiersDropdownOpen] = useState(false);
  const resultsPerPage = 50;

  // Load métiers from API
  useEffect(() => {
    const loadMetiers = async () => {
      try {
        const response = await fetch('/api/data/metiers');
        const data = await response.json();
        if (data.success && data.metiers) {
          setMetiers(data.metiers);
        }
      } catch (error) {
        console.error('Error loading metiers:', error);
      }
    };
    loadMetiers();
  }, []);

  // Filter results by selected métiers
  const filteredResults = useMemo(() => {
    if (selectedMetiers.length === 0) {
      return results;
    }
    return results.filter(result => {
      if (!result.work_ids || result.work_ids.length === 0) return false;
      return result.work_ids.some(workId => selectedMetiers.includes(workId));
    });
  }, [results, selectedMetiers]);

  // Statistiques sur les résultats filtrés
  const totalAnalyzed = filteredResults.length;
  const withWarning = filteredResults.filter(r => r.status === 'warning').length;
  const fraudPercentage = totalAnalyzed > 0 ? (withWarning / totalAnalyzed * 100).toFixed(1) : "0.0";

  // Pagination
  const totalPages = Math.ceil(totalAnalyzed / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const paginatedResults = filteredResults.slice(startIndex, endIndex);

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

  const toggleMetier = (metierId: number) => {
    setSelectedMetiers(prev => {
      if (prev.includes(metierId)) {
        return prev.filter(id => id !== metierId);
      } else {
        return [...prev, metierId];
      }
    });
    setCurrentPage(1); // Reset to first page when filtering
  };

  const resetFilters = () => {
    setSelectedMetiers([]);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Card synthèse - style inspiré de "Traitement en cours" */}
      <div className="card-surface p-6">
        {/* Header compact avec bouton export */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
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
          {/* Bouton export en haut à droite */}
          <button
            onClick={exportToCSV}
            className="btn-standard btn-md btn-primary flex-shrink-0"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Exporter</span>
          </button>
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
      </div>

      {/* Filtres statiques - positionnés au-dessus de la table */}
      <div className="card-surface p-4 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <svg className="w-5 h-5 text-cursor-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <div className="relative flex-1 max-w-md">
              <button
                onClick={() => setMetiersDropdownOpen(!metiersDropdownOpen)}
                className="w-full px-4 py-2 text-left bg-cursor-bg-tertiary border border-cursor-border-primary rounded-lg hover:border-cursor-accent-button transition-colors flex items-center justify-between"
              >
                <span className="text-sm text-cursor-text-primary">
                  {selectedMetiers.length === 0 
                    ? 'Tous les métiers' 
                    : `${selectedMetiers.length} métier${selectedMetiers.length > 1 ? 's' : ''} sélectionné${selectedMetiers.length > 1 ? 's' : ''}`}
                </span>
                <svg className={`w-4 h-4 text-cursor-text-secondary transition-transform ${metiersDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {metiersDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1E1E] border border-cursor-border-primary rounded-lg shadow-xl max-h-80 overflow-y-auto z-[100]">
                  {metiers.map(metier => {
                    const isSelected = selectedMetiers.includes(metier.id);
                    return (
                      <div
                        key={metier.id}
                        onClick={() => toggleMetier(metier.id)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-cursor-bg-secondary cursor-pointer transition-colors"
                      >
                        <span className="text-sm text-cursor-text-primary">{metier.name}</span>
                        {/* Toggle switch */}
                        <button
                          type="button"
                          className={`
                            relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                            ${isSelected ? 'bg-blue-600' : 'bg-cursor-bg-tertiary border border-cursor-border-primary'}
                          `}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMetier(metier.id);
                          }}
                        >
                          <span
                            className={`
                              inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                              ${isSelected ? 'translate-x-5' : 'translate-x-0.5'}
                            `}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {selectedMetiers.length > 0 && (
            <button
              onClick={resetFilters}
              className="btn-standard btn-md btn-secondary"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Réinitialiser
            </button>
          )}
        </div>

        {selectedMetiers.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedMetiers.map(metierId => {
              const metier = metiers.find(m => m.id === metierId);
              if (!metier) return null;
              return (
                <span
                  key={metierId}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs"
                >
                  {metier.name}
                  <button
                    onClick={() => toggleMetier(metierId)}
                    className="hover:text-blue-300 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Tableau des résultats avec effet d'élargissement */}
      <div className="card-surface transition-all duration-500 ease-out group/tablegroup hover:mx-[-20%] hover:shadow-2xl hover:shadow-blue-500/10">

        {/* Tableau des résultats */}
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
                      className={`clickable-row ${hasDetails ? 'cursor-pointer' : ''}`}
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
                              className={`w-4 h-4 expand-icon ${isExpanded ? 'expanded' : ''}`}
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
                          <div className="ml-8 expandable-row-content table-row-expand-enter">
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

    </div>
  );
}


