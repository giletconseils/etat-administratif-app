import { EnabledStatuses, DEFAULT_ENABLED_STATUSES } from '@/lib/types';
import { useState, useEffect } from 'react';

interface StatusSelectorProps {
  enabledStatuses: EnabledStatuses;
  onStatusChange: (statuses: EnabledStatuses) => void;
  disabledStatuses?: string[]; // Statuts qui ne doivent pas être sélectionnables
}

export function StatusSelector({ enabledStatuses, onStatusChange, disabledStatuses = [] }: StatusSelectorProps) {
  const [lastModified, setLastModified] = useState<string>('...');

  useEffect(() => {
    // Récupérer la date de dernière modification du CSV
    fetch('/api/csv-last-modified')
      .then(res => res.json())
      .then(data => {
        if (data.lastModified) {
          setLastModified(data.lastModified);
        }
      })
      .catch(error => {
        console.error('Error fetching CSV last modified date:', error);
        setLastModified('--/--/----');
      });
  }, []);

  const selectAll = () => {
    // Créer une copie des statuts par défaut et désactiver ceux qui sont dans disabledStatuses
    const newStatuses = { ...DEFAULT_ENABLED_STATUSES };
    disabledStatuses.forEach(status => {
      newStatuses[status] = false;
    });
    onStatusChange(newStatuses);
  };

  const selectNone = () => {
    const allFalse: EnabledStatuses = {};
    Object.keys(DEFAULT_ENABLED_STATUSES).forEach(key => {
      allFalse[key] = false;
    });
    onStatusChange(allFalse);
  };

  const toggleStatus = (status: string) => {
    // Ne pas permettre de toggle les statuts désactivés
    if (disabledStatuses.includes(status)) {
      return;
    }
    onStatusChange({
      ...enabledStatuses,
      [status]: !enabledStatuses[status]
    });
  };

  const selectedCount = Object.values(enabledStatuses).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded border border-cursor-border-primary bg-cursor-bg-secondary flex items-center justify-center">
            <svg className="w-3 h-3 text-cursor-text-secondary" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect x="3" y="9" width="3" height="8" rx="1" fill="currentColor"/>
              <rect x="8.5" y="6" width="3" height="11" rx="1" fill="currentColor" opacity="0.8"/>
              <rect x="14" y="3" width="3" height="14" rx="1" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-cursor-text-primary">Ensembles de sous-traitants</h3>
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cursor-accent-green/10 text-cursor-accent-green border border-cursor-accent-green/20">
                Mis à jour le {lastModified}
              </span>
            </div>
            <p className="text-sm text-cursor-text-secondary">Sélectionnez les bases à analyser</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs px-3 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md font-medium"
          >
            Tout sélectionner
          </button>
          <button
            onClick={selectNone}
            className="text-xs px-3 py-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md font-medium"
          >
            Tout désélectionner
          </button>
        </div>
      </div>
      
      {/* CURSOR-style grid - exact match */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(enabledStatuses).map(([status, enabled]) => {
          const isDisabled = disabledStatuses.includes(status);
          
          return (
            <div
              key={status}
              onClick={() => toggleStatus(status)}
              className={`relative group ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className={`
                relative p-4 rounded-lg border-2 transition-all duration-200
                ${isDisabled 
                  ? 'bg-cursor-bg-tertiary border-cursor-border-primary opacity-40'
                  : enabled 
                    ? 'bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/30 animate-pulse-blue hover:scale-102' 
                    : 'bg-cursor-bg-secondary border-cursor-border-primary hover:border-blue-500/50 hover:shadow-sm hover:scale-102'
                }
              `}>
                {/* Badge "Exclu" pour les statuts désactivés */}
                {isDisabled && (
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-cursor-accent-red/80 text-white border border-cursor-accent-red/50 shadow-md">
                    Exclu
                  </div>
                )}
                
                {/* Indicateur de sélection - checkmark like CURSOR */}
                {enabled && !isDisabled && (
                  <div 
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-cursor-accent-green shadow-lg glow-cursor-green"
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                
                {/* Contenu - text centered like CURSOR */}
                <div className="text-center">
                  <div className={`text-lg font-semibold font-mono ${isDisabled ? 'text-cursor-text-muted' : 'text-cursor-text-primary'}`}>
                    {status}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* CURSOR-style counter - simple text like CURSOR */}
      <div className="text-center">
        <span className="text-sm text-cursor-text-secondary">
          {selectedCount} ensemble{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
}
