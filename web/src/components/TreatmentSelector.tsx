import { useState, useEffect } from 'react';
import { TreatmentType } from '@/lib/treatments/types';
import { getAllTreatments, areTreatmentsCompatible } from '@/lib/treatments/registry';

interface TreatmentSelectorProps {
  selectedTreatments: TreatmentType[];
  onSelectionChange: (treatments: TreatmentType[]) => void;
}

export function TreatmentSelector({ selectedTreatments, onSelectionChange }: TreatmentSelectorProps) {
  const [incompatibilityWarning, setIncompatibilityWarning] = useState<string | null>(null);
  const allTreatments = getAllTreatments();

  useEffect(() => {
    // Check compatibility whenever selection changes
    if (selectedTreatments.length > 1 && !areTreatmentsCompatible(selectedTreatments)) {
      setIncompatibilityWarning('Certains traitements sélectionnés sont incompatibles entre eux');
    } else {
      setIncompatibilityWarning(null);
    }
  }, [selectedTreatments]);

  const handleTreatmentToggle = (treatmentId: TreatmentType) => {
    const treatment = allTreatments.find(t => t.id === treatmentId);
    
    if (!treatment?.enabled) {
      return; // Don't allow selecting disabled treatments
    }

    const isSelected = selectedTreatments.includes(treatmentId);
    
    if (isSelected) {
      // Remove treatment
      onSelectionChange(selectedTreatments.filter(t => t !== treatmentId));
    } else {
      // Add treatment
      onSelectionChange([...selectedTreatments, treatmentId]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded border border-cursor-border-primary bg-cursor-bg-secondary flex items-center justify-center">
            <svg className="w-3 h-3 text-cursor-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-medium text-cursor-text-primary">Sélection des traitements</h3>
            <p className="text-sm text-cursor-text-secondary">
              Choisissez un ou plusieurs traitements à appliquer aux données
            </p>
          </div>
        </div>
      </div>

      {/* Incompatibility warning */}
      {incompatibilityWarning && (
        <div className="p-3 bg-yellow-900/20 border border-yellow-600 rounded">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-yellow-200">{incompatibilityWarning}</span>
          </div>
        </div>
      )}

      {/* Treatment options */}
      <div className="space-y-3">
        {allTreatments.map((treatment) => {
          const isSelected = selectedTreatments.includes(treatment.id);
          const isDisabled = !treatment.enabled;

          return (
            <div
              key={treatment.id}
              className={`
                p-4 rounded-lg border transition-all
                ${isSelected && !isDisabled
                  ? 'border-blue-500 bg-blue-900/20'
                  : isDisabled
                    ? 'border-cursor-border-primary bg-cursor-bg-tertiary opacity-60'
                    : 'border-cursor-border-primary bg-cursor-bg-secondary hover:border-cursor-text-muted'
                }
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              onClick={() => handleTreatmentToggle(treatment.id)}
            >
              <div className="flex items-start gap-3">
                {/* Checkbox */}
                <div className={`
                  mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected && !isDisabled
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-cursor-border-primary bg-cursor-bg-primary'
                  }
                `}>
                  {isSelected && !isDisabled && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Treatment info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`font-medium ${
                      isDisabled ? 'text-cursor-text-muted' : 'text-cursor-text-primary'
                    }`}>
                      {treatment.name}
                    </h4>
                    {isDisabled && (
                      <span className="px-2 py-0.5 text-xs rounded bg-cursor-bg-tertiary text-cursor-text-muted border border-cursor-border-primary">
                        À venir
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    isDisabled ? 'text-cursor-text-muted' : 'text-cursor-text-secondary'
                  }`}>
                    {treatment.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection summary */}
      <div className="text-sm text-cursor-text-secondary">
        {selectedTreatments.length > 0 ? (
          <span className="text-cursor-accent-green font-medium">
            ✓ {selectedTreatments.length} traitement{selectedTreatments.length > 1 ? 's' : ''} sélectionné{selectedTreatments.length > 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-cursor-text-muted">
            Aucun traitement sélectionné
          </span>
        )}
      </div>
    </div>
  );
}

