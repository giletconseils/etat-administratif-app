"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const orbsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Track mouse position
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

  // Animate orbs based on mouse position
  useEffect(() => {
    let animationFrameId: number;

    const animateOrbs = () => {
      orbsRef.current.forEach((orb, index) => {
        if (orb) {
          // Subtle reaction for homepage - lower speeds than login
          const speeds = [40, 50, 45, 55];
          const directions = [1, -1, 0.8, -0.6];
          const speed = speeds[index];
          const direction = directions[index];
          
          const targetX = (mousePosition.x - 0.5) * speed * direction;
          const targetY = (mousePosition.y - 0.5) * speed * direction;
          
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

  const treatmentCategories = [
    {
      id: "enrichment",
      name: "Enrichissement des données",
      color: "blue",
      treatments: [
        {
          id: "radiation-check",
          name: "Détecteur de défaillance IR",
          description: "Vérifie le statut administratif des intervenants réseaux (radiés, en procédure collective)",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    },
    {
      id: "anomalies",
      name: "Détecteur de RI",
      color: "orange",
      treatments: [
        {
          id: "ri-anomalies",
          name: "Détecteur de RI",
          description: "Analyse les Réparations à l'Identique déclarées vs attendues par assureur",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        },
        {
          id: "legal-docs-validator",
          name: "Validateurs de documents légaux",
          description: "À venir - Validation des attestations de Responsabilité Civile Professionnelle",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          disabled: true
        }
      ]
    },
    {
      id: "agents",
      name: "Agents",
      color: "purple",
      treatments: [
        {
          id: "intervention-agent",
          name: "Agent de suivi d'intervention",
          description: "À venir - Suivi automatisé des interventions et alertes intelligentes",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
          disabled: true
        },
        {
          id: "regulation-agent",
          name: "Agent de gestion des réglementations",
          description: "À venir - Veille réglementaire automatisée et mise en conformité",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
          disabled: true
        }
      ]
    },
    {
      id: "network",
      name: "Réseau & Compétences",
      color: "teal",
      treatments: [
        {
          id: "cooptation-tool",
          name: "Outil de cooptation",
          description: "À venir - Gestion et suivi des recommandations d'intervenants",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          disabled: true
        },
        {
          id: "ir-profiling",
          name: "Profilage d'IR",
          description: "À venir - Analyse et classification des profils d'intervenants réseau",
          icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          ),
          disabled: true
        }
      ]
    }
  ];

  const getCategoryColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return {
          pill: "bg-blue-500/20 text-blue-400 border-blue-500/40",
          gradient: "from-cursor-accent-blue/10 via-cursor-accent-blue/5 to-transparent",
          border: "border-cursor-accent-blue/20",
          hover: "hover:border-cursor-accent-blue/40 hover:shadow-cursor"
        };
      case "orange":
        return {
          pill: "bg-orange-500/20 text-orange-400 border-orange-500/40",
          gradient: "from-cursor-accent-orange/10 via-cursor-accent-orange/5 to-transparent",
          border: "border-cursor-accent-orange/20",
          hover: "hover:border-cursor-accent-orange/40 hover:shadow-cursor"
        };
      case "green":
        return {
          pill: "bg-green-500/20 text-green-400 border-green-500/40",
          gradient: "from-cursor-accent-green/10 via-cursor-accent-green/5 to-transparent",
          border: "border-cursor-accent-green/20",
          hover: "hover:border-cursor-accent-green/40 hover:shadow-cursor"
        };
      case "purple":
        return {
          pill: "bg-purple-500/20 text-purple-400 border-purple-500/40",
          gradient: "from-purple-500/10 via-purple-600/5 to-transparent",
          border: "border-purple-500/20",
          hover: "hover:border-purple-500/40 hover:shadow-cursor"
        };
      case "teal":
        return {
          pill: "bg-teal-500/20 text-teal-400 border-teal-500/40",
          gradient: "from-teal-500/10 via-teal-600/5 to-transparent",
          border: "border-teal-500/20",
          hover: "hover:border-teal-500/40 hover:shadow-cursor"
        };
      default:
        return {
          pill: "bg-cursor-bg-tertiary text-cursor-text-secondary border-cursor-border-primary",
          gradient: "from-cursor-bg-tertiary/50 via-cursor-bg-tertiary/25 to-transparent",
          border: "border-cursor-border-primary",
          hover: "hover:border-cursor-border-accent hover:shadow-cursor"
        };
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-5rem)] bg-cursor-bg-primary overflow-hidden">
      {/* Background animated dots pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(112, 141, 170, 0.15) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}></div>
      </div>

      {/* Animated gradient orbs - Discrètes avec couleurs des catégories */}
      <div className="absolute inset-0 overflow-hidden" style={{ mixBlendMode: 'screen' }}>
        {/* Orb 1 - Blue (Enrichissement) - Top left */}
        <div 
          ref={(el) => { orbsRef.current[0] = el; }}
          className="absolute w-[600px] h-[600px] top-[10%] left-[10%] rounded-full blur-[120px] animate-float-slow"
          style={{ 
            willChange: 'transform',
            background: 'radial-gradient(circle at center, rgba(74, 144, 226, 0.2) 0%, rgba(74, 144, 226, 0.12) 50%, transparent 100%)',
            '--mouse-x': '0px',
            '--mouse-y': '0px',
          } as React.CSSProperties}
        ></div>
        
        {/* Orb 2 - Orange (Détecteur RI) - Top right */}
        <div 
          ref={(el) => { orbsRef.current[1] = el; }}
          className="absolute w-[550px] h-[550px] top-[15%] right-[15%] rounded-full blur-[110px] animate-float-delayed"
          style={{ 
            willChange: 'transform',
            background: 'radial-gradient(circle at center, rgba(249, 115, 22, 0.18) 0%, rgba(249, 115, 22, 0.11) 50%, transparent 100%)',
            '--mouse-x': '0px',
            '--mouse-y': '0px',
          } as React.CSSProperties}
        ></div>
        
        {/* Orb 3 - Purple (Agents) - Bottom left */}
        <div 
          ref={(el) => { orbsRef.current[2] = el; }}
          className="absolute w-[580px] h-[580px] bottom-[20%] left-[15%] rounded-full blur-[115px] animate-float"
          style={{ 
            willChange: 'transform',
            background: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.16) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 100%)',
            '--mouse-x': '0px',
            '--mouse-y': '0px',
          } as React.CSSProperties}
        ></div>
        
        {/* Orb 4 - Teal (Réseau & Compétences) - Bottom right */}
        <div 
          ref={(el) => { orbsRef.current[3] = el; }}
          className="absolute w-[520px] h-[520px] bottom-[15%] right-[10%] rounded-full blur-[105px] animate-float-delayed-2"
          style={{ 
            willChange: 'transform',
            background: 'radial-gradient(circle at center, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0.09) 50%, transparent 100%)',
            '--mouse-x': '0px',
            '--mouse-y': '0px',
          } as React.CSSProperties}
        ></div>
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          {/* <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cursor-accent-blue/10 border border-cursor-accent-blue/20 mb-6">
            <svg className="w-4 h-4 text-cursor-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-cursor-accent-blue">Hub d&apos;analyse & automatisation</span>
          </div> */}
          
          <h1 className="text-4xl md:text-5xl font-bold text-cursor-text-primary mb-4 tracking-tight">
            Hub d&apos;analyse & automatisation
          </h1>
          <p className="text-lg text-cursor-text-secondary max-w-2xl mx-auto">
            Détection d&apos;anomalies, enrichissement de données et agents intelligents
          </p>
        </div>

        {/* Treatment Categories */}
        <div className="space-y-12">
          {treatmentCategories.map((category) => {
            const colors = getCategoryColorClasses(category.color);
            
            return (
              <div key={category.id} className="space-y-4">
                {/* Category Pill */}
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${colors.pill} shadow-sm`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${category.color === 'blue' ? 'bg-blue-400' : category.color === 'orange' ? 'bg-orange-400' : category.color === 'purple' ? 'bg-purple-400' : category.color === 'teal' ? 'bg-teal-400' : 'bg-gray-400'}`}></div>
                    {category.name}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-cursor-border-primary to-transparent"></div>
                </div>

                {/* Treatment Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.treatments.map((treatment) => {
                    const isDisabled = treatment.disabled || false;
                    
                    return (
                      <Link
                        key={treatment.id}
                        href={isDisabled ? "#" : `/analyse?treatment=${treatment.id}`}
                        className={`
                          block group relative overflow-hidden
                          rounded-xl border p-6
                          transition-all duration-300
                          ${isDisabled 
                            ? 'opacity-50 cursor-not-allowed bg-cursor-bg-tertiary/40 backdrop-blur-xl border-white/[0.08]'
                            : `bg-[#1a1a1a]/40 backdrop-blur-3xl border-white/[0.15] hover:border-white/[0.25] hover:shadow-2xl cursor-pointer`
                          }
                        `}
                        style={!isDisabled ? { backdropFilter: 'blur(40px) saturate(150%)' } : {}}
                        onClick={(e) => isDisabled && e.preventDefault()}
                      >
                        {/* Shimmer effect on hover */}
                        {!isDisabled && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                        )}
                        
                        <div className={`relative flex items-center gap-4`}>
                          {/* Icon */}
                          <div className={`
                            flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                            ${isDisabled 
                              ? 'bg-cursor-bg-secondary/50 text-cursor-text-muted border border-white/[0.05]'
                              : `bg-white/5 text-${category.color}-400 border border-white/[0.1]`
                            }
                            shadow-lg transition-transform duration-300
                            ${!isDisabled && 'group-hover:scale-110 group-hover:bg-white/10 group-hover:border-white/[0.15]'}
                          `}>
                            {treatment.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className={`flex items-center justify-between gap-2 ${!isDisabled && treatment.description ? 'mb-2' : ''}`}>
                              <h3 className={`
                                text-lg font-semibold leading-none
                                ${isDisabled ? 'text-cursor-text-muted' : 'text-cursor-text-primary'}
                              `}>
                                {treatment.name}
                              </h3>
                              {isDisabled && (
                                <span className="flex-shrink-0 px-2 py-0.5 text-xs rounded bg-cursor-bg-tertiary text-cursor-text-muted border border-cursor-border-primary">
                                  À venir
                                </span>
                              )}
                            </div>

                            {/* Description - only for active cards */}
                            {!isDisabled && treatment.description && (
                              <p className="text-sm leading-relaxed text-cursor-text-secondary">
                                {treatment.description}
                              </p>
                            )}

                            {/* Arrow indicator */}
                            {!isDisabled && (
                              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-cursor-accent-button group-hover:gap-3 transition-all">
                                <span>Commencer l&apos;analyse</span>
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
