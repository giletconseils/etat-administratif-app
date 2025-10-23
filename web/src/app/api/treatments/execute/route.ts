import { NextRequest, NextResponse } from "next/server";
import { TreatmentType, TreatmentExecutionContext } from "@/lib/treatments/types";
import { areTreatmentsCompatible } from "@/lib/treatments/registry";

// Orchestrator endpoint that coordinates multiple treatments
// Currently, radiation-check uses streaming API directly, so this mainly validates and routes

export interface ExecuteTreatmentsRequest {
  treatments: TreatmentType[];
  context: TreatmentExecutionContext;
}

export async function POST(req: NextRequest) {
  try {
    const body: ExecuteTreatmentsRequest = await req.json();
    const { treatments, context } = body;
    
    // Validate request
    if (!Array.isArray(treatments) || treatments.length === 0) {
      return NextResponse.json({ 
        error: "treatments_required",
        message: "At least one treatment must be specified"
      }, { status: 400 });
    }

    if (!Array.isArray(context.sirets) || context.sirets.length === 0) {
      return NextResponse.json({ 
        error: "sirets_required",
        message: "SIRETs array is required and must not be empty"
      }, { status: 400 });
    }

    // Check treatment compatibility
    if (!areTreatmentsCompatible(treatments)) {
      return NextResponse.json({ 
        error: "incompatible_treatments",
        message: "Selected treatments are incompatible with each other"
      }, { status: 400 });
    }

    // For now, return instructions for each treatment
    // The frontend will handle the actual execution (especially for streaming treatments)
    const executionPlan = treatments.map(treatment => {
      switch (treatment) {
        case 'radiation-check':
          return {
            treatment: 'radiation-check',
            endpoint: '/api/check-siret/stream',
            method: 'streaming'
          };
        case 'ri-anomalies':
          return {
            treatment: 'ri-anomalies',
            endpoint: '/api/treatments/ri-anomalies',
            method: 'standard'
          };
        default:
          return {
            treatment,
            error: 'Unknown treatment type'
          };
      }
    });

    return NextResponse.json({ 
      success: true,
      executionPlan,
      siretCount: context.sirets.length,
      treatmentCount: treatments.length
    });
  } catch (error) {
    console.error('Error in execute treatments route:', error);
    return NextResponse.json({ 
      error: "invalid_request",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 400 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

