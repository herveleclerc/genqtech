<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Générateur de Questions d'Entretien à partir de Descriptions de Poste

Cette application web a été conçue pour simplifier et accélérer le processus de recrutement technique. Elle analyse une description de poste au format PDF et génère automatiquement une grille d'évaluation complète sous forme de tableau CSV. Cette grille contient des questions pertinentes, le niveau de compétence attendu (junior, confirmé, senior), et le type de question (ouverte, technique, etc.), permettant ainsi aux recruteurs de préparer des entretiens structurés et efficaces.

## Caractéristiques

- **Analyse de PDF** : Importez une description de poste et laissez l'IA l'analyser pour vous.
- **Génération Intelligente** : Crée des questions pertinentes basées sur les compétences et les technologies requises dans le PDF.
- **Grille Structurée** : Organise les questions par catégorie, avec des niveaux de compétence et des types de question.
- **Exportation Facile** : Copiez les résultats, téléchargez-les au format CSV ou créez une feuille Google Sheets en un clic.
- **Authentification Sécurisée** : Utilisez votre compte Google pour vous connecter et enregistrer vos résultats sur Google Sheets.

## Comment ça marche ?

L'application utilise l'API Gemini pour analyser le contenu du PDF et générer les questions. Elle s'intègre également avec les API Google pour l'authentification et la création de feuilles de calcul, offrant une expérience fluide et intégrée.

## Configuration du Projet

**Prérequis :**
- Un compte Google Cloud avec un projet actif.
- Node.js installé sur votre machine.

### Étapes de Configuration

#### 1. Configuration de Google Cloud

- **Activer les API** :
  - Accédez à la [console Google Cloud](https://console.cloud.google.com/).
  - Assurez-vous que votre projet est sélectionné.
  - Activez les API suivantes :
    - **Google Sheets API**
    - **Google Drive API**

- **Créer un ID client OAuth 2.0** :
  - Allez dans `API et services > Identifiants`.
  - Cliquez sur `+ CRÉER DES IDENTIFIANTS` et choisissez `ID client OAuth`.
  - Sélectionnez `Application web` comme type d'application.
  - Ajoutez les **Origines JavaScript autorisées** :
    - `http://localhost:5173` (pour le développement local)
    - L'URL de votre application en production.
  - Ajoutez les **URI de redirection autorisés** :
    - `http://localhost:5173`
  - Copiez l'**ID client** qui vous est fourni.

- **Créer une Clé d'API** :
  - Dans la même section `Identifiants`, créez une **Clé d'API**.
  - Copiez cette clé.

#### 2. Configuration Locale

- **Cloner le projet** :
  ```bash
  git clone https://github.com/votre-utilisateur/votre-projet.git
  cd votre-projet
  ```

- **Installer les dépendances** :
  ```bash
  npm install
  ```

- **Configurer les variables d'environnement** :
  - Créez un fichier `.env.local` à la racine du projet.
  - Ajoutez les variables suivantes :

  ```env
  # Clé pour l'API Gemini (obtenue depuis Google AI Studio)
  GEMINI_API_KEY=VOTRE_CLÉ_GEMINI

  # ID client pour l'authentification OAuth 2.0
  GOOGLE_CLIENT_ID=VOTRE_ID_CLIENT_GOOGLE

  # Clé d'API pour l'accès à Google Sheets
  API_KEY=VOTRE_CLÉ_API_GOOGLE_CLOUD
  ```

### Lancer l'Application

- **Démarrer le serveur de développement** :
  ```bash
  npm run dev
  ```
- Ouvrez votre navigateur et allez sur `http://localhost:5173`.
</div>
