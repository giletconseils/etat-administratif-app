# Testing Guide: Two-Step Wizard Workflow

## Quick Test Checklist

### Step 1: Data Selection ✓

**Test Manual SIRET Search:**
1. Navigate to the application
2. Should see Step 1 highlighted in the stepper
3. Default tab: "Recherche SIRET/SIREN"
4. Enter test SIRETs: `38076713700017` or `380767137`
5. Should see "X numéro(s) détecté(s)" below
6. Click "Suivant : Choisir les traitements"

**Test Database Selection:**
1. Switch to "Ensemble de sous-traitants" tab
2. See status checkboxes (TR, U1, U1P, U2, U3, U4)
3. Toggle statuses on/off
4. Click "Suivant : Choisir les traitements"

**Test CSV Upload:**
1. Switch to "Fichier CSV" tab
2. Upload a CSV with SIRET or phone columns
3. Should auto-detect column type
4. See detection info below
5. Click "Suivant : Choisir les traitements"

### Step 2: Treatment Selection ✓

**Visual Verification:**
1. Should see Step 2 highlighted in stepper
2. Step 1 should show green checkmark
3. Two treatment cards visible:
   - ✓ "Identifier les radiations / procédures" (enabled, pre-selected)
   - "Détecter les anomalies de déclarations de RI" (disabled, "À venir" badge)

**Test Treatment Selection:**
1. Click on "Identifier les radiations / procédures" card
2. Should see blue border and checkmark
3. Click again to deselect (not recommended for testing)
4. Try clicking disabled treatment → should not allow selection
5. Bottom should show "1 traitement sélectionné"

**Test Navigation:**
1. Click "Retour aux données" → should go back to Step 1
2. Data should still be there
3. Click "Suivant" again → back to Step 2
4. Treatment selection should be preserved

**Launch Analysis:**
1. With "Identifier les radiations / procédures" selected
2. Click "Lancer l'analyse"
3. Should see progress indicators
4. For ≤250 SIRETs: automatic processing
5. For >250 SIRETs: chunking interface appears

### Results Display ✓

**Verify Results Table:**
1. Should see columns:
   - SIRET
   - Dénomination
   - Téléphone
   - **Statut** (radiation check)
   - **Date cessation** (radiation check)
   - **Procédure** (radiation check)
   - **En procédure active** (radiation check)
   - Montant (if CSV had montant column)
   - Source

2. Radiation/procedure-specific columns shown because treatment is active
3. Status badges colored:
   - Red: Radiée
   - Orange: En procédure
   - Green: Active

**Test Export:**
1. Click "Exporter" button
2. Should download Excel file with results
3. File name format: `entreprises_radiees_et_en_procedure_YYYY-MM-DD.xlsx`

### Reset and Retry ✓

**Test Reset:**
1. Click "Réinitialiser" button
2. Should clear all data and results
3. Should go back to Step 1
4. All selections cleared

## Expected Behavior

### Step Navigation
- ✓ Can only go to Step 2 if data is selected
- ✓ Can go back from Step 2 to Step 1
- ✓ Data persists when navigating back and forth
- ✓ Treatment selection persists during navigation

### Treatment Selection
- ✓ Multiple treatments can be selected
- ✓ Disabled treatments show "À venir" badge
- ✓ Cannot select disabled treatments
- ✓ At least one treatment must be selected to run
- ✓ "radiation-check" is pre-selected by default

### Analysis Execution
- ✓ Only selected treatments execute
- ✓ Radiation check uses existing streaming API
- ✓ Chunking works for >250 SIRETs
- ✓ Progress indicators show during processing
- ✓ Results table shows columns for active treatments only

### Error Handling
- ✓ Alert if no treatment selected
- ✓ Alert if only unimplemented treatment selected
- ✓ Incompatibility warnings (if configured)

## Known Limitations

1. **RI Anomalies Treatment**: Not yet implemented
   - Shows in selector but disabled
   - Will show alert if selected alone
   - Placeholder API returns empty results

2. **Treatment Compatibility**: System ready but no incompatibilities defined yet

3. **Concurrent Treatments**: Architecture supports it, but only radiation-check implemented

## Visual Flow Diagram

```
[Start]
   ↓
┌─────────────────────────────────────┐
│  Step 1: Choix des données          │
│  ┌─────────────────────────────┐    │
│  │ • Recherche SIRET/SIREN     │    │
│  │ • Ensemble sous-traitants   │    │
│  │ • Fichier CSV               │    │
│  └─────────────────────────────┘    │
│  [Suivant: Choisir traitements] →   │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  Step 2: Traitement                 │
│  ┌─────────────────────────────┐    │
│  │ ☑ Radiations/Procédures     │    │
│  │ ☐ Anomalies RI (à venir)    │    │
│  └─────────────────────────────┘    │
│  ← [Retour] [Lancer l'analyse] →    │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│  Résultats                          │
│  • Statistiques                     │
│  • Tableau avec colonnes adaptées  │
│  • Export Excel                     │
│  [Réinitialiser]                    │
└─────────────────────────────────────┘
```

## Test Data

### Sample SIRETs for Testing
```
38076713700017  (14 digits - SIRET)
380767137       (9 digits - SIREN)
```

### Sample CSV Content
```csv
siret,denomination,montant
38076713700017,BLANQUART,15000
52853074700017,AUTRE ENTREPRISE,25000
```

### Sample CSV with Phone
```csv
phone,denomination,montant
0601020304,Entreprise A,10000
0602030405,Entreprise B,20000
```

## Success Criteria

- [ ] Stepper displays correctly
- [ ] Step 1 shows 3 tabs
- [ ] Can navigate to Step 2 with data
- [ ] Treatment selector shows 2 options
- [ ] Can select radiation-check treatment
- [ ] Cannot select disabled treatment
- [ ] Analysis launches successfully
- [ ] Results table shows correct columns
- [ ] Export works
- [ ] Reset returns to Step 1
- [ ] No console errors
- [ ] Build compiles successfully ✓

## Troubleshooting

**Issue**: "Suivant" button disabled
- **Fix**: Select a data source (manual SIRET, database, or upload CSV)

**Issue**: Cannot launch analysis
- **Fix**: Ensure at least one enabled treatment is selected

**Issue**: No results shown
- **Fix**: This is normal if all companies are in good standing

**Issue**: Columns missing in table
- **Fix**: Ensure radiation-check treatment is selected

**Issue**: RI Anomalies not working
- **Expected**: This treatment is not yet implemented (coming soon)

