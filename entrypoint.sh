#!/bin/sh

# Ce script est destiné à être exécuté au démarrage du contur.
# Il remplace les placeholders dans les fichiers JavaScript par les variables d'environnement réelles.

# Le répertoire où les fichiers statiques (JS) sont servis par Nginx.
ROOT_DIR=/usr/share/nginx/html

# Parcourir tous les fichiers .js dans le répertoire racine et ses sous-dossiers.
find $ROOT_DIR -type f -name "*.js" | while read file
do
  # Remplacer les placeholders par les valeurs des variables d'environnement.
  # Les variables d'environnement doivent être préfixées par VITE_ pour être reconnues.
  sed -i "s|PLACEHOLDER_VITE_GEMINI_API_KEY|$VITE_GEMINI_API_KEY|g" "$file"
  sed -i "s|PLACEHOLDER_VITE_GOOGLE_CLIENT_ID|$VITE_GOOGLE_CLIENT_ID|g" "$file"
  sed -i "s|PLACEHOLDER_VITE_GOOGLE_SHEETS_API_KEY|$VITE_GOOGLE_SHEETS_API_KEY|g" "$file"
done

# Démarrer le serveur Nginx en avant-plan.
# L'option -g "daemon off;" est cruciale pour que le conteneur reste en cours d'exécution.
exec nginx -g 'daemon off;'
