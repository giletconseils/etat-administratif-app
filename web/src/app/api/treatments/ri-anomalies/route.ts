import { NextRequest, NextResponse } from "next/server";
import { execute, executeAll } from "@/lib/treatments/ri-anomalies/executor";
import { EnabledStatuses } from "@/lib/types";
import { RIThresholds, DEFAULT_RI_THRESHOLDS } from "@/lib/treatments/ri-anomalies/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes pour le mode batch

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { siret, sirets, mode, minMissions, enabledStatuses, thresholds } = body as { 
      siret?: string; 
      sirets?: string[];
      mode?: 'siret' | 'batch';
      minMissions?: number;
      enabledStatuses?: EnabledStatuses;
      thresholds?: RIThresholds;
    };
    
    // Use provided thresholds or default values
    const riThresholds: RIThresholds = thresholds || DEFAULT_RI_THRESHOLDS;

    // MODE BATCH : analyser tous les sous-traitants
    if (mode === 'batch') {
      console.log(`[RI API] Mode BATCH activé, minMissions=${minMissions || 5}`);
      console.log(`[RI API] Statuts activés:`, enabledStatuses);
      console.log(`[RI API] Seuils:`, riThresholds);
      
      const results = await executeAll(minMissions || 5, enabledStatuses, riThresholds);
      
      return NextResponse.json({
        success: true,
        results,
        mode: 'batch',
        minMissions: minMissions || 5,
        totalAnalyzed: results.length,
      });
    }

    // MODE SIRET : analyser des SIRETs spécifiques
    // Support both single SIRET and array of SIRETs
    let siretList: string[] = [];
    
    if (sirets && Array.isArray(sirets)) {
      siretList = sirets;
    } else if (siret) {
      siretList = [siret];
    }

    if (siretList.length === 0) {
      return NextResponse.json(
        { error: "SIRET(s) manquant(s) ou mode non spécifié" },
        { status: 400 }
      );
    }

    // Validate SIRET format (basic check)
    const cleanSirets = siretList.map(s => s.trim()).filter(s => s.length >= 9);
    
    if (cleanSirets.length === 0) {
      return NextResponse.json(
        { error: "Format SIRET invalide" },
        { status: 400 }
      );
    }

    console.log(`[RI API] Mode SIRET, analyzing ${cleanSirets.length} SIRET(s)`);
    console.log(`[RI API] Seuils:`, riThresholds);

    // Execute analysis
    const results = await execute(cleanSirets, riThresholds);

    return NextResponse.json({
      success: true,
      results,
      mode: 'siret',
    });
  } catch (error) {
    console.error("Error in RI anomalies treatment:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de l'analyse",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
