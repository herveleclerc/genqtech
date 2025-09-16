import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Loader } from './components/Loader';
import { ErrorMessage } from './components/ErrorMessage';
import { generateQuestionsFromPDF } from './services/geminiService';
import { Auth } from './components/Auth';
import { ToastContainer } from './components/ToastContainer';

declare const google: any;
declare const gapi: any;

interface Toast {
  id: number;
  message: string;
}

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const API_KEY = process.env.API_KEY;
  
  const addToast = useCallback((message: string) => {
    const newToast: Toast = { id: Date.now(), message };
    setToasts(prevToasts => [...prevToasts, newToast]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);


  useEffect(() => {
    // This effect handles the asynchronous loading and initialization of
    // the Google API (GAPI) for Sheets and Google Identity Services (GSI) for auth.
    const initializeLibraries = () => {
      if (typeof gapi !== 'undefined' && typeof google !== 'undefined') {
        // Both library scripts are loaded, now we initialize them.
        // We must ensure both are fully ready before enabling auth features
        // to prevent race conditions.
        
        let gapiInitialized = false;
        let gsiInitialized = false;
        
        const setAuthReadyWhenBothInitialized = () => {
            if (gapiInitialized && gsiInitialized) {
                setIsAuthReady(true);
            }
        };

        // 1. Initialize GAPI client for Google Sheets API calls
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              apiKey: API_KEY,
              discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
            gapiInitialized = true;
            setAuthReadyWhenBothInitialized();
          } catch (err) {
            console.error("Erreur lors de l'initialisation du client GAPI:", err);
            setCriticalError("Impossible d'initialiser l'API Google Sheets. Vérifiez la clé API et la configuration de l'API dans Google Cloud Console.");
          }
        });

        // 2. Initialize GSI token client for authentication
        try {
            const client = google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/spreadsheets',
              callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                  gapi.client.setToken(tokenResponse);
                  setIsAuthenticated(true);
                } else {
                  console.error('La réponse du token est invalide.', tokenResponse);
                  addToast("Échec de l'authentification Google. La réponse du token est invalide.");
                  setIsAuthenticated(false);
                }
              },
              error_callback: (error: any) => {
                 console.error('Erreur GSI:', error);
                 addToast(`Erreur d'authentification Google : ${error.details || error.message || 'Erreur inconnue.'}`);
              }
            });
            setTokenClient(client);
            gsiInitialized = true;
            setAuthReadyWhenBothInitialized();
        } catch(err) {
            console.error("Erreur lors de l'initialisation du client GSI:", err);
            setCriticalError("Impossible d'initialiser le service d'authentification Google. Vérifiez l'ID Client OAuth.");
        }

      } else {
        // One or both library scripts are not loaded yet, poll again.
        setTimeout(initializeLibraries, 100);
      }
    };
    
    if(GOOGLE_CLIENT_ID && API_KEY) {
      initializeLibraries();
    }
  }, [GOOGLE_CLIENT_ID, API_KEY, addToast]);


  const handleLogin = () => {
    if (tokenClient) {
      // Prompt the user to grant access. 'consent' will always show the consent screen.
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      addToast("Le client d'authentification n'est pas prêt. Veuillez patienter un instant et réessayer.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    if (gapi && gapi.client) {
        // Clears the token from the GAPI client for this session.
        gapi.client.setToken(null);
    }
  };

  const handleFileChange = (file: File | null) => {
    setPdfFile(file);
    setCsvData(null);
    setCriticalError(null);
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
      addToast("Veuillez d'abord sélectionner un fichier PDF.");
      return;
    }

    setIsLoading(true);
    setCsvData(null);

    try {
      const base64String = await fileToBase64(pdfFile);
      const generatedCsv = await generateQuestionsFromPDF(base64String);
      setCsvData(generatedCsv);
    } catch (err) {
      console.error(err);
      addToast(err instanceof Error ? err.message : "Une erreur inconnue est survenue lors de la génération des questions.");
    } finally {
      setIsLoading(false);
    }
  }, [pdfFile, addToast]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="w-full max-w-4xl mx-auto relative">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            Générateur de Questions d'Entretien
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Analysez une description de poste PDF et créez instantanément une grille d'évaluation technique.
          </p>
        </header>
        
        {GOOGLE_CLIENT_ID && API_KEY && (
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
            {criticalError && <ErrorMessage message={criticalError} />}
            {csvData && <ResultsDisplay csvData={csvData} isAuthenticated={isAuthenticated} onError={addToast} />}
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