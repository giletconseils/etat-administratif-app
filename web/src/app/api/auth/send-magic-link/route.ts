import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
  isEmailAuthorized,
  generateMagicToken,
  isValidEmail,
  getNameForEmail,
} from "@/lib/auth-utils";
import { MagicLinkEmail } from "@/lib/email-templates/magic-link";

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple in-memory rate limiting (en production, utiliser Redis ou une DB)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(email);

  if (!limit || now > limit.resetAt) {
    // Nouvelle période ou expirée
    rateLimitMap.set(email, {
      count: 1,
      resetAt: now + 60 * 60 * 1000, // 1 heure
    });
    return true;
  }

  if (limit.count >= 3) {
    return false; // Limite atteinte
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Vérification de la configuration
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { 
          success: false, 
          message: "Service email non configuré. Contactez l'administrateur." 
        },
        { status: 500 }
      );
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "your-secret-key-change-in-production") {
      console.error("JWT_SECRET is not configured properly");
      return NextResponse.json(
        { 
          success: false, 
          message: "Service d'authentification non configuré. Contactez l'administrateur." 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email } = body;

    // Validation de l'email
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Email invalide" },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(email.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          message: "Trop de tentatives. Veuillez réessayer dans une heure.",
        },
        { status: 429 }
      );
    }

    // Vérification de l'autorisation
    const authorized = await isEmailAuthorized(email);
    if (!authorized) {
      // Message générique pour ne pas révéler si l'email est autorisé ou non
      return NextResponse.json(
        {
          success: true,
          message:
            "Si votre email est autorisé, vous recevrez un lien de connexion.",
        },
        { status: 200 }
      );
    }

    // Génération du token
    const token = await generateMagicToken(email);
    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const magicLink = `${appUrl}/login/verify?token=${token}`;

    // Récupération du nom
    const name = await getNameForEmail(email);

    // Envoi de l'email
    const { error } = await resend.emails.send({
      from: "Gilet Conseils <noreply@giletconseils.fr>",
      to: [email],
      subject: "Connexion à votre espace",
      react: MagicLinkEmail({ magicLink, name, expiryMinutes: 15 }) as React.ReactElement,
    });

    if (error) {
      console.error("Error sending email:", error);
      return NextResponse.json(
        { success: false, message: "Erreur lors de l'envoi de l'email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Un lien de connexion a été envoyé à votre adresse email.",
    });
  } catch (error) {
    console.error("Error in send-magic-link:", error);
    
    // Log plus détaillé pour le debugging
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Une erreur est survenue lors de l'envoi de l'email",
        error: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

