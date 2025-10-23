import { NextRequest, NextResponse } from "next/server";
import { TreatmentExecutionContext } from "@/lib/treatments/types";

// This route is a thin wrapper around the existing streaming API
// The actual radiation check logic remains in /api/check-siret/stream

export async function POST(req: NextRequest) {
  try {
    const context: TreatmentExecutionContext = await req.json();
    
    if (!Array.isArray(context.sirets) || context.sirets.length === 0) {
      return NextResponse.json({ 
        error: "sirets_required",
        message: "SIRETs array is required and must not be empty"
      }, { status: 400 });
    }

    // For radiation checks, we delegate to the existing streaming API
    // The frontend will call /api/check-siret/stream directly for this treatment
    // This route exists mainly for consistency with the treatment architecture
    
    return NextResponse.json({ 
      success: true,
      message: "Use /api/check-siret/stream for radiation check execution",
      treatmentType: "radiation-check",
      siretCount: context.sirets.length
    });
  } catch (error) {
    console.error('Error in radiation-check treatment route:', error);
    return NextResponse.json({ 
      error: "invalid_request",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 400 });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

