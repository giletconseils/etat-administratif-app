"use client";
import { useMemo, useState, useEffect } from "react";
import Papa from "papaparse";
import * as XLSX from 'xlsx';

// Types et utilitaires
import { 
  Checked, 
  EnabledStatuses, 
  DEFAULT_ENABLED_STATUSES,
  SubcontractorData
} from "@/lib/types";
import { TreatmentType } from "@/lib/treatments/types";
import { createAmountMap, enrichWithAmounts, calculateTotalAmount } from "../lib/amount-utils";
import { useFileProcessing } from "@/lib/hooks/useFileProcessing";
import { useApiStreaming } from "@/lib/hooks/useApiStreaming";
import { useBodaccEnrichment } from "@/lib/hooks/useBodaccEnrichment";

// Composants
import { StatusSelector } from "@/components/StatusSelector";
import { FileUploader } from "@/components/FileUploader";
import { ResultsTable } from "@/components/ResultsTable";
import { SiretSearchBar } from "@/components/SiretSearchBar";
import { TreatmentSelector } from "@/components/TreatmentSelector";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Stepper, Step } from "@/components/ui/Stepper";

export default function Home() {
  // État du wizard
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedTreatments, setSelectedTreatments] = useState<TreatmentType[]>(['radiation-check']);
  
  // État principal
  const [checked, setChecked] = useState<Checked[] | null>(null);
  const [enabledStatuses, setEnabledStatuses] = useState<EnabledStatuses>(DEFAULT_ENABLED_STATUSES);
  const [loading, setLoading] = useState(false);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [manualSirets, setManualSirets] = useState<string[]>([]);
  
  // État pour le traitement par chunks
  const [siretChunks, setSiretChunks] = useState<string[][]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [chunkResults, setChunkResults] = useState<Checked[][]>([]);
  const [chunkProcessing, setChunkProcessing] = useState<boolean[]>([]);

  // Hooks personnalisés
  const fileProcessing = useFileProcessing();
  const apiStreaming = useApiStreaming();
  const bodaccEnrichment = useBodaccEnrichment();

  // Configuration des étapes du wizard
  const wizardSteps: Step[] = [
    { id: 1, label: 'Choix des données', description: 'Source de données' },
    { id: 2, label: 'Traitement', description: 'Type d\'analyse' },
    { id: 3, label: 'Résultats', description: 'Analyse terminée' }
  ];

  // Passer automatiquement à l'étape 3 quand les résultats sont prêts
  const isAnalysisComplete = useMemo(() => {
    // Vérifier que des résultats existent
    const hasResults = checked !== null;
    
    // Vérifier qu'il n'y a pas de chargement en cours
    const notLoading = !loading && !apiStreaming.streamingProgress;
    
    // Vérifier que tous les chunks sont traités (si applicable)
    const allChunksProcessed = siretChunks.length === 0 || 
      (siretChunks.length > 0 && chunkResults.filter(r => r !== null).length === siretChunks.length);
    
    // Vérifier qu'aucun chunk n'est en cours de traitement
    const noChunkProcessing = !chunkProcessing.some(processing => processing);
    
    return hasResults && notLoading && allChunksProcessed && noChunkProcessing;
  }, [checked, loading, apiStreaming.streamingProgress, siretChunks.length, chunkResults, chunkProcessing]);
  
  useEffect(() => {
    if (isAnalysisComplete && currentStep === 2) {
      // Petit délai pour une transition fluide
      const timer = setTimeout(() => setCurrentStep(3), 300);
      return () => clearTimeout(timer);
    }
  }, [isAnalysisComplete, currentStep]);

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
    let sourceData: Checked[] = [];
    
    // Utiliser les résultats des chunks si disponibles
    if (chunkResults.some(result => result !== null)) {
      sourceData = chunkResults
        .filter(result => result !== null)
        .flat()
        .map(item => enrichWithAmounts([item], csvAmountMap)[0]);
    } else if (apiStreaming.streamingProgress) {
      sourceData = enrichWithAmounts(apiStreaming.streamingResults, csvAmountMap);
    } else {
      sourceData = checked ?? [];
    }
    
    // Log pour BLANQUART spécifiquement
    const blanquartItem = sourceData.find(item => item.siret === '38076713700017');
    if (blanquartItem) {
      console.log('[DEBUG] BLANQUART in filtered sourceData:', blanquartItem);
    }
    
    const filteredData = sourceData.filter(item => item.estRadiee || item.hasActiveProcedures);
    console.log('[DEBUG] Total filtered items:', filteredData.length);
    
    return filteredData;
  }, [checked, apiStreaming.streamingResults, apiStreaming.streamingProgress, chunkResults, csvAmountMap]);

  const stats = useMemo(() => {
    let sourceData: Checked[] = [];
    let totalAnalyzed = 0;
    
    // Utiliser les résultats des chunks si disponibles
    if (chunkResults.some(result => result !== null)) {
      sourceData = chunkResults
        .filter(result => result !== null)
        .flat();
      totalAnalyzed = sourceData.length;
    } else if (apiStreaming.streamingProgress) {
      sourceData = apiStreaming.streamingResults;
      totalAnalyzed = apiStreaming.streamingProgress.total;
    } else {
      sourceData = checked ?? [];
      totalAnalyzed = sourceData.length;
    }
    
    // Cas spécial : recherche manuelle avec aucun résultat radié
    // Dans ce cas, on doit compter le nombre de SIRETs analysés, pas le nombre de résultats
    if (sourceData.length === 0 && !apiStreaming.streamingProgress && !chunkResults.some(result => result !== null) && checked && checked.length === 0) {
      // Si on a fait une recherche mais qu'aucun résultat n'est revenu, 
      // on doit estimer le nombre d'entreprises analysées
      // Pour la recherche manuelle, on peut utiliser manualSirets.length
      totalAnalyzed = manualSirets.length;
    }
    
    // Ne retourner null que si aucune analyse n'a été effectuée
    if (totalAnalyzed === 0 && !apiStreaming.streamingProgress && !chunkResults.some(result => result !== null) && !checked) return null;
    
    const total = apiStreaming.streamingProgress ? apiStreaming.streamingProgress.total : totalAnalyzed;
    const radiees = sourceData.filter((r) => r.estRadiee).length;
    const enProcedure = sourceData.filter((r) => r.hasActiveProcedures).length;
    const radieesOuEnProcedure = sourceData.filter((r) => r.estRadiee || r.hasActiveProcedures).length;
    const actives = totalAnalyzed - radieesOuEnProcedure;
    
    console.log('[DEBUG] Stats calculation:', {
      'sourceData.length': sourceData.length,
      'checked.length': checked?.length || 0,
      'manualSirets.length': manualSirets.length,
      'streamingProgress': apiStreaming.streamingProgress,
      'chunkResults.length': chunkResults.length,
      'totalAnalyzed': totalAnalyzed,
      'total': total,
      'current': totalAnalyzed
    });
    
    return { 
      total, 
      radiees, 
      enProcedure,
      radieesOuEnProcedure,
      actives, 
      current: totalAnalyzed 
    };
  }, [checked, apiStreaming.streamingResults, apiStreaming.streamingProgress, chunkResults, manualSirets]);

  // Calcul du montant total
  const totalAmount = useMemo(() => {
    let sourceData: Checked[] = [];
    
    // Utiliser les résultats des chunks si disponibles
    if (chunkResults.some(result => result !== null)) {
      sourceData = chunkResults
        .filter(result => result !== null)
        .flat()
        .map(item => enrichWithAmounts([item], csvAmountMap)[0]);
    } else if (apiStreaming.streamingProgress) {
      sourceData = enrichWithAmounts(apiStreaming.streamingResults, csvAmountMap);
    } else {
      sourceData = checked ?? [];
    }
    
    return calculateTotalAmount(sourceData);
  }, [checked, apiStreaming.streamingResults, apiStreaming.streamingProgress, chunkResults, csvAmountMap]);

  // Fonctions de traitement
  const resetProcess = () => {
    setChecked(null);
    apiStreaming.reset();
    fileProcessing.reset();
    bodaccEnrichment.resetEnrichment();
    setSiretChunks([]);
    setCurrentChunkIndex(0);
    setChunkResults([]);
    setChunkProcessing([]);
    setManualSirets([]);
    setCurrentStep(1);
  };

  // Navigation du wizard
  const canGoToStep2 = () => {
    // Vérifier qu'au moins une source de données est sélectionnée
    return manualSirets.length > 0 || fileProcessing.rows.length > 0 || true; // 'true' pour la base sous-traitants
  };

  const goToNextStep = () => {
    if (currentStep === 1 && canGoToStep2()) {
      setCurrentStep(2);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  const canRunAnalysis = () => {
    return selectedTreatments.length > 0 && canGoToStep2();
  };

  // Fonction pour scinder les SIRETs en chunks optimisés pour la rapidité
  const createSiretChunks = (sirets: string[]): string[][] => {
    // Calcul basé sur les limites HTTP/2 et API INSEE :
    // - 30 req/min INSEE = 1 req/2s
    // - Stream API traite directement sans lots (plus simple)
    // - 250 SIRETs × 2s = 500s = 8,3 minutes (optimal)
    const CHUNK_SIZE = 250; // Optimisé pour HTTP/2 et limites API INSEE
    const chunks: string[][] = [];
    
    for (let i = 0; i < sirets.length; i += CHUNK_SIZE) {
      chunks.push(sirets.slice(i, i + CHUNK_SIZE));
    }
    
    return chunks;
  };

  // Fonction pour traiter un chunk spécifique
  const processChunk = async (chunkIndex: number) => {
    if (chunkIndex >= siretChunks.length) return;
    
    setChunkProcessing(prev => {
      const newState = [...prev];
      newState[chunkIndex] = true;
      return newState;
    });
    
    try {
      const chunkSirets = siretChunks[chunkIndex];
      console.log(`🔄 Traitement du chunk ${chunkIndex + 1}/${siretChunks.length} (${chunkSirets.length} SIRETs)`);
      
      const results = await apiStreaming.streamApiResults(chunkSirets, []);
      
      setChunkResults(prev => {
        const newResults = [...prev];
        newResults[chunkIndex] = results;
        return newResults;
      });
      
      // Marquer ce chunk comme traité et mettre à jour l'index courant
      setCurrentChunkIndex(chunkIndex);
      
    } catch (error) {
      console.error(`Erreur lors du traitement du chunk ${chunkIndex + 1}:`, error);
    } finally {
      setChunkProcessing(prev => {
        const newState = [...prev];
        newState[chunkIndex] = false;
        return newState;
      });
    }
  };

  const runBaseProcess = async () => {
    setLoading(true);
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
      console.log(`[DEBUG] 📊 Base sous-traitants chargée : ${baseResults.length} entreprises`);
      console.log(`[DEBUG] 🔍 SIRETs à vérifier : ${allSirets.length}`);
      console.log('[DEBUG] Premiers SIRETs:', allSirets.slice(0, 5));
      
      if (allSirets.length > 0) {
        // Si moins de 250 SIRETs, lancer automatiquement le scan
        if (allSirets.length <= 250) {
          console.log(`🚀 Auto-lancement du scan pour ${allSirets.length} SIRETs (≤ 250)`);
          console.log(`ℹ️  Pas de chunking nécessaire pour moins de 250 SIRETs`);
          const apiResults = await apiStreaming.streamApiResults(allSirets, []);
          
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
          setLoading(false); // Terminer le loading pour les petits scans
        } else {
          // Scinder en chunks de 250 SIRETs (optimisé HTTP/2 + API INSEE)
          console.log(`📦 CRÉATION DES CHUNKS : ${allSirets.length} SIRETs > 250`);
          const chunks = createSiretChunks(allSirets);
          setSiretChunks(chunks);
          setCurrentChunkIndex(0);
          setChunkResults(new Array(chunks.length).fill(null));
          setChunkProcessing(new Array(chunks.length).fill(false));
          
          console.log(`✅ ${chunks.length} chunks créés de max 250 SIRETs`);
          console.log(`📊 Détail des chunks:`);
          chunks.forEach((chunk, i) => {
            console.log(`  - Chunk ${i+1}: ${chunk.length} SIRETs`);
          });
          
          // Ne pas terminer le loading ici - les chunks doivent être traités manuellement
          setLoading(false);
        }
      } else {
        console.log('⚠️ Aucun SIRET à vérifier');
        setLoading(false); // Terminer le loading s'il n'y a pas de SIRETs
      }

    } catch (error) {
      console.error('Erreur lors du traitement de la base:', error);
      setLoading(false); // Terminer le loading en cas d'erreur
    }
  };

  const runCompleteProcess = async () => {
    console.log('[DEBUG] runCompleteProcess called!');
    console.log('[DEBUG] Selected treatments:', selectedTreatments);
    console.log('[DEBUG] fileProcessing.rows.length:', fileProcessing.rows.length);
    console.log('[DEBUG] siretList.length:', siretList.length);
    console.log('[DEBUG] phoneList.length:', phoneList.length);
    console.log('[DEBUG] manualSirets.length:', manualSirets.length);
    
    // Vérifier qu'au moins un traitement est sélectionné
    if (selectedTreatments.length === 0) {
      console.log('[DEBUG] No treatments selected');
      alert('Veuillez sélectionner au moins un traitement');
      return;
    }
    
    // Pour l'instant, seul radiation-check est implémenté
    if (!selectedTreatments.includes('radiation-check')) {
      console.log('[DEBUG] Only radiation-check is implemented');
      alert('Seul le traitement "Identifier les radiations / procédures" est actuellement disponible');
      return;
    }
    
    // Si aucun fichier n'est chargé, aucun SIRET spécifique, et aucun SIRET manuel, on traite toute la base
    if (fileProcessing.rows.length === 0 && siretList.length === 0 && phoneList.length === 0 && manualSirets.length === 0) {
      console.log('[DEBUG] Calling runBaseProcess...');
      return runBaseProcess();
    }
    
    // Si des SIRETs manuels sont présents, les utiliser directement
    if (manualSirets.length > 0 && fileProcessing.rows.length === 0) {
      console.log('[DEBUG] 🔍 Recherche manuelle de SIRETs:', manualSirets.length);
      setLoading(true);
      apiStreaming.startScan();
      setChecked(null);
      
      try {
        // Vérifier directement les SIRETs manuels via l'API SIRENE
        console.log('[DEBUG] ⏳ Appel streamApiResults pour recherche manuelle...');
        const apiResults = await apiStreaming.streamApiResults(manualSirets, []);
        console.log('[DEBUG] ✅ Résultats reçus:', apiResults.length);
        console.log('[DEBUG] 📊 Détail des résultats:', apiResults.map(r => ({
          siret: r.siret,
          denomination: r.denomination,
          estRadiee: r.estRadiee,
          hasActiveProcedures: r.hasActiveProcedures
        })));
        
        const enrichedResults = enrichWithAmounts(apiResults, csvAmountMap);
        setChecked(enrichedResults);
        
        console.log('[DEBUG] 🏁 Recherche manuelle terminée');
      } catch (error) {
        console.error('Erreur lors de la vérification des SIRETs manuels:', error);
      } finally {
        setLoading(false);
      }
      return;
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
          // Si moins de 250 SIRETs, lancer automatiquement le scan
          if (allSirets.length <= 250) {
            console.log(`🚀 Auto-lancement du scan pour ${allSirets.length} SIRETs (≤ 250) - Détection téléphone`);
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
          } else {
            // Scinder en chunks de 250 SIRETs pour les gros datasets
            const chunks = createSiretChunks(allSirets);
            setSiretChunks(chunks);
            setCurrentChunkIndex(0);
            setChunkResults(new Array(chunks.length).fill(null));
            setChunkProcessing(new Array(chunks.length).fill(false));
            
            console.log(`📦 Téléphones scindés en ${chunks.length} chunks de max 250 SIRETs`);
            console.log(`📊 Chunks: ${chunks.map((chunk, i) => `Chunk ${i+1}: ${chunk.length} SIRETs`).join(', ')}`);
          }
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
            // Si moins de 250 SIRETs, lancer automatiquement le scan
            if (allSirets.length <= 250) {
              console.log(`🚀 Auto-lancement du scan pour ${allSirets.length} SIRETs (≤ 250)`);
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
            } else {
              // Scinder en chunks de 250 SIRETs pour les gros datasets
              const chunks = createSiretChunks(allSirets);
              setSiretChunks(chunks);
              setCurrentChunkIndex(0);
              setChunkResults(new Array(chunks.length).fill(null));
              setChunkProcessing(new Array(chunks.length).fill(false));
              
              console.log(`📦 Fichier scindé en ${chunks.length} chunks de max 250 SIRETs`);
              console.log(`📊 Chunks: ${chunks.map((chunk, i) => `Chunk ${i+1}: ${chunk.length} SIRETs`).join(', ')}`);
            }
            
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
    <div className="min-h-screen bg-cursor-bg-primary flex">
      {/* Sidebar fixe avec style professionnel - avec padding-top pour le header */}
      <aside className="w-80 bg-gradient-to-b from-[#1e1e1e] via-[#1a1a1a] to-[#161616] border-r border-[#2a2a2a] fixed left-0 top-14 h-[calc(100vh-3.5rem)] overflow-y-auto shadow-[2px_0_8px_rgba(0,0,0,0.15)]">
        <div className="p-6">
          {/* Title section avec séparateur élégant */}
          <div className="mb-8 pb-5 relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-cursor-text-primary leading-tight">
                  Analyse d&apos;entreprises
                </h1>
              </div>
            </div>
            <p className="text-xs text-cursor-text-secondary leading-relaxed pl-12">
              Traitements et vérifications administratives
            </p>
            {/* Séparateur élégant avec dégradé */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent"></div>
          </div>

          {/* Stepper avec design moderne */}
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-cursor-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
              Progression
            </h2>
            <div className="relative bg-[#1a1a1a] p-4 rounded-xl border border-[#2a2a2a] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <Stepper 
                steps={wizardSteps} 
                currentStep={currentStep}
                onStepClick={setCurrentStep}
              />
            </div>
          </div>

          {/* Indicateur d'étape actuelle avec design glassmorphism */}
          <div className="mt-8 p-4 rounded-xl bg-gradient-to-br from-blue-500/10 via-blue-600/5 to-transparent border border-blue-500/20 shadow-[inset_0_1px_0_rgba(59,130,246,0.1)] backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">Étape actuelle</span>
            </div>
            <p className="text-sm text-cursor-text-primary font-medium">
              {wizardSteps.find(s => s.id === currentStep)?.label || 'En cours'}
            </p>
            <p className="text-xs text-cursor-text-secondary mt-1">
              {wizardSteps.find(s => s.id === currentStep)?.description}
            </p>
            
            {/* Informations de vérification en cours */}
            {apiStreaming.streamingProgress && (
              <div className="mt-4 pt-3 relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-cursor-text-secondary">Progression</span>
                  <span className="text-xs font-semibold text-blue-400 tabular-nums">
                    {apiStreaming.streamingProgress.current} / {apiStreaming.streamingProgress.total}
                  </span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 mb-2 overflow-hidden border border-[#2a2a2a]">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                    style={{ width: `${(apiStreaming.streamingProgress.current / apiStreaming.streamingProgress.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-cursor-text-muted truncate" title={apiStreaming.streamingProgress.message}>
                  {apiStreaming.streamingProgress.message}
                </p>
              </div>
            )}
            
            {/* Informations de traitement par chunks */}
            {siretChunks.length > 0 && (
              <div className="mt-4 pt-3 relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-cursor-text-secondary">Chunks</span>
                  <span className="text-xs font-semibold text-blue-400 tabular-nums">
                    {chunkResults.filter(r => r !== null).length} / {siretChunks.length}
                  </span>
                </div>
                <div className="w-full bg-[#1a1a1a] rounded-full h-1.5 mb-1 overflow-hidden border border-[#2a2a2a]">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-1.5 rounded-full transition-all duration-300 shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                    style={{ width: `${(chunkResults.filter(r => r !== null).length / siretChunks.length) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-cursor-text-muted tabular-nums">
                  {siretChunks.flat().length} SIRETs au total
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Contenu principal avec margin-left pour compenser la sidebar */}
      <div className="flex-1 ml-80">
        <div className="mx-auto max-w-4xl px-6 py-8">

        {/* Step 1: Data Selection */}
        {currentStep === 1 && (
          <div className="card-surface p-6 mb-6">
            <Tabs defaultValue="search">
              <TabsList>
                <TabsTrigger value="search">Recherche SIRET/SIREN</TabsTrigger>
                <TabsTrigger value="base">Ensemble de sous-traitants</TabsTrigger>
                <TabsTrigger value="csv">Fichier CSV</TabsTrigger>
              </TabsList>

              <TabsContent value="search">
                <SiretSearchBar
                  onSiretsChange={setManualSirets}
                />
              </TabsContent>

              <TabsContent value="base">
                <StatusSelector 
                  enabledStatuses={enabledStatuses}
                  onStatusChange={setEnabledStatuses}
                />
              </TabsContent>

              <TabsContent value="csv">
                <FileUploader
                  onFileProcessed={fileProcessing.processFile}
                  rows={fileProcessing.rows}
                  headerMap={fileProcessing.headerMap}
                  detectionType={fileProcessing.detectionType}
                  onHeaderMapChange={fileProcessing.setHeaderMap}
                />
              </TabsContent>
            </Tabs>
            
            {/* Navigation buttons for step 1 */}
            <div className="pt-4 border-t border-cursor-border-primary mt-6">
              <button
                onClick={goToNextStep}
                disabled={!canGoToStep2()}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>Suivant : Choisir les traitements</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* CURSOR-style file info - minimal like CURSOR */}
            {(fileProcessing.rows.length > 0 || manualSirets.length > 0) && (
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
                      {manualSirets.length > 0 ? (
                        <div>
                          <span className="text-cursor-accent-green font-medium">
                            {manualSirets.length} SIRET/SIREN saisi{manualSirets.length > 1 ? 's' : ''}
                          </span>
                          <br/>
                          <span className="text-xs text-cursor-text-muted">Recherche manuelle</span>
                        </div>
                      ) : fileProcessing.detectionType === 'siret' && siretList.length > 0 ? (
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
        )}

        {/* Step 2: Treatment Selection */}
        {currentStep === 2 && (
          <div className="card-surface p-6 mb-6">
            <TreatmentSelector
              selectedTreatments={selectedTreatments}
              onSelectionChange={setSelectedTreatments}
            />
            
            {/* Navigation and action buttons for step 2 */}
            <div className="pt-4 border-t border-cursor-border-primary mt-6 space-y-3">
              {/* Main action button */}
              <button
                onClick={runCompleteProcess}
                disabled={loading || !canRunAnalysis()}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="spinner-cursor"></div>
                    <span>Analyse en cours...</span>
                  </>
                ) : (
                  <span>Lancer l&apos;analyse</span>
                )}
              </button>

              {/* Secondary actions */}
              <div className="flex items-center justify-between">
                <button
                  onClick={goToPreviousStep}
                  disabled={loading}
                  className="text-sm text-cursor-text-secondary hover:text-cursor-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Retour aux données</span>
                </button>

                <div className="flex items-center gap-3">
                  {apiStreaming.isScanning && (
                    <button
                      onClick={apiStreaming.stopScan}
                      className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition-colors"
                    >
                      Arrêter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && (
          <div className="card-surface p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-cursor-text-primary">Analyse terminée</h2>
                <p className="text-sm text-cursor-text-secondary">
                  Les résultats sont maintenant disponibles ci-dessous
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-cursor-border-primary mt-4">
              <button
                onClick={resetProcess}
                className="w-full text-white bg-blue-600 hover:bg-blue-700 font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Nouvelle analyse</span>
              </button>
            </div>
          </div>
        )}

        {/* Statistiques BODACC - visible dès qu'il y a des stats */}
        {(currentStep === 2 || currentStep === 3) && bodaccEnrichment.enrichmentStats && (
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

        {/* Interface de traitement par chunks - visible à l'étape 2 et 3 */}
        {(currentStep === 2 || currentStep === 3) && siretChunks.length > 0 && (
          <div className="card-surface p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-cursor-text-primary">Traitement par Chunks</h3>
                  <p className="text-xs text-cursor-text-secondary">
                    {siretChunks.flat().length} SIRETs • {siretChunks.length} chunk{siretChunks.length > 1 ? 's' : ''} • Max 250 par chunk
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-2 py-1 rounded bg-purple-600/10 border border-purple-600/20">
                <span className="text-xs font-medium text-purple-400 tabular-nums">
                  {chunkResults.filter(r => r !== null).length}/{siretChunks.length}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {siretChunks.map((chunk, index) => {
                const isProcessed = chunkResults[index] !== null;
                const isProcessing = chunkProcessing[index];
                const canProcess = !isProcessed && !isProcessing && !chunkProcessing.some(processing => processing);
                
                return (
                  <button
                    key={index}
                    onClick={() => canProcess && processChunk(index)}
                    disabled={!canProcess || isProcessed}
                    className={`p-3 rounded-lg border transition-all relative group ${
                      isProcessed 
                        ? 'border-green-500/30 bg-green-900/20 cursor-default' 
                        : isProcessing 
                          ? 'border-blue-500/50 bg-blue-900/30 cursor-wait animate-pulse' 
                          : canProcess
                            ? 'border-[#2a2a2a] bg-[#1a1a1a] hover:border-blue-500/50 hover:bg-blue-900/10 cursor-pointer'
                            : 'border-[#2a2a2a] bg-[#1a1a1a] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isProcessed ? 'bg-green-500 text-white' :
                        isProcessing ? 'bg-blue-500 text-white' :
                        'bg-gray-600 text-gray-300'
                      }`}>
                        {isProcessed ? '✓' : index + 1}
                      </div>
                      <span className={`text-xs font-semibold ${
                        isProcessed ? 'text-green-400' :
                        isProcessing ? 'text-blue-400' :
                        'text-cursor-text-primary'
                      }`}>
                        Chunk {index + 1}
                      </span>
                    </div>
                    <div className="text-xs text-cursor-text-muted text-left">
                      {chunk.length} SIRET{chunk.length > 1 ? 's' : ''}
                    </div>
                    
                    {isProcessing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-blue-900/40 rounded-lg">
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    
                    {canProcess && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-blue-600/20 rounded-lg transition-opacity">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Info sur la base chargée - visible à l'étape 2 et 3 */}
        {(currentStep === 2 || currentStep === 3) && checked && !apiStreaming.streamingProgress && siretChunks.length === 0 && stats && (
          <div className="card-surface p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-cursor-text-primary">Base chargée</h3>
                <p className="text-sm text-cursor-text-secondary mt-1">
                  {stats.current} entreprise{stats.current > 1 ? 's' : ''} chargée{stats.current > 1 ? 's' : ''} depuis la base sous-traitants
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-blue-600">
                  {stats.current}
                </div>
                <div className="text-xs text-cursor-text-muted">
                  {stats.current <= 250 ? 'Scan auto en cours' : 'Prêt pour chunking'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CURSOR-style total amount card - visible dès qu'il y a des résultats */}
        {(currentStep === 2 || currentStep === 3) && fileProcessing.headerMap.montant && filtered.length > 0 && (
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

        {/* Tableau des résultats - visible dès qu'il y a des résultats (étape 2 et 3) */}
        {(currentStep === 2 || currentStep === 3) && (checked || apiStreaming.streamingResults.length > 0) && (
          <ResultsTable
            filtered={filtered}
            headerMap={fileProcessing.headerMap}
            streamingProgress={apiStreaming.streamingProgress}
            stats={stats}
            onExport={exportToExcel}
            activeTreatments={selectedTreatments}
          />
        )}
        </div>
      </div>
    </div>
  );
}