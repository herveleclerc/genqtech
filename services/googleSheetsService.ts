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

    // --- Logique d'ajout des formules ---

    // 1. Modifier l'en-tête de la colonne G (index 6) pour qu'il soit "Note".
    if (data.length > 0) {
        const headerRow = data[0];
        if (headerRow.length > 6) {
            headerRow[6] = "Score Obtenu";
        } else {
            // S'assurer que la ligne d'en-tête a assez de colonnes
            while (headerRow.length < 6) {
                headerRow.push("");
            }
            headerRow.push("Note");
        }
    }

    // 2. Modifier la colonne G pour les lignes 2 à 21 avec la formule.
    // La boucle va de i = 1 (deuxième ligne du tableau) à 20 (21ème ligne).
    for (let i = 1; i <= 20; i++) {
        // S'assurer que la ligne existe dans les données reçues.
        if (data[i]) {
            const sheetRowIndex = i + 1; // L'index du tableau + 1 = la ligne dans la feuille

            // Traduction de la formule demandée pour l'API Google Sheets.
            const formula = `=SI(F${sheetRowIndex}="OK"; E${sheetRowIndex}*1; SI(F${sheetRowIndex}="Part."; E${sheetRowIndex}*0,5; SI(OU(F${sheetRowIndex}="Faux"; F${sheetRowIndex}<>"OK"; F${sheetRowIndex}<>"Part."); E${sheetRowIndex}*0; 0)))`;
            
            const dataRow = data[i];
            // S'assurer que la ligne de données a assez de colonnes jusqu'à G
            while (dataRow.length < 7) {
                dataRow.push("");
            }
            // Modifier la cellule de la colonne G (index 6) avec la formule.
            dataRow[6] = formula;
        }
    }
    // --- Fin de la logique d'ajout ---

    try {
        // 1. Créer la feuille de calcul
        const createResponse = await gapi.client.sheets.spreadsheets.create({
            properties: {
                title,
            },
        });

        const spreadsheetId = createResponse.result.spreadsheetId;
        if (!spreadsheetId) {
            throw new Error("La création de la feuille de calcul a échoué, aucun ID n'a été retourné.");
        }
        
        // 2. Mettre à jour la feuille avec les données ET les formules
        await gapi.client.sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'A1',
            valueInputOption: 'USER_ENTERED', // Crucial pour que les formules soient interprétées
            resource: {
                values: data,
            },
        });

        // 3. Appliquer les mises à jour de formatage et de validation en une seule fois
        const requests = [];

        // Requête pour figer la première ligne
        requests.push({
            updateSheetProperties: {
                properties: {
                    sheetId: 0,
                    gridProperties: {
                        frozenRowCount: 1,
                    },
                },
                fields: 'gridProperties.frozenRowCount',
            },
        });

        // Requête pour colorer le fond de la première ligne
        requests.push({
            repeatCell: {
                range: {
                    sheetId: 0,
                    startRowIndex: 0,
                    endRowIndex: 1,
                },
                cell: {
                    userEnteredFormat: {
                        backgroundColor: { red: 0.85, green: 0.85, blue: 0.85 }, // Gris clair
                    },
                },
                fields: 'userEnteredFormat.backgroundColor',
            },
        });

        // Requête pour activer le retour à la ligne automatique pour les colonnes A, B, C
        requests.push({
            repeatCell: {
                range: {
                    sheetId: 0,
                    startColumnIndex: 0, // Colonne A
                    endColumnIndex: 3,   // Jusqu'à la colonne C (exclusif)
                },
                cell: {
                    userEnteredFormat: {
                        wrapStrategy: 'WRAP',
                    },
                },
                fields: 'userEnteredFormat.wrapStrategy',
            },
        });

        // Requête pour redimensionner les colonnes A, B, C
        requests.push({
            updateDimensionProperties: {
                range: {
                    sheetId: 0,
                    dimension: 'COLUMNS',
                    startIndex: 0, // Colonne A
                    endIndex: 3,   // Jusqu'à la colonne C
                },
                properties: {
                    pixelSize: 485,
                },
                fields: 'pixelSize',
            },
        });

        // Requête pour l'alignement en haut à gauche des colonnes A à G
        requests.push({
            repeatCell: {
                range: {
                    sheetId: 0,
                    startColumnIndex: 0, // Colonne A
                    endColumnIndex: 7,   // Jusqu'à la colonne G
                },
                cell: {
                    userEnteredFormat: {
                        verticalAlignment: 'TOP',
                        horizontalAlignment: 'LEFT',
                    },
                },
                fields: 'userEnteredFormat(verticalAlignment,horizontalAlignment)',
            },
        });

        // Requête pour ajouter la validation des données (liste déroulente) à la colonne F
        requests.push({
            setDataValidation: {
                range: {
                    sheetId: 0,
                    startRowIndex: 1,
                    endRowIndex: 21,
                    startColumnIndex: 5,
                    endColumnIndex: 6,
                },
                rule: {
                    condition: {
                        type: 'ONE_OF_LIST',
                        values: [
                            { userEnteredValue: 'OK' },
                            { userEnteredValue: 'Part.' },
                            { userEnteredValue: 'Faux' },
                            { userEnteredValue: '---' },
                        ],
                    },
                    strict: true,
                    showCustomUi: true,
                },
            },
        });

        // Requêtes pour le formatage conditionnel (couleurs de fond pour le dropdown)
        const conditionalFormatRules = [
            // Règle pour "OK" -> Vert
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId: 0, startRowIndex: 1, endRowIndex: 21, startColumnIndex: 5, endColumnIndex: 6 }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'OK' }]
                            },
                            format: {
                                backgroundColor: { red: 0.8, green: 1.0, blue: 0.8 } // Vert clair
                            }
                        }
                    },
                    index: 0
                }
            },
            // Règle pour "Part." -> Orange
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId: 0, startRowIndex: 1, endRowIndex: 21, startColumnIndex: 5, endColumnIndex: 6 }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'Part.' }]
                            },
                            format: {
                                backgroundColor: { red: 1.0, green: 0.8, blue: 0.6 } // Orange clair
                            }
                        }
                    },
                    index: 1
                }
            },
            // Règle pour "Faux" -> Rouge
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId: 0, startRowIndex: 1, endRowIndex: 21, startColumnIndex: 5, endColumnIndex: 6 }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'Faux' }]
                            },
                            format: {
                                backgroundColor: { red: 1.0, green: 0.8, blue: 0.8 } // Rouge clair
                            }
                        }
                    },
                    index: 2
                }
            },
            // Règle pour "---" -> Gris
            {
                addConditionalFormatRule: {
                    rule: {
                        ranges: [{ sheetId: 0, startRowIndex: 1, endRowIndex: 21, startColumnIndex: 5, endColumnIndex: 6 }],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: '---' }]
                            },
                            format: {
                                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 } // Gris très clair
                            }
                        }
                    },
                    index: 3
                }
            }
        ];
        
        requests.push(...conditionalFormatRules);

        await gapi.client.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: requests,
            },
        });

        // 4. Ajouter la ligne de résumé à la fin de la feuille
        const summaryData = [
            // Colonnes A, B, C, D sont vides.
            ["", "", "", "", "Score Total", "=SOMME(G2:G21)", "Points Max", "=SOMME(E2:E21)"]
        ];

        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'A23', // Commence à écrire à la cellule A23
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: summaryData,
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
