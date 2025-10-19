"use client";
import { useMemo, useState } from "react";
import Papa from "papaparse";
import * as XLSX from 'xlsx';

// Types et utilitaires
import { 
  Checked, 
  EnabledStatuses, 
  DEFAULT_ENABLED_STATUSES,
  SubcontractorData
} from "@/lib/types";
import { createAmountMap, enrichWithAmounts, calculateTotalAmount } from "../lib/amount-utils";
import { useFileProcessing } from "@/lib/hooks/useFileProcessing";
import { useApiStreaming } from "@/lib/hooks/useApiStreaming";
import { useBodaccEnrichment } from "@/lib/hooks/useBodaccEnrichment";

// Composants
import { StatusSelector } from "@/components/StatusSelector";
import { FileUploader } from "@/components/FileUploader";
import { ResultsTable } from "@/components/ResultsTable";

export default function Home() {
  // État principal
  const [checked, setChecked] = useState<Checked[] | null>(null);
  const [enabledStatuses, setEnabledStatuses] = useState<EnabledStatuses>(DEFAULT_ENABLED_STATUSES);
  const [loading, setLoading] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);

  // Hooks personnalisés
  const fileProcessing = useFileProcessing();
  const apiStreaming = useApiStreaming();
  const bodaccEnrichment = useBodaccEnrichment();

  // Calculs dérivés
  const siretList = useMemo(() => {
    const key = fileProcessing.headerMap.siret;
    if (!key) return [] as string[];
    return fileProcessing.rows.map((r) => (r[key] || "").toString());
  }, [fileProcessing.rows, fileProcessing.headerMap]);

  const phoneList = useMemo(() => {
    const key = fileProcessing.headerMap.phone || fileProcessing.headerMap.siret;
    if (!key || fileProcessing.detectionType !== 'phone') return [] as string[];
    return fileProcessing.rows.map((r) => (r[key] || "").toString());
  }, [fileProcessing.rows, fileProcessing.headerMap, fileProcessing.detectionType]);

  // Mapping des montants
  const csvAmountMap = useMemo(() => {
    return createAmountMap(
      fileProcessing.rows, 
      fileProcessing.headerMap, 
      fileProcessing.detectionType
    );
  }, [fileProcessing.rows, fileProcessing.headerMap, fileProcessing.detectionType]);

  // Données filtrées et statistiques - radiées ou en procédure
  const filtered = useMemo(() => {
    const sourceData = apiStreaming.streamingProgress 
      ? enrichWithAmounts(apiStreaming.streamingResults, csvAmountMap)
      : (checked ?? []);
    
    // Log pour BLANQUART spécifiquement
    const blanquartItem = sourceData.find(item => item.siret === '38076713700017');
    if (blanquartItem) {
      console.log('[DEBUG] BLANQUART in filtered sourceData:', blanquartItem);
    }
    
    const filteredData = sourceData.filter(item => item.estRadiee || item.hasActiveProcedures);
    console.log('[DEBUG] Total filtered items:', filteredData.length);
    
    return filteredData;
  }, [checked, apiStreaming.streamingResults, apiStreaming.streamingProgress, csvAmountMap]);

  const stats = useMemo(() => {
    const sourceData = apiStreaming.streamingProgress 
      ? apiStreaming.streamingResults 
      : (checked ?? []);
    if (!sourceData.length && !apiStreaming.streamingProgress) return null;
    
    const total = apiStreaming.streamingProgress ? apiStreaming.streamingProgress.total : sourceData.length;
    const radiees = sourceData.filter((r) => r.estRadiee).length;
    const enProcedure = sourceData.filter((r) => r.hasActiveProcedures).length;
    const radieesOuEnProcedure = sourceData.filter((r) => r.estRadiee || r.hasActiveProcedures).length;
    const actives = sourceData.length - radieesOuEnProcedure;
    
    return { 
      total, 
      radiees, 
      enProcedure,
      radieesOuEnProcedure,
      actives, 
      current: sourceData.length 
    };
  }, [checked, apiStreaming.streamingResults, apiStreaming.streamingProgress]);

  // Calcul du montant total
  const totalAmount = useMemo(() => {
    const sourceData = apiStreaming.streamingProgress 
      ? enrichWithAmounts(apiStreaming.streamingResults, csvAmountMap)
      : (checked ?? []);
    return calculateTotalAmount(sourceData);
  }, [checked, apiStreaming.streamingResults, apiStreaming.streamingProgress, csvAmountMap]);

  // Fonctions de traitement
  const resetProcess = () => {
    setChecked(null);
    apiStreaming.reset();
    fileProcessing.reset();
    bodaccEnrichment.resetEnrichment();
  };

  const runBaseProcess = async () => {
    setLoading(true);
    apiStreaming.startScan();
    setChecked(null);
    
    try {
      // Traiter toute la base sous-traitants avec les filtres de statut
      const joinRes = await fetch("/api/join/simple-join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sirets: [], // Liste vide = traiter toute la base
          enabledStatuses: enabledStatuses
        }),
      });
      
      if (!joinRes.ok) {
        throw new Error(`Erreur API: ${joinRes.status} ${joinRes.statusText}`);
      }
      
      const joinJson = await joinRes.json();
      const joinResult = joinJson.result;
      
      if (!joinResult || !joinResult.matched) {
        throw new Error('Structure de réponse API invalide');
      }
      
      // Afficher immédiatement les résultats de la jointure
        const baseResults: Checked[] = joinResult.matched.map((item: SubcontractorData) => ({
        siret: (item.siret || item.Siret || item.SIRET || '').toString(),
        denomination: item.name || item.denomination || item.Denomination || 'N/A',
        estRadiee: false, // Temporairement actives, sera vérifié via API
        dateCessation: null,
        phone: item.phone_mobile || item.phone || item.tel,
        status_reseau: item.status_reseau,
        fichier_source: 'Base sous-traitants',
        montant: 0 // Sera assigné par enrichWithAmounts
      }));
      
      setChecked(enrichWithAmounts(baseResults, csvAmountMap));
      
      // Vérifier le statut de toutes les entreprises via l'API SIRENE
      const allSirets = baseResults.map(item => item.siret).filter(Boolean);
      console.log('[DEBUG] All SIRETs to check:', allSirets.length, allSirets.slice(0, 5));
      
      if (allSirets.length > 0) {
        console.log('[DEBUG] About to call streamApiResults...');
        const apiResults = await apiStreaming.streamApiResults(
          allSirets,
          baseResults.map(b => ({ siret: b.siret, phone: b.phone }))
        );
        
        console.log('[DEBUG] API Results received:', apiResults);
        console.log('[DEBUG] API Results for BLANQUART:', apiResults.find(r => r.siret === '38076713700017'));
        
        // Combiner les résultats avec les données de la base
        const allResults = baseResults.map(baseItem => {
          const apiItem = apiResults.find((api: Checked) => api.siret === baseItem.siret);
          if (apiItem) {
            const combined = {
              ...baseItem,
              estRadiee: apiItem.estRadiee,
              dateCessation: apiItem.dateCessation,
              error: apiItem.error,
              // Copier les propriétés BODACC
              procedure: apiItem.procedure,
              procedureType: apiItem.procedureType,
              hasActiveProcedures: apiItem.hasActiveProcedures,
              bodaccError: apiItem.bodaccError
            };
            
            // Log pour BLANQUART spécifiquement
            if (baseItem.siret === '38076713700017') {
              console.log('[DEBUG] BLANQUART - API Item:', apiItem);
              console.log('[DEBUG] BLANQUART - Combined:', combined);
            }
            
            return combined;
          }
          return baseItem;
        });
        
        const enrichedResults = enrichWithAmounts(allResults, csvAmountMap);
        setChecked(enrichedResults);
        
        // Enrichir avec les données BODACC (temporairement désactivé)
        // console.log('Starting BODACC enrichment...');
        // try {
        //   const bodaccEnrichedResults = await bodaccEnrichment.enrichWithBodacc(enrichedResults);
        //   setChecked(bodaccEnrichedResults);
        // } catch (bodaccError) {
        //   console.warn('BODACC enrichment failed, continuing with SIRENE data only:', bodaccError);
        //   // Garder les résultats SIRENE même si BODACC échoue
        // }
      }

    } catch (error) {
      console.error('Erreur lors du traitement de la base:', error);
    } finally {
      setLoading(false);
    }
  };

  const runCompleteProcess = async () => {
    console.log('[DEBUG] runCompleteProcess called!');
    console.log('[DEBUG] fileProcessing.rows.length:', fileProcessing.rows.length);
    console.log('[DEBUG] siretList.length:', siretList.length);
    console.log('[DEBUG] phoneList.length:', phoneList.length);
    
    // Si aucun fichier n'est chargé et aucun SIRET spécifique, on traite toute la base
    if (fileProcessing.rows.length === 0 && siretList.length === 0 && phoneList.length === 0) {
      console.log('[DEBUG] Calling runBaseProcess...');
      return runBaseProcess();
    }
    
    setLoading(true);
    apiStreaming.startScan();
    setChecked(null);
    
    try {
      let joinResult: { matched: SubcontractorData[]; unmatched: { siret: string }[] };
      
      if (fileProcessing.detectionType === 'phone') {
        // Cas téléphone : utiliser l'API de jointure par téléphone
        console.log('[DEBUG] Phone detection - phoneList length:', phoneList.length);
        console.log('[DEBUG] Phone detection - first 3 phones:', phoneList.slice(0, 3));
        console.log('[DEBUG] Phone detection - enabledStatuses:', enabledStatuses);
        
        if (phoneList.length === 0) {
          throw new Error('Aucun numéro de téléphone détecté dans le fichier');
        }
        
        const phoneJoinData = {
          phones: phoneList,
          enabledStatuses: enabledStatuses
        };

        const joinRes = await fetch("/api/join/phone-join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(phoneJoinData),
        });
        
        if (!joinRes.ok) {
          const errorText = await joinRes.text();
          console.error('[DEBUG] API Error response:', errorText);
          throw new Error(`Erreur API: ${joinRes.status} ${joinRes.statusText} - ${errorText}`);
        }
        
        const joinJson = await joinRes.json() as { result: { matched: SubcontractorData[]; unmatched: { siret: string }[] } };
        joinResult = joinJson.result;
      } else {
        // Cas SIRET : utiliser l'API de jointure classique
        const joinData = { 
          sirets: siretList,
          enabledStatuses: enabledStatuses
        };

        // Si un fichier CSV est chargé, l'utiliser comme base
        if (fileProcessing.rows.length > 0) {
          const csvContent = Papa.unparse(fileProcessing.rows);
          (joinData as { sirets: string[]; enabledStatuses: EnabledStatuses; csvData?: string }).csvData = csvContent;
        }

        const joinRes = await fetch("/api/join/simple-join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(joinData),
        });
        
        if (!joinRes.ok) {
          throw new Error(`Erreur API: ${joinRes.status} ${joinRes.statusText}`);
        }
        
        const joinJson = await joinRes.json() as { result: { matched: SubcontractorData[]; unmatched: { siret: string }[] } };
        joinResult = joinJson.result;
      }
      
      if (!joinResult || !joinResult.matched) {
        throw new Error('Structure de réponse API invalide');
      }
      
      // Afficher immédiatement les résultats de la jointure
        const baseResults: Checked[] = joinResult.matched.map((item: SubcontractorData) => ({
        siret: (item.siret || item.Siret || item.SIRET || '').toString(),
        denomination: item.name || item.denomination || item.Denomination || 'N/A',
        estRadiee: false,
        dateCessation: null,
        phone: item.phone_mobile || item.phone || item.tel,
        status_reseau: item.status_reseau,
        fichier_source: 'Base sous-traitants',
        montant: 0
      }));
      
      setChecked(enrichWithAmounts(baseResults, csvAmountMap));
      
      // Vérification SIRENE
      if (fileProcessing.detectionType === 'phone') {
        const allSirets = baseResults.map(item => item.siret).filter(Boolean);
        
        if (allSirets.length > 0) {
          console.log('[DEBUG] PHONE DETECTION - About to call streamApiResults...');
          const apiResults = await apiStreaming.streamApiResults(
            allSirets,
            baseResults.map(b => ({ siret: b.siret, phone: b.phone }))
          );
          
          const allResults = baseResults.map(baseItem => {
            const apiItem = apiResults.find((api: Checked) => api.siret === baseItem.siret);
            if (apiItem) {
              return {
                ...baseItem,
                estRadiee: apiItem.estRadiee,
                dateCessation: apiItem.dateCessation,
                error: apiItem.error
              };
            }
            return baseItem;
          });
          
          setChecked(enrichWithAmounts(allResults, csvAmountMap));
        }
      } else {
        const unmatchedSirets = joinResult.unmatched.map((item: { siret: string }) => item.siret).filter(Boolean);
        
        if (unmatchedSirets.length > 0) {
          console.log('[DEBUG] UNMATCHED - About to call streamApiResults...');
          const apiResults = await apiStreaming.streamApiResults(
            unmatchedSirets,
            baseResults.map(b => ({ siret: b.siret, phone: b.phone }))
          );
          const allResults = [...baseResults, ...apiResults];
          const enrichedResults = enrichWithAmounts(allResults, csvAmountMap);
          setChecked(enrichedResults);
          
          // Enrichir avec les données BODACC (temporairement désactivé)
          // console.log('Starting BODACC enrichment...');
          // try {
          //   const bodaccEnrichedResults = await bodaccEnrichment.enrichWithBodacc(enrichedResults);
          //   setChecked(bodaccEnrichedResults);
          // } catch (bodaccError) {
          //   console.warn('BODACC enrichment failed, continuing with SIRENE data only:', bodaccError);
          //   // Garder les résultats SIRENE même si BODACC échoue
          // }
        } else {
          const allSirets = baseResults.map(item => item.siret).filter(Boolean);
          
          if (allSirets.length > 0) {
            const apiResults = await apiStreaming.streamApiResults(
              allSirets,
              baseResults.map(b => ({ siret: b.siret, phone: b.phone }))
            );
            
            const allResults = baseResults.map(baseItem => {
              const apiItem = apiResults.find((api: Checked) => api.siret === baseItem.siret);
              if (apiItem) {
                return {
                  ...baseItem,
                  estRadiee: apiItem.estRadiee,
                  dateCessation: apiItem.dateCessation,
                  error: apiItem.error
                };
              }
              return baseItem;
            });
            
            const enrichedResults = enrichWithAmounts(allResults, csvAmountMap);
            setChecked(enrichedResults);
            
            // Enrichir avec les données BODACC (temporairement désactivé)
            // console.log('Starting BODACC enrichment...');
            // try {
            //   const bodaccEnrichedResults = await bodaccEnrichment.enrichWithBodacc(enrichedResults);
            //   setChecked(bodaccEnrichedResults);
            // } catch (bodaccError) {
            //   console.warn('BODACC enrichment failed, continuing with SIRENE data only:', bodaccError);
            //   // Garder les résultats SIRENE même si BODACC échoue
            // }
          }
        }
      }

    } catch (error) {
      console.error('Erreur lors de la vérification:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour exporter les résultats en Excel
  const exportToExcel = () => {
    if (!filtered.length) {
      alert('Aucune donnée à exporter');
      return;
    }

    const exportData = filtered.map(item => ({
      'SIRET': item.siret,
      'Dénomination': item.denomination || '',
      'Téléphone': item.phone || '',
      'Statut': item.estRadiee ? 'Radiée' : 'Active',
      'Date cessation': item.dateCessation || '',
      'Procédure': item.procedure || '',
      'Type procédure': item.procedureType || '',
      'En procédure active': item.hasActiveProcedures ? 'Oui' : 'Non',
      ...(fileProcessing.headerMap.montant && { 'Montant (€)': item.montant || 0 }),
      'Source': item.fichier_source || 'API',
      'Erreur': item.error || '',
      'Erreur BODACC': item.bodaccError || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const colWidths = [
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, 
      { wch: 25 }, { wch: 20 }, { wch: 18 },
      ...(fileProcessing.headerMap.montant ? [{ wch: 12 }] : []),
      { wch: 20 }, { wch: 20 }, { wch: 20 }
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Entreprises radiees');
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const fileName = `entreprises_radiees_et_en_procedure_${dateStr}.xlsx`;
    
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="min-h-screen bg-cursor-bg-primary">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Title section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-cursor-text-primary mb-2">
            Scan des sous-traitants
          </h1>
          <p className="text-cursor-text-secondary">
            Analyse du statut administratif des entreprises
          </p>
        </div>
        {/* CURSOR-style main interface - single card like CURSOR */}
        <div className="card-surface p-6 mb-6">
          <div className="space-y-6">
            {/* Configuration section */}
            <StatusSelector 
              enabledStatuses={enabledStatuses}
              onStatusChange={setEnabledStatuses}
            />

            {/* File upload section */}
            <FileUploader
              onFileProcessed={fileProcessing.processFile}
              rows={fileProcessing.rows}
              headerMap={fileProcessing.headerMap}
              detectionType={fileProcessing.detectionType}
              onHeaderMapChange={fileProcessing.setHeaderMap}
            />
            
            {/* CURSOR-style action button - single prominent button */}
            <div className="pt-4 border-t border-cursor-border-primary">
              <button
                onClick={runCompleteProcess}
                disabled={loading}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="spinner-cursor"></div>
                    <span>Analyse en cours...</span>
                  </>
                ) : (
                  <span>Lancez l&apos;analyse</span>
                )}
              </button>
              
              {/* Secondary actions - minimal like CURSOR */}
              <div className="flex items-center justify-center gap-3 mt-3">
                {apiStreaming.isScanning && (
                  <button
                    onClick={apiStreaming.stopScan}
                    className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
                  >
                    Arrêter
                  </button>
                )}
                {checked && (
                  <button
                    onClick={resetProcess}
                    disabled={loading}
                    className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CURSOR-style file info - minimal like CURSOR */}
          {fileProcessing.rows.length > 0 && (
            <div className="mt-4">
              {/* Toggle button */}
              <button
                onClick={() => setShowDetailedInfo(!showDetailedInfo)}
                className="text-sm text-cursor-text-secondary hover:text-cursor-text-primary transition-colors mb-2"
              >
                {showDetailedInfo ? '▼' : '▶'} Voir plus d&apos;information
              </button>
              
              {/* Detailed info section - collapsible */}
              {showDetailedInfo && (
                <div className="p-3 bg-cursor-bg-tertiary rounded border border-cursor-border-primary">
                  <div className="text-sm text-cursor-text-secondary space-y-1">
                    {fileProcessing.detectionType === 'siret' && siretList.length > 0 ? (
                      <div>{siretList.length} SIRET détectés • Colonne: <span className="font-mono text-cursor-text-primary">
                        {fileProcessing.headerMap.siret?.startsWith('col_') 
                          ? `Colonne ${parseInt(fileProcessing.headerMap.siret.replace('col_', '')) + 1}` 
                          : fileProcessing.headerMap.siret}
                      </span></div>
                    ) : fileProcessing.detectionType === 'phone' && phoneList.length > 0 ? (
                      <div>
                        {phoneList.length} numéros détectés • Colonne: <span className="font-mono text-cursor-text-primary">
                          {fileProcessing.headerMap.siret?.startsWith('col_') 
                            ? `Colonne ${parseInt(fileProcessing.headerMap.siret.replace('col_', '')) + 1}` 
                            : fileProcessing.headerMap.siret}
                        </span>
                        <br/>
                        <span className="text-xs text-cursor-text-muted">Jointure avec la base pour enrichir les SIRETs</span>
                      </div>
                    ) : (
                      <div className="text-cursor-text-muted">
                        Aucune donnée valide détectée dans <span className="font-mono">
                          {fileProcessing.headerMap.siret?.startsWith('col_') 
                            ? `Colonne ${parseInt(fileProcessing.headerMap.siret.replace('col_', '')) + 1}` 
                            : fileProcessing.headerMap.siret}
                        </span>
                      </div>
                    )}
                    
                    {fileProcessing.headerMap.montant && (
                      <div>
                        Colonne montant: <span className="font-mono text-cursor-text-primary">
                          {fileProcessing.headerMap.montant.startsWith('col_') 
                            ? `Colonne ${parseInt(fileProcessing.headerMap.montant.replace('col_', '')) + 1}` 
                            : fileProcessing.headerMap.montant}
                        </span> • <span className="text-cursor-accent-green">Calcul automatique activé</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Statistiques BODACC */}
        {bodaccEnrichment.enrichmentStats && (
          <div className="card-surface p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-cursor-text-primary">Enrichissement BODACC</h3>
              {bodaccEnrichment.isEnriching && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-cursor-text-secondary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-cursor-text-secondary">En cours...</span>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-semibold text-cursor-text-primary">
                  {bodaccEnrichment.enrichmentStats.total}
                </div>
                <div className="text-sm text-cursor-text-secondary">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-cursor-accent-orange">
                  {bodaccEnrichment.enrichmentStats.withProcedures}
                </div>
                <div className="text-sm text-cursor-text-secondary">Avec procédures</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-cursor-accent-red">
                  {bodaccEnrichment.enrichmentStats.withActiveProcedures}
                </div>
                <div className="text-sm text-cursor-text-secondary">En procédure active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-cursor-text-muted">
                  {bodaccEnrichment.enrichmentStats.errors}
                </div>
                <div className="text-sm text-cursor-text-secondary">Erreurs</div>
              </div>
            </div>
            {bodaccEnrichment.error && (
              <div className="mt-4 p-3 bg-cursor-bg-tertiary border border-cursor-border-primary rounded">
                <div className="text-sm text-cursor-text-muted">
                  Erreur BODACC: {bodaccEnrichment.error}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CURSOR-style streaming progress */}
        {apiStreaming.streamingProgress && (
          <div className="card-surface p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-cursor-text-primary">Vérification en cours</h3>
              <div className="flex items-center gap-3">
                <div className="text-sm text-cursor-text-secondary">
                  {apiStreaming.streamingProgress.current} / {apiStreaming.streamingProgress.total}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-cursor-text-secondary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-cursor-text-secondary">{apiStreaming.streamingProgress.message}</span>
              </div>
              <div className="w-full bg-cursor-bg-tertiary rounded-full h-2">
                <div 
                  className="bg-cursor-accent-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(apiStreaming.streamingProgress.current / apiStreaming.streamingProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}


        {/* CURSOR-style total amount card */}
        {fileProcessing.headerMap.montant && filtered.length > 0 && (
          <div className="card-surface p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-cursor-text-primary">Montant total</h3>
                <p className="text-sm text-cursor-text-secondary">Entreprises radiées et en procédure</p>
                {fileProcessing.headerMap.montant && (
                  <p className="text-xs text-cursor-text-muted mt-1">
                    Colonne &quot;{fileProcessing.headerMap.montant.startsWith('col_') 
                      ? `Colonne ${parseInt(fileProcessing.headerMap.montant.replace('col_', '')) + 1}` 
                      : fileProcessing.headerMap.montant}&quot;
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-cursor-text-primary">
                  {totalAmount.toLocaleString('fr-FR', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} €
                </div>
                <div className="text-sm text-cursor-text-secondary">
                  {filtered.length} entreprise{filtered.length > 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des résultats */}
        {(checked || apiStreaming.streamingResults.length > 0) && (
          <ResultsTable
            filtered={filtered}
            headerMap={fileProcessing.headerMap}
            streamingProgress={apiStreaming.streamingProgress}
            stats={stats}
            onExport={exportToExcel}
          />
        )}
      </div>
    </div>
  );
}