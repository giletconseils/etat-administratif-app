import { NextRequest, NextResponse } from "next/server";
import { 
  SirenCheckInput, 
  CompanyStatus, 
  fetchWithIntegrationKey, 
  cleanSirets, 
  INSEE_RATE_LIMITS 
} from "@/lib/insee-api";
import { validateSirets, handleApiError } from "@/lib/error-handling";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SirenCheckInput;
    
    // Validation des SIRETs
    const validatedSirets = validateSirets(body.sirets);
    const cleaned = cleanSirets(validatedSirets);

    // Create phone map from data
    const phoneMap = new Map<string, string>();
    if (body.data) {
      body.data.forEach(item => {
        if (item.phone) {
          phoneMap.set(item.siret, item.phone);
        }
      });
    }

    const integrationKey = process.env.INSEE_INTEGRATION_KEY;
    
    if (!integrationKey) {
      return NextResponse.json({ 
        error: "NO_API_CONFIGURED",
        message: "INSEE API integration key not configured"
      }, { status: 500 });
    }

    // Process all SIRETs through INSEE API with strict rate limiting
    const results: CompanyStatus[] = [];
    
    for (let i = 0; i < cleaned.length; i++) {
      const result = await fetchWithIntegrationKey(cleaned[i], integrationKey);
      results.push(result);
      
      // Wait between each request to respect rate limits
      if (i < cleaned.length - 1) {
        await new Promise(resolve => setTimeout(resolve, INSEE_RATE_LIMITS.delayBetweenRequests));
      }
      
      // Log progress every 10 requests for better granularity
      if ((i + 1) % 10 === 0) {
        console.log(`Progress: ${i + 1}/${cleaned.length} SIRETs processed`);
      }
    }

    // Add phone data to results
    const merged: CompanyStatus[] = results.map((result) => ({
      ...result,
      phone: phoneMap.get(result.siret)
    }));

    return NextResponse.json({ results: merged });
  } catch (error) {
    const errorResponse = handleApiError(error, 'check-siret');
    return NextResponse.json(errorResponse.body, { status: errorResponse.status });
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

