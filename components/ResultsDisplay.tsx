import React, { useState, useMemo } from 'react';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CheckIcon } from './icons/CheckIcon';
import { GoogleSheetsIcon } from './icons/GoogleSheetsIcon';
import { ErrorMessage } from './ErrorMessage';
import { createGoogleSheet } from '../services/googleSheetsService';

interface ResultsDisplayProps {
  csvData: string;
  isAuthenticated: boolean;
}

// A simple CSV parser that handles quoted fields
const parseCsv = (csvString: string): string[][] => {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    // Normalize line endings
    const normalizedCsv = csvString.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    for (let i = 0; i < normalizedCsv.length; i++) {
        const char = normalizedCsv[i];

        if (inQuotes) {
            if (char === '"') {
                if (i + 1 < normalizedCsv.length && normalizedCsv[i + 1] === '"') {
                    currentField += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                currentRow.push(currentField);
                currentField = '';
            } else if (char === '\n') {
                currentRow.push(currentField);
                rows.push(currentRow);
                currentRow = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }
    // Add the last field and row
    currentRow.push(currentField);
    rows.push(currentRow);

    return rows.filter(row => row.length > 1 || (row.length === 1 && row[0] !== ''));
};


export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ csvData, isAuthenticated }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const isGoogleClientConfigured = !!process.env.GOOGLE_CLIENT_ID;

  const parsedData = useMemo(() => {
    if (!csvData) return { headers: [], rows: [] };
    const allRows = parseCsv(csvData);
    if (allRows.length === 0) return { headers: [], rows: [] };
    
    const headers = allRows[0];
    const rows = allRows.slice(1);
    
    return { headers, rows };
  }, [csvData]);
  
  const { headers, rows } = parsedData;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(csvData).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'questions-entretien.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSheet = async () => {
    setIsCreatingSheet(true);
    setSheetUrl(null);
    setSheetError(null);
    try {
      const fullData = [headers, ...rows];
      const url = await createGoogleSheet("Questions d'entretien générées", fullData);
      setSheetUrl(url);
    } catch (err) {
      console.error(err);
      setSheetError(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la création de la feuille Google Sheet.");
    } finally {
      setIsCreatingSheet(false);
    }
  };
  
  const getGoogleSheetButtonTitle = () => {
    if (!isGoogleClientConfigured) return "L'ID client Google n'est pas configuré";
    if (!isAuthenticated) return "Veuillez vous connecter pour créer une feuille Google Sheet";
    return "Créer une feuille de calcul Google";
  };

  return (
    <div className="w-full bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-gray-100">Résultats Générés</h2>
        <div className="flex space-x-2">
          <button
            onClick={handleCopyToClipboard}
            className="flex items-center px-3 py-2 bg-gray-700 text-sm font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200"
          >
            {isCopied ? <CheckIcon className="w-5 h-5 mr-2 text-green-400" /> : <ClipboardIcon className="w-5 h-5 mr-2" />}
            {isCopied ? 'Copié!' : 'Copier'}
          </button>
           <button
            onClick={handleCreateSheet}
            disabled={!isGoogleClientConfigured || isCreatingSheet || !isAuthenticated}
            className="flex items-center px-3 py-2 bg-green-700 text-sm font-medium rounded-md hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 transition-all duration-200 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            title={getGoogleSheetButtonTitle()}
          >
            <GoogleSheetsIcon className="w-5 h-5 mr-2" />
            {isCreatingSheet ? 'Création...' : 'Créer Google Sheet'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center px-3 py-2 bg-indigo-600 text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-all duration-200"
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            Télécharger CSV
          </button>
        </div>
      </div>
       {!isGoogleClientConfigured && (
        <div className="mb-4 bg-yellow-900/50 border border-yellow-500 text-yellow-300 px-4 py-2 rounded-lg text-sm" role="alert">
          Pour activer la création de Google Sheets, un administrateur doit configurer la variable d'environnement GOOGLE_CLIENT_ID.
        </div>
      )}
      {sheetError && <div className="my-4"><ErrorMessage message={sheetError} /></div>}
      {sheetUrl && (
        <div className="my-4 p-4 bg-green-900/50 border border-green-500 text-green-200 rounded-lg flex items-center justify-between">
          <p>
            <strong className="font-bold">Succès !</strong> Feuille de calcul créée.
          </p>
          <a href={sheetUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors">
            Ouvrir la feuille
          </a>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              {headers.map((header, index) => (
                <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-800/50 transition-colors">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-pre-wrap text-sm text-gray-200 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
