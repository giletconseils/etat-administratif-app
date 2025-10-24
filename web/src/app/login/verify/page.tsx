"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("Lien de connexion invalide");
      setTimeout(() => router.push("/login?error=missing-token"), 2000);
      return;
    }

    // La vérification se fait via la route API qui redirige automatiquement
    // Cette page sert principalement d'état intermédiaire
    window.location.href = `/api/auth/verify-magic-link?token=${token}`;
  }, [searchParams, router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden animate-fade-in"
      style={{
        animation: 'fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards'
      }}
    >
      {/* Background animated dots pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(112, 141, 170, 0.15) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}></div>
      </div>

      {/* Animated orbs - très subtiles */}
      <div className="absolute inset-0 overflow-hidden" style={{ mixBlendMode: 'screen' }}>
        {/* Orb Orange */}
        <div 
          className="absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-[70%] -translate-y-[60%] rounded-full blur-[140px] animate-pulse-slow"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(244, 121, 32, 0.25) 0%, rgba(244, 121, 32, 0.15) 50%, transparent 100%)',
          }}
        ></div>
        
        {/* Orb Blue */}
        <div 
          className="absolute w-[700px] h-[700px] top-1/2 left-1/2 -translate-x-[30%] -translate-y-[40%] rounded-full blur-[130px] animate-pulse-slow"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(0, 167, 225, 0.3) 0%, rgba(0, 167, 225, 0.18) 50%, transparent 100%)',
            animationDelay: '1s',
          }}
        ></div>
      </div>

      {/* Content - minimaliste */}
      <div className="relative z-10 flex flex-col items-center animate-scale-in"
        style={{
          animation: 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards'
        }}
      >
        {status === "verifying" && (
          <>
            {/* Spinner minimaliste */}
            <div className="relative w-12 h-12 mb-8">
              <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00A7E1] animate-spin"></div>
            </div>
            <p className="text-white/60 text-sm font-light tracking-wide">
              Connexion en cours
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-12 h-12 mb-8 flex items-center justify-center">
              <svg className="w-12 h-12 text-[#00A7E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-white/60 text-sm font-light tracking-wide">
              Connexion réussie
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-12 h-12 mb-8 flex items-center justify-center">
              <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-white/60 text-sm font-light tracking-wide mb-2">
              {errorMessage}
            </p>
            <p className="text-white/30 text-xs font-light">
              Redirection...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-black">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#00A7E1] animate-spin"></div>
          </div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}

