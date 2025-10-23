"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

type TableSchema = {
  status: string;
  fileName: string;
  columns: string[];
  rowCount: number;
  sampleData: Record<string, string>[];
};

type JoinConfig = {
  leftTable: string;
  rightTable: string;
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  leftKey: string;
  rightKey: string;
  outputColumns?: string[];
};

type JoinResult = {
  rows: Record<string, string>[];
  stats: {
    leftTableRows: number;
    rightTableRows: number;
    resultRows: number;
    joinType: string;
  };
};

export default function JoinPage() {
  const [schemas, setSchemas] = useState<TableSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<JoinResult | null>(null);
  const [exporting, setExporting] = useState(false);
  
  const [config, setConfig] = useState<JoinConfig>({
    leftTable: '',
    rightTable: '',
    joinType: 'INNER',
    leftKey: '',
    rightKey: ''
  });

  const joinTypes = [
    { value: 'INNER', label: 'INNER JOIN - Intersection' },
    { value: 'LEFT', label: 'LEFT JOIN - Toutes les lignes de gauche' },
    { value: 'RIGHT', label: 'RIGHT JOIN - Toutes les lignes de droite' },
    { value: 'FULL', label: 'FULL JOIN - Union complète' }
  ];

  useEffect(() => {
    loadSchemas();
  }, []);

  const loadSchemas = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/join/schema');
      const data = await response.json();
      
      if (data.success) {
        setSchemas(data.schemas);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des schémas:', error);
    } finally {
      setLoading(false);
    }
  };

  const executeJoin = async () => {
    if (!config.leftTable || !config.rightTable || !config.leftKey || !config.rightKey) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setExecuting(true);
      const response = await fetch('/api/join/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data.result);
      } else {
        alert('Erreur lors de la jointure: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'exécution:', error);
      alert('Erreur lors de l\'exécution de la jointure');
    } finally {
      setExecuting(false);
    }
  };

  const exportToCsv = async () => {
    if (!result) return;

    try {
      setExporting(true);
      const response = await fetch('/api/join/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: result.rows,
          filename: `jointure_${config.leftTable}_${config.rightTable}_${new Date().toISOString().split('T')[0]}.csv`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`Fichier exporté avec succès: ${data.filename} (${data.rowCount} lignes)`);
      } else {
        alert('Erreur lors de l\'export: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export du fichier');
    } finally {
      setExporting(false);
    }
  };

  const getAvailableColumns = (tableStatus: string) => {
    const tableSchema = schemas.find(s => s.status === tableStatus);
    return tableSchema ? tableSchema.columns : [];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--foreground)] mx-auto"></div>
          <p className="mt-2 text-sm text-neutral-600">Chargement des schémas...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Jointures de données</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Combinez les données des différents statuts d&apos;intervenants réseaux
            </p>
          </div>
          <Link 
            href="/"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm hover:bg-[var(--muted)]"
          >
            ← Retour à l&apos;application
          </Link>
        </div>

        {/* Statistiques des tables disponibles */}
        {schemas.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['U4', 'U3', 'U2', 'U1', 'U1P', 'TR'].map(status => {
              const statusSchemas = schemas.filter(s => s.status === status);
              const totalRows = statusSchemas.reduce((sum, s) => sum + s.rowCount, 0);
              return (
                <div key={status} className="bg-neutral-50 rounded-lg p-4 text-center border border-[var(--border)]">
                  <div className="text-2xl font-semibold text-neutral-900">{totalRows.toLocaleString()}</div>
                  <div className="text-sm text-neutral-600">Statut {status}</div>
                  <div className="text-xs text-neutral-500">{statusSchemas.length} fichier{statusSchemas.length > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Configuration de la jointure */}
        <div className="mb-8 rounded-xl border border-[var(--border)] p-6">
          <h2 className="text-lg font-semibold mb-4">Configuration de la jointure</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Table de gauche
              </label>
              <select
                value={config.leftTable}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, leftTable: e.target.value, leftKey: '' }));
                }}
                className="block w-full text-sm border border-[var(--border)] rounded-md px-3 py-2"
              >
                <option value="">Sélectionner...</option>
                {['U4', 'U3', 'U2', 'U1', 'U1P', 'TR'].map(status => (
                  <option key={status} value={status}>
                    {status} ({schemas.filter(s => s.status === status).reduce((sum, s) => sum + s.rowCount, 0).toLocaleString()} lignes)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Table de droite
              </label>
              <select
                value={config.rightTable}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, rightTable: e.target.value, rightKey: '' }));
                }}
                className="block w-full text-sm border border-[var(--border)] rounded-md px-3 py-2"
              >
                <option value="">Sélectionner...</option>
                {['U4', 'U3', 'U2', 'U1', 'U1P', 'TR'].map(status => (
                  <option key={status} value={status}>
                    {status} ({schemas.filter(s => s.status === status).reduce((sum, s) => sum + s.rowCount, 0).toLocaleString()} lignes)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Type de jointure
              </label>
              <select
                value={config.joinType}
                onChange={(e) => setConfig(prev => ({ ...prev, joinType: e.target.value as JoinConfig['joinType'] }))}
                className="block w-full text-sm border border-[var(--border)] rounded-md px-3 py-2"
              >
                {joinTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <button
                onClick={executeJoin}
                disabled={executing || !config.leftTable || !config.rightTable || !config.leftKey || !config.rightKey}
                className="w-full rounded-md bg-[var(--primary)] px-4 py-2 text-[var(--primary-foreground)] text-sm disabled:opacity-40"
              >
                {executing ? 'Exécution...' : 'Exécuter la jointure'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Clé de jointure - {config.leftTable}
              </label>
              <select
                value={config.leftKey}
                onChange={(e) => setConfig(prev => ({ ...prev, leftKey: e.target.value }))}
                disabled={!config.leftTable}
                className="block w-full text-sm border border-[var(--border)] rounded-md px-3 py-2 disabled:opacity-50"
              >
                <option value="">Sélectionner une colonne...</option>
                {getAvailableColumns(config.leftTable).map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Clé de jointure - {config.rightTable}
              </label>
              <select
                value={config.rightKey}
                onChange={(e) => setConfig(prev => ({ ...prev, rightKey: e.target.value }))}
                disabled={!config.rightTable}
                className="block w-full text-sm border border-[var(--border)] rounded-md px-3 py-2 disabled:opacity-50"
              >
                <option value="">Sélectionner une colonne...</option>
                {getAvailableColumns(config.rightTable).map(column => (
                  <option key={column} value={column}>{column}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Résultats */}
        {result && (
          <div className="rounded-xl border border-[var(--border)]">
            <div className="px-6 py-4 border-b border-[var(--border)] bg-neutral-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Résultats de la jointure</h3>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-neutral-600">
                    {result.stats.resultRows.toLocaleString()} lignes résultantes
                  </div>
                  <button
                    onClick={exportToCsv}
                    disabled={exporting}
                    className="rounded-md bg-green-600 px-4 py-2 text-white text-sm disabled:opacity-40"
                  >
                    {exporting ? 'Export...' : '📥 Exporter CSV'}
                  </button>
                </div>
              </div>
              
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
                <span>Table gauche ({config.leftTable}): {result.stats.leftTableRows.toLocaleString()} lignes</span>
                <span>Table droite ({config.rightTable}): {result.stats.rightTableRows.toLocaleString()} lignes</span>
                <span>Type: {result.stats.joinType}</span>
                <span>Clé gauche: {config.leftKey}</span>
                <span>Clé droite: {config.rightKey}</span>
              </div>
            </div>

            {/* Aperçu des résultats */}
            <div className="max-h-96 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 sticky top-0">
                  <tr>
                    {result.rows.length > 0 && Object.keys(result.rows[0]).slice(0, 10).map(key => (
                      <th key={key} className="px-4 py-2 text-left font-medium text-neutral-700">
                        {key}
                      </th>
                    ))}
                    {Object.keys(result.rows[0] || {}).length > 10 && (
                      <th className="px-4 py-2 text-left font-medium text-neutral-500">
                        ... (+{Object.keys(result.rows[0] || {}).length - 10} colonnes)
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.slice(0, 50).map((row, index) => (
                    <tr key={index} className="border-t border-[var(--border)]">
                      {Object.values(row).slice(0, 10).map((value, i) => (
                        <td key={i} className="px-4 py-2 text-neutral-900">
                          {value || '—'}
                        </td>
                      ))}
                      {Object.keys(row).length > 10 && (
                        <td className="px-4 py-2 text-neutral-500">...</td>
                      )}
                    </tr>
                  ))}
                  {result.rows.length > 50 && (
                    <tr>
                      <td className="px-4 py-4 text-center text-neutral-500" colSpan={Math.min(Object.keys(result.rows[0] || {}).length, 11)}>
                        ... et {result.rows.length - 50} autres lignes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tables disponibles */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Tables disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemas.map((schema, index) => (
              <div key={index} className="rounded-lg border border-[var(--border)] p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-neutral-900">{schema.status}</h4>
                  <span className="text-sm text-neutral-500">{schema.fileName}</span>
                </div>
                <div className="text-sm text-neutral-600 mb-3">
                  {schema.rowCount.toLocaleString()} lignes • {schema.columns.length} colonnes
                </div>
                <div className="text-xs text-neutral-500">
                  <div className="font-medium mb-1">Colonnes principales:</div>
                  <div className="flex flex-wrap gap-1">
                    {schema.columns.slice(0, 6).map(col => (
                      <span key={col} className="px-2 py-1 bg-neutral-100 rounded text-neutral-700">
                        {col}
                      </span>
                    ))}
                    {schema.columns.length > 6 && (
                      <span className="px-2 py-1 bg-neutral-100 rounded text-neutral-500">
                        +{schema.columns.length - 6}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
