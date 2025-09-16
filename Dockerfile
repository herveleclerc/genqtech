# ---- Étape 1 : Construction de l'application React ----
# Utilise une image Node.js officielle comme base.
FROM node:18-alpine AS builder

# Définit le répertoire de travail dans le conteneur.
WORKDIR /app

# Déclare les arguments de build que nous attendons.
# Ce sont les placeholders qui seront injectés au moment du build.
ARG VITE_GEMINI_API_KEY_ARG="PLACEHOLDER_VITE_GEMINI_API_KEY"
ARG VITE_GOOGLE_CLIENT_ID_ARG="PLACEHOLDER_VITE_GOOGLE_CLIENT_ID"
ARG VITE_GOOGLE_SHEETS_API_KEY_ARG="PLACEHOLDER_VITE_GOOGLE_SHEETS_API_KEY"

# Copie les fichiers de dépendances.
COPY package.json package-lock.json ./

# Installe les dépendances du projet.
RUN npm install

# Copie tous les autres fichiers du projet.
COPY . .

# Expose les arguments de build en tant que variables d'environnement
# pour qu'ils soient disponibles pour la commande `npm run build`.
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY_ARG
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID_ARG
ENV VITE_GOOGLE_SHEETS_API_KEY=$VITE_GOOGLE_SHEETS_API_KEY_ARG

# Construit l'application pour la production.
# Vite va maintenant utiliser les variables d'environnement ci-dessus pour remplacer
# import.meta.env.VITE_* par les valeurs des placeholders.
RUN npm run build

# ---- Étape 2 : Service des fichiers avec Nginx ----
# Utilise une image Nginx officielle très légère.
FROM nginx:1.25-alpine

# Copie les fichiers statiques construits de l'étape précédente vers le répertoire de service de Nginx.
COPY --from=builder /app/dist /usr/share/nginx/html

# Copie notre fichier de configuration Nginx personnalisé.
# Cela écrase la configuration par défaut de Nginx pour gérer correctement les SPA.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie le script d'entrée dans l'image.
COPY entrypoint.sh /entrypoint.sh
# Donne les permissions d'exécution au script.
RUN chmod +x /entrypoint.sh

# Expose le port 80 pour autoriser le trafic entrant vers Nginx.
EXPOSE 80

# Définit le script comme point d'entrée. Il sera exécuté au démarrage du conteneur.
ENTRYPOINT ["/entrypoint.sh"]
