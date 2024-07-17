import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface UserInfo {
  access_token: string;
}

interface ProfileInfo {
  picture: string;
  name: string;
  email: string;
}

const schema = z.object({
  searchTerm: z.string().nonempty('Search term is required'),
  location: z.enum(['Australia', 'New Zealand']).optional(),
  additionalOption: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const SearchForm: React.FC = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [output, setOutput] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    // Check if there's a token in localStorage on component mount
    const token = localStorage.getItem('access_token');
    if (token) {
      // Initialize userInfo with the stored token
      setUserInfo({ access_token: token });
    }
  }, []);

  const login = useGoogleLogin({
    onSuccess: (response: any) => {
      setUserInfo(response);
      localStorage.setItem('access_token', response.access_token);
    },
    onError: (error: any) => console.log(`Login Failed: ${error}`),
  });

  useEffect(() => {
    if (userInfo) {
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
        .catch((error) => console.log(error));
    }
  }, [userInfo]);

  const onSubmit = (data: FormData) => {
    // Example: Perform search based on searchTerm, location, and additionalOption
    let searchParams = `Searching for "${data.searchTerm}"`;
    if (data.location) {
      searchParams += ` in ${data.location}`;
    }
    if (data.additionalOption) {
      searchParams += `. Additional option: ${data.additionalOption}`;
    }
    setOutput(searchParams);
    // You can add your search logic here (e.g., using axios to perform a search query)
  };

  const logOut = () => {
    googleLogout();
    localStorage.removeItem('access_token'); // Clear token from localStorage
    setProfileInfo(null); // Reset profile info
    setUserInfo(null); // Reset user info
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
          <label htmlFor="additionalOption" className="block text-gray-700 font-bold mb-2">Spreadsheet :</label>
          <select
            id="additionalOption"
            {...register('additionalOption')}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="">Select an option</option>
            <option value="Option 1">Option 1</option>
            <option value="Option 2">Option 2</option>
            <option value="Option 3">Option 3</option>
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
          rows={5}
        />
        </div>
      </div>
        </div>
      ) : (
        <button onClick={() => login()} className="block mx-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
          Sign in with Google
        </button>
      )}

    
    </div>
  );
};
