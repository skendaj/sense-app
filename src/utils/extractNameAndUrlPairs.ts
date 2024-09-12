type SpreadsheetData = {
  sheets: Array<{
    data: Array<{
      rowData: Array<{
        values: Array<{
          formattedValue?: string;
        }>;
      }>;
    }>;
  }>;
};

/**
 * Extracts pairs of trimmed name and URL from the spreadsheet data.
 * Every two consecutive entries represent a `NAME` and `URL`.
 * @param {SpreadsheetData} data - The spreadsheet data to search.
 * @returns {Array<{ NAME: string; URL: string }>} - An array of objects where each object contains a `NAME` and `URL`.
 */
export const extractNameAndUrlPairs = (data: SpreadsheetData): Array<{ NAME: string; URL: string }> => {
  const formattedValues: string[] = [];

  // Extract all formatted values from the spreadsheet data
  data.sheets.forEach(sheet => {
    sheet.data.forEach(sheetData => {
      sheetData.rowData.forEach(row => {
        row.values.forEach(cell => {
          if (cell.formattedValue) {
            formattedValues.push(cell.formattedValue.trim());
          }
        });
      });
    });
  });

  // Create an array of objects with `NAME` and `URL`
  const nameUrlPairs: Array<{ NAME: string; URL: string }> = [];
  for (let i = 0; i < formattedValues.length; i += 2) {
    nameUrlPairs.push({
      NAME: formattedValues[i],
      URL: formattedValues[i + 1],
    });
  }

  return nameUrlPairs;
};
