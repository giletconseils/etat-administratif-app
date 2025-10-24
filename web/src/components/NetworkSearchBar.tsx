import { useState, useEffect, useRef } from "react";

interface NetworkSearchBarProps {
  onSiretSelected: (siret: string, name: string) => void;
}

interface SubcontractorResult {
  name: string;
  siret: string;
}

export function NetworkSearchBar({ onSiretSelected }: NetworkSearchBarProps) {
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<SubcontractorResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  // Debounce pour la recherche
  useEffect(() => {
    if (!searchText || searchText.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/data/subcontractors?query=${encodeURIComponent(searchText)}`
        );
        const data = await response.json();
        setSuggestions(data.results || []);
        setShowDropdown(data.results && data.results.length > 0);
        // Sélectionner automatiquement le premier résultat
        setSelectedIndex(data.results && data.results.length > 0 ? 0 : -1);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Scroll automatique vers l'élément sélectionné - toujours centré
  useEffect(() => {
    if (selectedItemRef.current && dropdownRef.current) {
      // Petit délai pour s'assurer que le DOM est rendu
      setTimeout(() => {
        selectedItemRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });
      }, 50);
    }
  }, [selectedIndex]);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SubcontractorResult) => {
    onSiretSelected(result.siret, result.name);
    setSearchText("");
    setSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
      case "Tab":
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <>
      {/* Backdrop avec blur quand le champ est focus */}
      {(isFocused || showDropdown) && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-all duration-300"
          style={{ margin: '-1.5rem' }}
        />
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded border border-cursor-border-primary bg-cursor-bg-secondary flex items-center justify-center">
              <svg
                className="w-3 h-3 text-cursor-text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-medium text-cursor-text-primary">
                Recherche d&apos;intervenant réseau
              </h3>
              <p className="text-sm text-cursor-text-secondary">
                Tapez un nom d&apos;entreprise, SIRET ou nom de contact
              </p>
            </div>
          </div>
        </div>

        {/* Badge de navigation affiché au-dessus de l'input */}
        {(isFocused || showDropdown) && (
          <div className="flex items-center justify-center mb-2 z-50">
            <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded flex items-center gap-1.5">
              <kbd className="font-mono">↑</kbd>
              <kbd className="font-mono">↓</kbd>
              <span>Naviguer</span>
            </span>
          </div>
        )}

        <div className={`relative transition-all duration-300 ${isFocused ? 'scale-105 z-50' : 'scale-100'}`}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="network-search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? `network-option-${selectedIndex}` : undefined}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Délai pour permettre le clic sur les suggestions
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder="Ex: Assistance Biterroise, 81778883900014, abserrurerie..."
          className="w-full px-4 py-3 border border-cursor-border-primary rounded bg-cursor-bg-primary text-cursor-text-primary placeholder-cursor-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-cursor-text-secondary"
              xmlns="http://www.w3.org/2000/svg"
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
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}

        {/* Dropdown des suggestions - effet Dock macOS (ultra large) */}
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-50 left-1/2 -translate-x-1/2 w-[120%] min-w-[600px] mt-3 rounded-2xl overflow-hidden">
            {/* Contenu scrollable */}
            <div
              ref={dropdownRef}
              id="network-search-listbox"
              role="listbox"
              className="relative px-4 space-y-2 max-h-80 overflow-y-auto scrollbar-hide"
              style={{ paddingTop: '2rem', paddingBottom: '2rem' }}
            >
            {suggestions.map((result, index) => (
              <div
                key={`${result.siret}-${index}`}
                ref={index === selectedIndex ? selectedItemRef : null}
                id={`network-option-${index}`}
                role="option"
                aria-selected={index === selectedIndex}
                className={`px-6 py-3 cursor-pointer transition-all duration-300 ease-out rounded-xl origin-center ${
                  index === selectedIndex
                    ? "border-2 border-blue-500 scale-[1.02]"
                    : "border-2 border-transparent scale-100 hover:scale-[1.01]"
                }`}
                onClick={() => handleSelect(result)}
              >
                <div className="flex items-center justify-between gap-8">
                  <span className={`font-semibold truncate transition-all duration-300 ${
                    index === selectedIndex 
                      ? "text-cursor-text-primary text-lg" 
                      : "text-cursor-text-secondary text-base"
                  }`}>
                    {result.name}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono flex-shrink-0 transition-all duration-300 tracking-wider ${
                      index === selectedIndex 
                        ? "text-cursor-text-muted text-base font-medium" 
                        : "text-cursor-text-muted text-sm"
                    }`}>
                      {result.siret}
                    </span>
                    {index === selectedIndex && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded flex items-center gap-1.5 animate-pulse">
                        <kbd className="font-mono">↵</kbd>
                        <span>Valider</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}

