import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Loader } from './components/Loader';
import { ErrorMessage } from './components/ErrorMessage';
import { generateQuestionsFromPDF } from './services/geminiService';
import { Auth } from './components/Auth';

declare const google: any;
declare const gapi: any;

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);

  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const API_KEY = process.env.API_KEY;

  useEffect(() => {
    const checkGapiAndGsi = () => {
      if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
        // GAPI client setup
        gapi.load('client', async () => {
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
          });
        });

        // GSI client setup
        const client = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/spreadsheets',
          callback: (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              gapi.client.setToken(tokenResponse);
              setIsAuthenticated(true);
            } else {
              console.error('Provided token response was invalid.', tokenResponse);
              setError("Échec de l'authentification Google. La réponse du token est invalide.");
              setIsAuthenticated(false);
            }
          },
          error_callback: (error: any) => {
             console.error('GSI Error:', error);
             setError(`Erreur d'authentification Google : ${error.details || error.message || 'Erreur inconnue.'}`);
          }
        });
        setTokenClient(client);
        setIsAuthReady(true);
      } else {
        // Poll for GAPI and GSI
        setTimeout(checkGapiAndGsi, 100);
      }
    };
    
    if(GOOGLE_CLIENT_ID && API_KEY) {
      checkGapiAndGsi();
    }
  }, [GOOGLE_CLIENT_ID, API_KEY]);


  const handleLogin = () => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (gapi && gapi.client) {
        gapi.client.setToken(null);
    }
  };

  const handleFileChange = (file: File | null) => {
    setPdfFile(file);
    setCsvData(null);
    setError(null);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleGenerateClick = useCallback(async () => {
    if (!pdfFile) {
      setError("Veuillez d'abord sélectionner un fichier PDF.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setCsvData(null);

    try {
      const base64String = await fileToBase64(pdfFile);
      const generatedCsv = await generateQuestionsFromPDF(base64String);
      setCsvData(generatedCsv);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la génération des questions.");
    } finally {
      setIsLoading(false);
    }
  }, [pdfFile]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto relative">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Générateur de Questions d'Entretien
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Analysez une description de poste PDF et créez instantanément une grille d'évaluation technique.
          </p>
        </header>
        
        {GOOGLE_CLIENT_ID && (
          <div className="absolute top-0 right-0 p-2">
            <Auth
              isAuthenticated={isAuthenticated}
              isAuthReady={isAuthReady}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          </div>
        )}

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700">
          <FileUpload onFileChange={handleFileChange} />

          {pdfFile && (
            <div className="mt-6 text-center">
              <p className="text-gray-300">
                Fichier sélectionné : <span className="font-semibold text-purple-400">{pdfFile.name}</span>
              </p>
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleGenerateClick}
              disabled={!pdfFile || isLoading}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/50 transition-all duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-105"
            >
              {isLoading ? 'Génération en cours...' : 'Générer les Questions'}
            </button>
          </div>

          <div className="mt-10">
            {isLoading && <Loader />}
            {error && <ErrorMessage message={error} />}
            {csvData && <ResultsDisplay csvData={csvData} isAuthenticated={isAuthenticated} />}
          </div>
        </main>
      </div>
       <footer className="w-full max-w-4xl mx-auto text-center mt-8 py-4 text-gray-500 text-sm">
          <p>&copy; {new Date().getFullYear()} Générateur de Questions. Conçu pour les recruteurs techniques.</p>
        </footer>
    </div>
  );
};

export default App;
