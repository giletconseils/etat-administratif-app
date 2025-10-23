"use client";
import { useState, useEffect, useCallback } from "react";

interface DatasetInfo {
  type: string;
  exists: boolean;
  lastModified?: string;
  lineCount?: number;
  error?: string;
}

interface Assureur {
  id: number;
  name: string;
  ri_percentage: number;
}

interface RIThresholds {
  warningThreshold: number;
  excellentThreshold: number;
}

const DEFAULT_RI_THRESHOLDS: RIThresholds = {
  warningThreshold: -20,
  excellentThreshold: 10,
};

// Helper function to format dates
function formatDate(dateString?: string) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("fr-FR");
}

export default function DataPage() {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [assureurs, setAssureurs] = useState<Assureur[]>([]);
  const [riThresholds, setRiThresholds] = useState<RIThresholds>(DEFAULT_RI_THRESHOLDS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load dataset info
      const datasetsRes = await fetch("/api/data/list-datasets");
      const datasetsData = await datasetsRes.json();
      setDatasets(datasetsData.datasets || []);

      // Load assureurs
      const assureursRes = await fetch("/api/data/assureurs");
      const assureursData = await assureursRes.json();
      setAssureurs(assureursData.assureurs || []);

      // Load RI thresholds
      const thresholdsRes = await fetch("/api/data/ri-thresholds");
      const thresholdsData = await thresholdsRes.json();
      setRiThresholds(thresholdsData.thresholds || DEFAULT_RI_THRESHOLDS);
    } catch (error) {
      console.error("Error loading data:", error);
      setMessage({ type: "error", text: "Erreur lors du chargement des données" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFileUpload = async (
    datasetType: "sous-traitants" | "missions" | "assureurs",
    file: File
  ) => {
    try {
      setUploading(datasetType);
      setMessage(null);

      const csvContent = await file.text();
      
      const response = await fetch("/api/data/upload-dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetType, csvContent }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setMessage({
        type: "success",
        text: `${datasetType} mis à jour avec succès (${result.lineCount} lignes)`,
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: `Erreur lors de l'upload: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setUploading(null);
    }
  };

  const handleAssureurChange = (id: number, field: "name" | "ri_percentage", value: string | number) => {
    setAssureurs((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleSaveAssureurs = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch("/api/data/assureurs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assureurs }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Save failed");
      }

      setMessage({
        type: "success",
        text: "Assureurs mis à jour avec succès",
      });

      await loadData();
    } catch (error) {
      console.error("Save error:", error);
      setMessage({
        type: "error",
        text: `Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetAssureurs = async () => {
    if (!confirm("Réinitialiser les pourcentages RI aux valeurs par défaut ?")) {
      return;
    }

    const defaultAssureurs: Assureur[] = [
      { id: 1, name: "Fidélia", ri_percentage: 60 },
      { id: 3, name: "Dynaren", ri_percentage: 30 },
      { id: 4, name: "FilAssistance", ri_percentage: 20 },
      { id: 7, name: "Opteven", ri_percentage: 70 },
      { id: 8, name: "Mutuaide", ri_percentage: 40 },
      { id: 10, name: "AXA", ri_percentage: 0 },
      { id: 11, name: "EAF", ri_percentage: 75 },
      { id: 25, name: "Foncia", ri_percentage: 0 },
      { id: 26, name: "GMF", ri_percentage: 35 },
      { id: 28, name: "SOFRATEL", ri_percentage: 0 },
      { id: 29, name: "Stelliant B2B", ri_percentage: 0 },
      { id: 36, name: "Stelliant B2C", ri_percentage: 0 },
    ];

    setAssureurs(defaultAssureurs);
  };

  const handleSaveRIThresholds = async () => {
    try {
      setSavingThresholds(true);
      setMessage(null);

      const response = await fetch("/api/data/ri-thresholds", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thresholds: riThresholds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Save failed");
      }

      setMessage({
        type: "success",
        text: "Seuils RI mis à jour avec succès",
      });
    } catch (error) {
      console.error("Save error:", error);
      setMessage({
        type: "error",
        text: `Erreur lors de la sauvegarde: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setSavingThresholds(false);
    }
  };

  const handleResetRIThresholds = () => {
    if (!confirm("Réinitialiser les seuils RI aux valeurs par défaut (-20% / +10%) ?")) {
      return;
    }
    setRiThresholds(DEFAULT_RI_THRESHOLDS);
  };

  const getDatasetInfo = (type: string) => {
    return datasets.find((d) => d.type === type);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cursor-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="spinner-cursor mb-4"></div>
          <p className="text-cursor-text-secondary">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cursor-bg-primary">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cursor-text-primary mb-2">
            Gestion des données
          </h1>
          <p className="text-cursor-text-secondary">
            Gérez les datasets de base et les paramètres des traitements
          </p>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === "success"
                ? "bg-green-900/20 border-green-500/30 text-green-400"
                : "bg-red-900/20 border-red-500/30 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Section Sous-traitants */}
        <DatasetSection
          title="Base sous-traitants"
          description="Base de données des sous-traitants avec SIRET, nom, téléphone, etc."
          datasetInfo={getDatasetInfo("sous-traitants")}
          onUpload={(file) => handleFileUpload("sous-traitants", file)}
          uploading={uploading === "sous-traitants"}
        />

        {/* Section Missions */}
        <DatasetSection
          title="Missions (DU)"
          description="Missions d'urgence effectuées avec prescriber_id, company_id, SIRET et RI associées"
          datasetInfo={getDatasetInfo("missions")}
          onUpload={(file) => handleFileUpload("missions", file)}
          uploading={uploading === "missions"}
          expectedColumns="prescriber_id, company_id, siret, SERVICE_B2CSDU_ORDER → external_id"
        />

        {/* Section Prescripteurs */}
        <div className="card-surface p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-cursor-text-primary mb-2">
              Taux de transformation RI par prescripteur
            </h2>
            <p className="text-sm text-cursor-text-secondary">
              Pourcentages de chance qu&apos;une mission DU engendre une RI par prescripteur
            </p>
          </div>

          <div className="overflow-x-auto mb-4">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cursor-border-primary">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-cursor-text-primary">
                    ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-cursor-text-primary">
                    Nom
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-cursor-text-primary">
                    % RI par défaut
                  </th>
                </tr>
              </thead>
              <tbody>
                {assureurs.map((assureur) => (
                  <tr key={assureur.id} className="border-b border-cursor-border-primary">
                    <td className="py-3 px-4 text-sm text-cursor-text-secondary">
                      {assureur.id}
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={assureur.name}
                        onChange={(e) =>
                          handleAssureurChange(assureur.id, "name", e.target.value)
                        }
                        className="w-full bg-cursor-bg-tertiary border border-cursor-border-primary rounded px-3 py-2 text-sm text-cursor-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={assureur.ri_percentage}
                          onChange={(e) =>
                            handleAssureurChange(
                              assureur.id,
                              "ri_percentage",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-24 bg-cursor-bg-tertiary border border-cursor-border-primary rounded px-3 py-2 text-sm text-cursor-text-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-cursor-text-secondary">%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveAssureurs}
              disabled={saving}
              className="text-white bg-blue-600 hover:bg-blue-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder les modifications"}
            </button>
            <button
              onClick={handleResetAssureurs}
              disabled={saving}
              className="text-cursor-text-primary bg-cursor-bg-tertiary hover:bg-cursor-bg-secondary border border-cursor-border-primary font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Réinitialiser aux valeurs par défaut
            </button>
          </div>
        </div>

        {/* Section Seuils de détection des anomalies RI */}
        <div className="card-surface p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h2 className="text-xl font-semibold text-cursor-text-primary">
                Seuils de détection des anomalies RI
              </h2>
            </div>
            <p className="text-sm text-cursor-text-secondary">
              Configurez les seuils pour catégoriser les écarts entre RI théorique et RI déclaré
            </p>
          </div>

          <div className="space-y-6 mb-6">
            {/* Seuil de sous-déclaration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-cursor-text-primary">
                  Seuil de sous-déclaration (écart négatif)
                </label>
                <span className="text-2xl font-bold text-red-400 tabular-nums">
                  {riThresholds.warningThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="-50"
                max="0"
                step="1"
                value={riThresholds.warningThreshold}
                onChange={(e) =>
                  setRiThresholds((prev) => ({
                    ...prev,
                    warningThreshold: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full h-2 bg-gradient-to-r from-red-600 to-gray-600 rounded-lg appearance-none cursor-pointer slider-thumb-red"
                style={{
                  background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${
                    ((riThresholds.warningThreshold + 50) / 50) * 100
                  }%, #4b5563 ${((riThresholds.warningThreshold + 50) / 50) * 100}%, #4b5563 100%)`,
                }}
              />
              <p className="text-xs text-cursor-text-muted mt-2">
                Les intervenants réseaux avec un écart inférieur à {riThresholds.warningThreshold}% seront marqués en sous-déclaration
              </p>
            </div>

            {/* Seuil d'excellence */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-cursor-text-primary">
                  Seuil d&apos;excellence (écart positif)
                </label>
                <span className="text-2xl font-bold text-blue-400 tabular-nums">
                  +{riThresholds.excellentThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={riThresholds.excellentThreshold}
                onChange={(e) =>
                  setRiThresholds((prev) => ({
                    ...prev,
                    excellentThreshold: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full h-2 bg-gradient-to-r from-gray-600 to-blue-600 rounded-lg appearance-none cursor-pointer slider-thumb-blue"
                style={{
                  background: `linear-gradient(to right, #4b5563 0%, #4b5563 ${
                    (riThresholds.excellentThreshold / 50) * 100
                  }%, #2563eb ${(riThresholds.excellentThreshold / 50) * 100}%, #2563eb 100%)`,
                }}
              />
              <p className="text-xs text-cursor-text-muted mt-2">
                Les intervenants réseaux avec un écart supérieur à +{riThresholds.excellentThreshold}% seront marqués comme excellents
              </p>
            </div>
          </div>

          {/* Aperçu des catégories */}
          <div className="bg-cursor-bg-tertiary border border-cursor-border-primary rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-cursor-text-primary mb-3">
              Aperçu des catégories
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-cursor-text-secondary">
                  Sous-déclaration : Écart &lt; {riThresholds.warningThreshold}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-cursor-text-secondary">
                  Conforme : {riThresholds.warningThreshold}% ≤ Écart ≤ +{riThresholds.excellentThreshold}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-cursor-text-secondary">
                  Excellent : Écart &gt; +{riThresholds.excellentThreshold}%
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveRIThresholds}
              disabled={savingThresholds}
              className="text-white bg-blue-600 hover:bg-blue-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingThresholds ? "Sauvegarde..." : "Sauvegarder les seuils"}
            </button>
            <button
              onClick={handleResetRIThresholds}
              disabled={savingThresholds}
              className="text-cursor-text-primary bg-cursor-bg-tertiary hover:bg-cursor-bg-secondary border border-cursor-border-primary font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Réinitialiser aux valeurs par défaut (-20% / +10%)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DatasetSectionProps {
  title: string;
  description: string;
  datasetInfo?: DatasetInfo;
  onUpload: (file: File) => void;
  uploading: boolean;
  expectedColumns?: string;
}

function DatasetSection({
  title,
  description,
  datasetInfo,
  onUpload,
  uploading,
  expectedColumns,
}: DatasetSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset input
    e.target.value = "";
  };

  return (
    <div className="card-surface p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-cursor-text-primary mb-2">
            {title}
          </h2>
          <p className="text-sm text-cursor-text-secondary mb-2">{description}</p>
          {expectedColumns && (
            <p className="text-xs text-cursor-text-muted">
              Colonnes attendues : {expectedColumns}
            </p>
          )}
        </div>
      </div>

      {datasetInfo?.exists && (
        <div className="bg-cursor-bg-tertiary border border-cursor-border-primary rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-cursor-text-muted">Dernière modification :</span>
              <p className="text-cursor-text-primary font-medium">
                {formatDate(datasetInfo.lastModified)}
              </p>
            </div>
            <div>
              <span className="text-cursor-text-muted">Nombre de lignes :</span>
              <p className="text-cursor-text-primary font-medium">
                {datasetInfo.lineCount?.toLocaleString("fr-FR") || "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      {!datasetInfo?.exists && (
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-400">
            Aucun fichier trouvé. Veuillez uploader un CSV.
          </p>
        </div>
      )}

      <div>
        <label
          htmlFor={`upload-${title}`}
          className={`inline-flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-700 font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer ${
            uploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Upload en cours...</span>
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
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Remplacer le fichier</span>
            </>
          )}
        </label>
        <input
          id={`upload-${title}`}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
      </div>
    </div>
  );
}

