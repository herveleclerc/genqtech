declare const gapi: any;

/**
 * Creates a new Google Sheet with the provided data.
 * Assumes the GAPI client is initialized and the user is authenticated.
 * @param title The title of the new spreadsheet.
 * @param data A 2D array of strings representing the rows and cells.
 * @returns The URL of the newly created spreadsheet.
 */
export async function createGoogleSheet(title: string, data: string[][]): Promise<string> {
    if (typeof gapi === 'undefined' || typeof gapi.client === 'undefined' || typeof gapi.client.sheets === 'undefined') {
        throw new Error("La librairie client Google (gapi) n'a pas pu être chargée ou initialisée correctement. Vérifiez la connexion internet et le script dans index.html.");
    }
    
    try {
        // 1. Create the spreadsheet
        const createResponse = await gapi.client.sheets.spreadsheets.create({
            properties: {
                title,
            },
        });

        const spreadsheetId = createResponse.result.spreadsheetId;
        if (!spreadsheetId) {
            throw new Error("La création de la feuille de calcul a échoué, aucun ID n'a été retourné.");
        }
        
        // 2. Update the spreadsheet with data
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'A1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: data,
            },
        });

        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    } catch(err: any) {
        console.error("Erreur API Google Sheets:", err);
        let errorMessage = "Une erreur est survenue lors de l'interaction avec Google Sheets.";
        if (err.result && err.result.error) {
            const error = err.result.error;
            errorMessage = `Erreur Google Sheets (${error.code}): ${error.message}`;
            if (error.status === 'UNAUTHENTICATED') {
                errorMessage += " Votre session a peut-être expiré. Veuillez vous déconnecter et vous reconnecter.";
            }
        } else if (err.message) {
            errorMessage = err.message;
        }
        throw new Error(errorMessage);
    }
}
