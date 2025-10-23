import { TreatmentType } from '@/lib/treatments/types';
import { getAllTreatments } from '@/lib/treatments/registry';

interface TreatmentSelectorProps {
  selectedTreatments: TreatmentType[];
  onSelectionChange: (treatments: TreatmentType[]) => void;
  // Constraints for RI anomalies treatment
  hasUploadedCsv?: boolean;
  currentTab?: string;
  manualSiretsCount?: number;
}

export function TreatmentSelector({ 
  selectedTreatments, 
  onSelectionChange,
  hasUploadedCsv = false,
  currentTab = 'search',
  manualSiretsCount = 0
}: TreatmentSelectorProps) {
  const allTreatments = getAllTreatments();

  // Check if RI anomalies is available based on constraints
  const isRIAnomaliesAvailable = () => {
    // Available for SIRET search with at least one SIRET
    return currentTab === 'search' && !hasUploadedCsv && manualSiretsCount > 0;
  };

  const getRIAnomaliesDisabledReason = () => {
    if (hasUploadedCsv) {
      return 'Non disponible avec un fichier CSV uploadé';
    }
    if (currentTab !== 'search') {
      return 'Non disponible pour la base sous-traitants (V2)';
    }
    if (manualSiretsCount === 0) {
      return 'Veuillez saisir au moins un SIRET';
    }
    return '';
  };

  const handleTreatmentToggle = (treatmentId: TreatmentType) => {
    const treatment = allTreatments.find(t => t.id === treatmentId);
    
    if (!treatment?.enabled) {
      return; // Don't allow selecting disabled treatments
    }

    // Check RI anomalies specific constraints
    if (treatmentId === 'ri-anomalies' && !isRIAnomaliesAvailable()) {
      return; // Don't allow selecting if constraints not met
    }

    const isSelected = selectedTreatments.includes(treatmentId);
    
    if (isSelected) {
      // Remove treatment
      onSelectionChange(selectedTreatments.filter(t => t !== treatmentId));
    } else {
      // Add treatment - but first remove incompatible ones
      let newSelection = [...selectedTreatments];
      
      // If this treatment has incompatibilities, remove them from selection
      if (treatment.incompatibleWith) {
        newSelection = newSelection.filter(t => !treatment.incompatibleWith?.includes(t));
      }
      
      // Also check if any selected treatment is incompatible with this one
      newSelection = newSelection.filter(t => {
        const selectedTreatment = allTreatments.find(tr => tr.id === t);
        return !selectedTreatment?.incompatibleWith?.includes(treatmentId);
      });
      
      // Add the new treatment
      newSelection.push(treatmentId);
      
      onSelectionChange(newSelection);
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

      {/* Treatment options */}
      <div className="space-y-3">
        {allTreatments.map((treatment) => {
          const isSelected = selectedTreatments.includes(treatment.id);
          const isDisabled = !treatment.enabled || 
            (treatment.id === 'ri-anomalies' && !isRIAnomaliesAvailable());
          const disabledReason = treatment.id === 'ri-anomalies' && !isRIAnomaliesAvailable()
            ? getRIAnomaliesDisabledReason()
            : (!treatment.enabled ? 'À venir' : '');

          return (
            <div
              key={treatment.id}
              className={`
                p-4 rounded-lg border transition-all
                ${isSelected && !isDisabled
                  ? 'border-cursor-accent-button bg-cursor-accent-button/10 glow-cursor-blue'
                  : isDisabled
                    ? 'border-cursor-border-primary bg-cursor-bg-tertiary opacity-60'
                    : 'border-cursor-border-primary bg-cursor-bg-secondary hover:border-cursor-border-accent'
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
                    ? 'bg-cursor-accent-button border-cursor-accent-button'
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
                    {isDisabled && disabledReason && (
                      <span className="px-2 py-0.5 text-xs rounded bg-cursor-bg-tertiary text-cursor-text-muted border border-cursor-border-primary" title={disabledReason}>
                        {treatment.enabled ? '⚠️' : 'À venir'}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${
                    isDisabled ? 'text-cursor-text-muted' : 'text-cursor-text-secondary'
                  }`}>
                    {treatment.description}
                  </p>
                  {isDisabled && disabledReason && treatment.id === 'ri-anomalies' && (
                    <p className="text-xs mt-1 text-cursor-accent-orange">
                      {disabledReason}
                    </p>
                  )}
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

