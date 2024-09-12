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
   * Recursively extracts all `formattedValue` entries from the spreadsheet data.
   * @param {SpreadsheetData} data - The spreadsheet data to search.
   * @returns {string[]} - An array of all found formatted values.
   */
  export const extractAllFormattedValues = (data: SpreadsheetData): string[] => {
    const formattedValues: string[] = [];
  
    data.sheets.forEach(sheet => {
      sheet.data.forEach(sheetData => {
        sheetData.rowData.forEach(row => {
          row.values.forEach(cell => {
            if (cell.formattedValue) {
              formattedValues.push(cell.formattedValue);
            }
          });
        });
      });
    });
  
    return formattedValues;
  };