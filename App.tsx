import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Loader } from './components/Loader';
import { ErrorMessage } from './components/ErrorMessage';
import { generateQuestionsFromPDF } from './services/geminiService';
import { Auth } from './components/Auth';
import { ToastContainer } from './components/ToastContainer';
import { useGoogleAuth } from './services/useGoogleAuth';

interface Toast {
  id: number;
  message: string;
}

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { isAuthenticated, isAuthReady, login, logout, error: authError } = useGoogleAuth();

  const addToast = useCallback((message: string) => {
    const newToast: Toast = { id: Date.now(), message };
    setToasts(prevToasts => [...prevToasts, newToast]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  const handleFileChange = (file: File | null) => {
    setPdfFile(file);
    setCsvData(null);
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
      <div className="w-full max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-8 pt-2">
          {/* Espaceur vide pour équilibrer le bouton de connexion et aider à centrer le titre */}
          <div className="w-40 flex-shrink-0"></div>

          <header className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
              Générateur de Questions d'Entretien
            </h1>
            <p className="mt-4 text-lg text-gray-400">
              Analysez une description de poste PDF et créez instantanément une grille d'évaluation technique.
            </p>
          </header>
          
          {/* Conteneur pour le bouton d'authentification */}
          <div className="w-40 flex-shrink-0 flex justify-end">
            <Auth
              isAuthenticated={isAuthenticated}
              isAuthReady={isAuthReady}
              onLogin={login}
              onLogout={logout}
            />
          </div>
        </div>

        <main className="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-700">
          {authError && (
             <div className="mb-6">
               <ErrorMessage message={authError} />
             </div>
          )}

          {!authError && (
            <>
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
            </>
          )}

          <div className="mt-10">
            {isLoading && <Loader />}
            {csvData && !authError && <ResultsDisplay csvData={csvData} isAuthenticated={isAuthenticated} onError={addToast} />}
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