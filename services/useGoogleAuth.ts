// src/services/useGoogleAuth.ts
import { useState, useEffect, useCallback } from 'react';

declare const google: any;
declare const gapi: any;

export const useGoogleAuth = () => {
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_SHEETS_API_KEY = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;

  const handleAuthResult = useCallback((tokenResponse: any) => {
    if (tokenResponse && tokenResponse.access_token) {
      gapi.client.setToken(tokenResponse);
      setIsAuthenticated(true);
      setError(null);
    } else {
      setIsAuthenticated(false);
      setError("La réponse d'authentification de Google est invalide.");
    }
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_SHEETS_API_KEY) {
      setError("Les variables d'environnement VITE_GOOGLE_CLIENT_ID ou VITE_GOOGLE_SHEETS_API_KEY ne sont pas définies.");
      return;
    }

    const scriptGsi = document.createElement('script');
    scriptGsi.src = 'https://accounts.google.com/gsi/client';
    scriptGsi.async = true;
    scriptGsi.defer = true;
    
    const scriptGapi = document.createElement('script');
    scriptGapi.src = 'https://apis.google.com/js/api.js';
    scriptGapi.async = true;
    scriptGapi.defer = true;
    
    let gapiLoaded = false;
    let gsiLoaded = false;

    const checkAndInitialize = () => {
        if (!gapiLoaded || !gsiLoaded) return;
        
        // 1. Initialiser GAPI pour l'API Sheets
        gapi.load('client', async () => {
          try {
            await gapi.client.init({
              apiKey: GOOGLE_SHEETS_API_KEY,
              discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
            });
          } catch (err) {
            console.error("Erreur GAPI Init:", err);
            setError("Impossible d'initialiser l'API Google Sheets.");
            return;
          }
          
          // 2. Initialiser GSI pour l'authentification
          try {
            const client = google.accounts.oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'https://www.googleapis.com/auth/spreadsheets',
              callback: handleAuthResult, // Pas de logique métier ici, juste le résultat
            });
            setTokenClient(client);
            setIsAuthReady(true); // Tout est prêt
          } catch(err) {
            console.error("Erreur GSI Init:", err);
            setError("Impossible d'initialiser l'authentification Google.");
          }
        });
    };
    
    scriptGsi.onload = () => { gsiLoaded = true; checkAndInitialize(); };
    scriptGapi.onload = () => { gapiLoaded = true; checkAndInitialize(); };
    
    document.body.appendChild(scriptGsi);
    document.body.appendChild(scriptGapi);

    return () => {
        document.body.removeChild(scriptGsi);
        document.body.removeChild(scriptGapi);
    };

  }, [GOOGLE_CLIENT_ID, GOOGLE_SHEETS_API_KEY, handleAuthResult]);

  const login = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }, [tokenClient]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    if (gapi && gapi.client) {
        gapi.client.setToken(null);
    }
  }, []);

  return { isAuthenticated, isAuthReady, login, logout, error };
};
