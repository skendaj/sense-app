import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { log } from 'console';

interface UserInfo {
  access_token: string;
}

interface ProfileInfo {
  picture: string;
  name: string;
  email: string;
}

interface Spreadsheet {
  spreadsheetId: string;
  range: string;
}

const schema = z.object({
  searchTerm: z.string().nonempty('Search term is required'),
  location: z.enum(['Australia', 'New Zealand']).optional(),
  spreadsheetId: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const SearchForm: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [output, setOutput] = useState('');
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setUserInfo({ access_token: token });
    }
  }, []);
  const login = useGoogleLogin({
    onSuccess: (response: any) => {
      setUserInfo(response);
      localStorage.setItem('access_token', response.access_token);
    },
    onError: (error: any) => console.log(`Login Failed: ${error}`),
    scope: 'https://www.googleapis.com/auth/drive.readonly', 
  });

  useEffect(() => {
    if (userInfo) {
      console.log("token", userInfo.access_token);
      axios
        .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${userInfo.access_token}`, {
          headers: {
            Authorization: `Bearer ${userInfo.access_token}`,
            Accept: 'application/json',
          },
        })
        .then((response) => {
          setProfileInfo(response.data);
        })
        .catch((error) => console.log(error))
        
        fetchSpreadsheets();
        
    }
  }, [userInfo]);

  

  const fetchSpreadsheets = async () => {
    const spreadsheetId = '1H6fp3ZDZgWfJgFFlz2xjX_z6AfkNq4MDH32bmSwzLGo';
    const range = 'A1:Z100';
    const headers = { Authorization: `Bearer ${userInfo?.access_token}` };
  
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
      setSpreadsheets(spreadsheets); // Update spreadsheets state
  
      return spreadsheets;
    } catch (error) {
      console.error('Error fetching spreadsheets:', error);
      throw error;
    }
  };
  
  // Ensure useEffect fetches spreadsheets when userInfo updates
  useEffect(() => {
    if (userInfo) {
      fetchSpreadsheets();
    }
  }, [userInfo]);

  console.log("spreadsheets:", spreadsheets);
  

  const onSubmit = async (data: FormData) => {
    // Your submission logic here, handle search term, location, etc.
    console.log(data);
    // Example: setOutput('Search results');
  };

  const logOut = () => {
    googleLogout();
    localStorage.removeItem('access_token');
    setProfileInfo(null);
    setUserInfo(null);
    setSpreadsheets([]);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-6 border rounded-lg shadow-md">
      {profileInfo ? (
        <div>
          <img className="rounded-full h-24 w-24 mx-auto mb-4" src={profileInfo.picture} alt="Profile Image" />
          <h3 className="text-center text-xl font-bold">{profileInfo.name}</h3>
          <p className="text-center text-gray-600">{profileInfo.email}</p>
          <br />
          <button onClick={logOut} className="block mx-auto bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded mb-2">
            Log out
          </button>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
            <div className="mb-4">
              <label htmlFor="searchTerm" className="block text-gray-700 font-bold mb-2">Search Term :</label>
              <input
                type="text"
                id="searchTerm"
                {...register('searchTerm')}
                className={`w-full border ${errors.searchTerm ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 focus:outline-none focus:border-blue-500`}
              />
              {errors.searchTerm && <p className="text-red-500 text-sm mt-1">{errors.searchTerm.message}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">Location :</label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="Australia"
                  {...register('location')}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <span className="ml-2">Australia</span>
              </label>
              <label className="inline-flex items-center ml-6">
                <input
                  type="radio"
                  value="New Zealand"
                  {...register('location')}
                  className="form-radio h-5 w-5 text-blue-600"
                />
                <span className="ml-2">New Zealand</span>
              </label>
            </div>

            <div className="mb-4">
              <label htmlFor="spreadsheetId" className="block text-gray-700 font-bold mb-2">Spreadsheet :</label>
              <select
                id="spreadsheetId"
                {...register('spreadsheetId')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a spreadsheet</option>
                {/* Dynamically populate options based on fetched spreadsheets */}
                {spreadsheets.map((sheet, index) => (
                  <option key={index} value={sheet.id}>{sheet.name}</option>
                ))}
              </select>
            </div>

            <div className="text-center">
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                Search
              </button>
            </div>
          </form>
          <br/>
          <div className="mt-4">
            <label htmlFor="output" className="block text-gray-700 font-bold mb-2">Output :</label>
            <div>
              <textarea
                id="output"
                value={output}
                readOnly
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
                rows={150}
                cols={150}
              />
            </div>
          </div>

          {/* {spreadsheets.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-bold">Spreadsheet Content</h2>
              <table className="mt-4 w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    {spreadsheets[0].map((cell, index) => (
                      <th key={index} className="border border-gray-300 px-3 py-2 text-left">{cell}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {spreadsheets.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border border-gray-300">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 px-3 py-2">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )} */}
          

        </div>
      ) : (
        <button onClick={() => login()} className="block mx-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Sign in with Google
        </button>
      )}
    </div>
  );
};
