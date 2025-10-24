"use client";
import { useState, useMemo, useEffect } from "react";
import { RIAnomalyResult, RIThresholds, DEFAULT_RI_THRESHOLDS } from "@/lib/treatments/ri-anomalies/types";

interface Metier {
  id: number;
  name: string;
}

interface RIAnomalyResultsProps {
  results: RIAnomalyResult[];
  thresholds?: RIThresholds;
}

export function RIAnomalyResults({ results, thresholds = DEFAULT_RI_THRESHOLDS }: RIAnomalyResultsProps) {
  const [expandedSirets, setExpandedSirets] = useState<Set<string>>(new Set());
  const [selectedMetiers, setSelectedMetiers] = useState<number[]>([]);
  const [metiers, setMetiers] = useState<Metier[]>([]);
  const [metiersDropdownOpen, setMetiersDropdownOpen] = useState(false);
  const [filtersInHeader, setFiltersInHeader] = useState(false);

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

  // Detect when filters should move to header
  useEffect(() => {
    const handleScroll = () => {
      // Check if we've scrolled past the filters section (roughly 300px)
      setFiltersInHeader(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  const toggleMetier = (metierId: number) => {
    setSelectedMetiers(prev => {
      if (prev.includes(metierId)) {
        return prev.filter(id => id !== metierId);
      } else {
        return [...prev, metierId];
      }
    });
  };

  const resetFilters = () => {
    setSelectedMetiers([]);
  };

  // Calculate global statistics with filtered results
  const globalStats = {
    totalCompanies: filteredResults.length,
    totalMissions: filteredResults.reduce((sum, r) => sum + r.totalMissionsDU, 0),
    totalRITheorique: filteredResults.reduce((sum, r) => sum + r.riTheorique, 0),
    totalRIReel: filteredResults.reduce((sum, r) => sum + r.riReel, 0),
    warnings: filteredResults.filter(r => r.status === 'warning').length,
    conformes: filteredResults.filter(r => r.status === 'ok').length,
    excellents: filteredResults.filter(r => r.status === 'excellent').length,
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

  // Calculate fraud percentage
  const fraudPercentage = globalStats.totalCompanies > 0 
    ? ((globalStats.warnings / globalStats.totalCompanies) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="animate-fade-in-scale">
      {/* Card synthèse - Analyse terminée */}
      <div className="animated-border-green mb-6">
        <div className="animated-border-green-content p-6">
          {/* Header avec icône */}
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-6 h-6 text-cursor-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-cursor-text-primary">Analyse terminée</h2>
              <p className="text-sm text-cursor-text-secondary">
                {globalStats.totalCompanies} intervenant{globalStats.totalCompanies > 1 ? 's' : ''} réseaux analysé{globalStats.totalCompanies > 1 ? 's' : ''} • {globalStats.totalMissions} mission{globalStats.totalMissions > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Statistiques avec barre de progression */}
          <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10 space-y-3">
            {/* Anomalies détectées */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-cursor-text-secondary">Anomalies RI</span>
              <span className="text-sm font-semibold text-red-400">{globalStats.warnings} sous-déclaration{globalStats.warnings > 1 ? 's' : ''} ({fraudPercentage}%)</span>
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

            {/* Statistiques compactes - style batch */}
            <div className="pt-3 border-t border-blue-500/10 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">{globalStats.totalCompanies}</div>
                <div className="text-xs text-cursor-text-muted">Analysés</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{globalStats.warnings}</div>
                <div className="text-xs text-cursor-text-muted">Anomalies</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{globalStats.conformes + globalStats.excellents}</div>
                <div className="text-xs text-cursor-text-muted">Conformes</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres dans le header sticky (apparaissent au scroll) */}
      <div className="sticky-header -mx-6 transition-all duration-500 ease-out group-hover/tablegroup:mx-[-10%]">
        <div className={`
          transition-all duration-300 ease-out overflow-hidden
          ${filtersInHeader ? 'max-h-28 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'}
        `}>
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
                    ? "Filtrer par métier" 
                    : `${selectedMetiers.length} métier${selectedMetiers.length > 1 ? 's' : ''} sélectionné${selectedMetiers.length > 1 ? 's' : ''}`
                  }
                </span>
                <svg 
                  className={`w-5 h-5 text-cursor-text-secondary transition-transform ${metiersDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {metiersDropdownOpen && (
                <div className="absolute z-50 mt-2 w-full bg-[#1E1E1E] border border-cursor-border-primary rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {metiers.map(metier => (
                    <div
                      key={metier.id}
                      className="px-4 py-2 hover:bg-cursor-hover transition-colors cursor-pointer border-b border-cursor-border-primary last:border-b-0"
                    >
                      <button
                        onClick={() => toggleMetier(metier.id)}
                        className="w-full flex items-center justify-between"
                      >
                        <span className="text-sm text-cursor-text-primary">{metier.name}</span>
                        <div className={`
                          relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                          ${selectedMetiers.includes(metier.id) ? 'bg-blue-500' : 'bg-cursor-bg-tertiary border border-cursor-border-primary'}
                        `}>
                          <span className={`
                            inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                            ${selectedMetiers.includes(metier.id) ? 'translate-x-5' : 'translate-x-0.5'}
                          `} />
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedMetiers.length > 0 && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-cursor-text-primary bg-cursor-bg-tertiary hover:bg-cursor-hover border border-cursor-border-primary rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Réinitialiser
            </button>
          )}
        </div>

        {selectedMetiers.length > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
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
      </div>

      {/* Filtres et résultats - Card principale */}
      <div className="card-surface mb-6 group/tablegroup overflow-hidden transition-all duration-500 ease-out hover:mx-[-10%] hover:shadow-2xl hover:shadow-blue-500/10">
        <div className="p-6">

        {/* Filtres normaux (visibles par défaut) */}
        <div className={`
          -mx-6 px-6 py-4 bg-cursor-bg-secondary border-b border-cursor-border-primary/30 mb-6 transition-all duration-300 ease-out
          ${filtersInHeader ? 'opacity-0 -translate-y-4 pointer-events-none h-0 mb-0 p-0 border-0 overflow-hidden' : 'opacity-100 translate-y-0'}
        `}>
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E1E1E] border border-cursor-border-primary rounded-lg shadow-xl max-h-80 overflow-y-auto z-30">
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
              className="px-4 py-2 text-sm font-medium text-cursor-text-primary bg-cursor-bg-tertiary hover:bg-cursor-hover border border-cursor-border-primary rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Statistiques détaillées (seulement si plusieurs résultats) */}
      {filteredResults.length > 1 && (
        <div className="card-surface p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-cursor-bg-tertiary rounded-lg">
              <div className="text-lg font-bold text-blue-400">{globalStats.totalMissions}</div>
              <div className="text-xs text-cursor-text-muted mt-1">Total Missions</div>
            </div>
            <div className="text-center p-3 bg-cursor-bg-tertiary rounded-lg">
              <div className="text-lg font-bold text-purple-400">{formatNumber(globalStats.totalRITheorique)}</div>
              <div className="text-xs text-cursor-text-muted mt-1">RI Théorique</div>
            </div>
            <div className="text-center p-3 bg-cursor-bg-tertiary rounded-lg">
              <div className="text-lg font-bold text-green-400">{globalStats.totalRIReel}</div>
              <div className="text-xs text-cursor-text-muted mt-1">RI Déclaré</div>
            </div>
            <div className="text-center p-3 bg-cursor-bg-tertiary rounded-lg">
              <div className="text-lg font-bold text-blue-400">{globalStats.excellents}</div>
              <div className="text-xs text-cursor-text-muted mt-1">✨ Excellents</div>
            </div>
          </div>
        </div>
      )}

        {/* Individual Results */}
        <div className="space-y-4">
          {filteredResults.map(renderResultCard)}
        </div>
        </div>
      </div>
    </div>
  );
}

