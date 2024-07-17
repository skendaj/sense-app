import axios from 'axios';

export const getSpreadsheets = async (accessToken: string) => {
  const headers = { Authorization: `Bearer ${accessToken}` };

  try {
    const response = await axios.get(
      'https://www.googleapis.com/drive/v3/files',
      {
        params: {
          q: "mimeType='application/vnd.google-apps.spreadsheet'",
          fields: 'files(id, name)',
        },
        headers,
      }
    );

    const spreadsheets = response.data.files;

    return spreadsheets;
  } catch (error) {
    throw error;
  }
};