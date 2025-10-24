"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const orbsRef = useRef<(HTMLDivElement | null)[]>([]);

  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  useEffect(() => {
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        "invalid-token": "Le lien de connexion est invalide ou a expiré.",
        "missing-token": "Lien de connexion manquant.",
        unauthorized: "Vous n'êtes pas autorisé à accéder à cette application.",
      };
      setMessage({
        type: "error",
        text: errorMessages[errorParam] || "Une erreur est survenue.",
      });
    }
  }, [errorParam]);

  // Track mouse position and animate orbs
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Animate orbs based on mouse position (separate effect)
  useEffect(() => {
    let animationFrameId: number;

    const animateOrbs = () => {
      orbsRef.current.forEach((orb, index) => {
        if (orb) {
          // Seulement 2 orbes maintenant - Réaction subtile
          const speeds = [60, 80]; // Plus lent pour effet de rétro-éclairage doux
          const directions = [1, -1];
          const speed = speeds[index];
          const direction = directions[index];
          
          // Calculate target position based on mouse (centered at 0.5, 0.5)
          const targetX = (mousePosition.x - 0.5) * speed * direction;
          const targetY = (mousePosition.y - 0.5) * speed * direction;
          
          // Apply transform with custom property to avoid conflicts with CSS animations
          orb.style.setProperty('--mouse-x', `${targetX}px`);
          orb.style.setProperty('--mouse-y', `${targetY}px`);
        }
      });
      
      animationFrameId = requestAnimationFrame(animateOrbs);
    };

    animationFrameId = requestAnimationFrame(animateOrbs);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: "success",
          text: data.message,
        });
        setEmail("");
      } else {
        setMessage({
          type: "error",
          text: data.message || "Une erreur est survenue.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Impossible de se connecter au serveur.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden">
      {/* Background animated dots pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(112, 141, 170, 0.15) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}></div>
      </div>

      {/* Animated gradient orbs - Rétro-éclairage avec 2 grandes orbes */}
      <div className="absolute inset-0 overflow-hidden" style={{ mixBlendMode: 'screen' }}>
        {/* Orb 1 - Orange FairFair - Grande orbe en haut à gauche du centre */}
        <div 
          ref={(el) => (orbsRef.current[0] = el)}
          className="absolute w-[800px] h-[800px] top-1/2 left-1/2 -translate-x-[60%] -translate-y-[60%] rounded-full blur-[150px] animate-float-slow"
          style={{ 
            willChange: 'transform',
            background: 'radial-gradient(circle at center, rgba(244, 121, 32, 0.6) 0%, rgba(244, 121, 32, 0.45) 35%, rgba(244, 121, 32, 0.25) 60%, transparent 100%)',
            '--mouse-x': '0px',
            '--mouse-y': '0px',
          } as React.CSSProperties}
        ></div>
        
        {/* Orb 2 - Blue FairFair - Grande orbe en bas à droite du centre */}
        <div 
          ref={(el) => (orbsRef.current[1] = el)}
          className="absolute w-[900px] h-[900px] top-1/2 left-1/2 -translate-x-[40%] -translate-y-[40%] rounded-full blur-[140px] animate-float-delayed"
          style={{ 
            willChange: 'transform',
            background: 'radial-gradient(circle at center, rgba(0, 167, 225, 0.55) 0%, rgba(0, 167, 225, 0.4) 35%, rgba(0, 167, 225, 0.22) 60%, transparent 100%)',
            '--mouse-x': '0px',
            '--mouse-y': '0px',
          } as React.CSSProperties}
        ></div>
      </div>

      {/* Content wrapper - centered */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md px-4">
        {/* Title outside card */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            Connexion au hub
          </h1>
          <p className="text-sm text-gray-400">
            Entrez votre email pour recevoir un lien de connexion
          </p>
        </div>

        {/* Login card */}
        <div className="w-full">
        <div className="bg-[#1a1a1a]/40 backdrop-blur-3xl border border-white/[0.15] rounded-2xl shadow-2xl p-8" style={{ backdropFilter: 'blur(60px) saturate(180%)' }}>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Adresse email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.fr"
                  required
                  disabled={isLoading}
                  style={{
                    // @ts-ignore
                    '--focus-ring-color': 'var(--fairfair-blue)',
                  }}
                  className="w-full px-4 py-3.5 bg-black/40 border border-white/[0.1] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[color:var(--focus-ring-color)]/50 focus:border-[color:var(--focus-ring-color)]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed [--focus-ring-color:var(--fairfair-blue)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                backgroundColor: 'var(--fairfair-blue)',
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--fairfair-blue-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--fairfair-blue)';
                }
              }}
              className="w-full py-3.5 px-4 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-2xl hover:shadow-blue-500/20"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Recevoir le lien
                </>
              )}
            </button>
          </form>

          {/* Messages */}
          {message.text && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-500/10 border border-green-500/30 text-green-400"
                  : "bg-red-500/10 border border-red-500/30 text-red-400"
              }`}
            >
              <div className="flex items-start gap-3">
                <svg
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    message.type === "success"
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {message.type === "success" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  )}
                </svg>
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // Empêcher le scroll sur la page de login
  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>}>
      <LoginForm />
    </Suspense>
  );
}

