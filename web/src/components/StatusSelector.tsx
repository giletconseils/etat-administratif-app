import { EnabledStatuses, DEFAULT_ENABLED_STATUSES } from '@/lib/types';
import { useState, useEffect } from 'react';

interface StatusSelectorProps {
  enabledStatuses: EnabledStatuses;
  onStatusChange: (statuses: EnabledStatuses) => void;
}

export function StatusSelector({ enabledStatuses, onStatusChange }: StatusSelectorProps) {
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
    onStatusChange(DEFAULT_ENABLED_STATUSES);
  };

  const selectNone = () => {
    const allFalse: EnabledStatuses = {};
    Object.keys(DEFAULT_ENABLED_STATUSES).forEach(key => {
      allFalse[key] = false;
    });
    onStatusChange(allFalse);
  };

  const toggleStatus = (status: string) => {
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
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                Mis à jour le {lastModified}
              </span>
            </div>
            <p className="text-sm text-cursor-text-secondary">Sélectionnez les bases à analyser</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs px-3 py-1.5 rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Tout sélectionner
          </button>
          <button
            onClick={selectNone}
            className="text-xs px-3 py-1.5 rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Tout désélectionner
          </button>
        </div>
      </div>
      
      {/* CURSOR-style grid - exact match */}
      <div className="grid grid-cols-6 gap-3">
        {Object.entries(enabledStatuses).map(([status, enabled]) => (
          <div
            key={status}
            onClick={() => toggleStatus(status)}
            className="relative cursor-pointer group"
          >
            <div className={`
              relative p-4 rounded border transition-all duration-200 hover:scale-102
              ${enabled 
                ? 'bg-cursor-bg-secondary border-cursor-border-primary shadow-sm' 
                : 'bg-cursor-bg-secondary border-cursor-border-primary hover:border-cursor-border-accent hover:shadow-sm'
              }
            `}>
              {/* Indicateur de sélection - checkmark like CURSOR */}
              {enabled && (
                <div 
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-green-500 shadow-lg shadow-green-500/50"
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              {/* Contenu - text centered like CURSOR */}
              <div className="text-center">
                <div className="text-lg font-semibold text-cursor-text-primary font-mono">
                  {status}
                </div>
              </div>
            </div>
          </div>
        ))}
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
