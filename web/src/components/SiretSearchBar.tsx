import { useState } from "react";

interface SiretSearchBarProps {
  onSiretsChange: (sirets: string[]) => void;
}

export function SiretSearchBar({ onSiretsChange }: SiretSearchBarProps) {
  const [searchText, setSearchText] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setSearchText(text);
    
    // Extraire tous les SIRETs/SIRENs valides du texte
    const siretPattern = /\b\d{9}(?:\d{5})?\b/g;
    const matches = text.match(siretPattern) || [];
    
    // Supprimer les doublons
    const uniqueSirets = [...new Set(matches)];
    onSiretsChange(uniqueSirets);
  };

  // Compter les SIRETs/SIRENs détectés
  const siretCount = searchText.match(/\b\d{9}(?:\d{5})?\b/g)?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded border border-cursor-border-primary bg-cursor-bg-secondary flex items-center justify-center">
            <svg className="w-3 h-3 text-cursor-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-medium text-cursor-text-primary">Recherche par SIRET/SIREN</h3>
            <p className="text-sm text-cursor-text-secondary">
              Entrez un ou plusieurs numéros SIRET (14 chiffres) ou SIREN (9 chiffres)
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <textarea
          value={searchText}
          onChange={handleSearchChange}
          placeholder="Exemple:&#10;38076713700017&#10;380767137&#10;Ou collez plusieurs numéros séparés par des espaces, virgules ou retours à la ligne..."
          className="w-full min-h-[150px] px-4 py-3 border border-cursor-border-primary rounded bg-cursor-bg-primary text-cursor-text-primary placeholder-cursor-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y font-mono text-sm"
        />
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-cursor-text-secondary">
            {siretCount > 0 ? (
              <span className="text-cursor-accent-green font-medium">
                ✓ {siretCount} numéro{siretCount > 1 ? 's' : ''} détecté{siretCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-cursor-text-muted">
                Aucun numéro détecté
              </span>
            )}
          </div>
          {siretCount > 0 && (
            <button
              onClick={() => {
                setSearchText("");
                onSiretsChange([]);
              }}
              className="text-sm text-cursor-text-secondary hover:text-cursor-text-primary transition-colors"
            >
              Effacer
            </button>
          )}
        </div>
      </div>
      
      <div className="text-sm text-cursor-text-muted">
        💡 Vous pouvez coller plusieurs numéros d&apos;un coup, séparés par des espaces, virgules ou retours à la ligne
      </div>
    </div>
  );
}

