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
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        setSelectedIndex(-1);
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
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
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

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ex: Assistance Biterroise, 81778883900014, abserrurerie..."
          className="w-full px-4 py-3 border border-cursor-border-primary rounded bg-cursor-bg-primary text-cursor-text-primary placeholder-cursor-text-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Dropdown des suggestions */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-cursor-bg-secondary border border-cursor-border-primary rounded shadow-lg max-h-80 overflow-y-auto"
          >
            {suggestions.map((result, index) => (
              <div
                key={`${result.siret}-${index}`}
                className={`px-4 py-3 cursor-pointer transition-colors ${
                  index === selectedIndex
                    ? "bg-blue-500/20 border-l-2 border-blue-500"
                    : "hover:bg-cursor-bg-tertiary"
                }`}
                onClick={() => handleSelect(result)}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-medium text-cursor-text-primary truncate">
                    {result.name}
                  </span>
                  <span className="text-sm text-cursor-text-muted font-mono flex-shrink-0">
                    {result.siret}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-sm text-cursor-text-muted">
        💡 Utilisez les flèches ↑↓ pour naviguer, Tab ou Entrée pour
        sélectionner
      </div>
    </div>
  );
}

