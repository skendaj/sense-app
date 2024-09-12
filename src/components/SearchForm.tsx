import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import {  useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {  extractNameAndUrlPairs } from '../utils/extractNameAndUrlPairs';
import { Header } from './Header';
import { Card, CardContent, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

interface UserInfo {
  access_token: string;
}

interface ProfileInfo {
  picture: string;
  name: string;
  email: string;
}

interface Spreadsheet {
  id: string;
  name: string;
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
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

console.log("selectedSpreadsheetId:", selectedSpreadsheetId);
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      searchTerm: 'Chair',
      location: 'Australia',
    },
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
    scope: 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly',
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
    const headers = { Authorization: `Bearer ${userInfo?.access_token}` };
  
    try {
      const response = await axios.get(
        'https://www.googleapis.com/drive/v3/files',
        {
          params: {
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: 'files(id, name)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true,
            orderBy: 'createdTime desc',
          },
          headers,
        }
      );
  
      const spreadsheets = response.data.files;
      setSpreadsheets(spreadsheets); 
  
      return spreadsheets;
    } catch (error) {
      console.error('Error fetching spreadsheets:', error);
      throw error;
    }
  };

  const fetchSpreadsheetContent = async (spreadsheetId: string) => {
    const headers = { Authorization: `Bearer ${userInfo?.access_token}` };
    setIsLoading(true);
    try {
      const sheetsResponse = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,

        { headers, 
          params: { 
            includeGridData: true, 
            ranges: 'A1:B31155',
            // fields: 'sheets(properties(sheetId, title))',

        } 
      }
      );
      console.log("Content@Spreadsheet:", sheetsResponse.data);

  
      setOutput(JSON.stringify(sheetsResponse.data));
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching spreadsheet content:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Ensure useEffect fetches spreadsheets when userInfo updates
  useEffect(() => {
    if (userInfo) {
      fetchSpreadsheets();
      // fetchSpreadsheetContent(spreadsheets[0].id);

    }
  }, [userInfo]);

  

  const onSubmit = async (data: FormData) => {
    console.log("formData:", data);
    // setOutput('Loading...');
    if (data.spreadsheetId) {
      try {
        await fetchSpreadsheetContent(data.spreadsheetId);
      } catch (error) {
        console.log('Error fetching spreadsheet content:', error);
        setOutput('Error fetching spreadsheet content');
      }
    } else {
      console.log('No spreadsheet selected');
      setOutput('No spreadsheet selected');
    }
  };

  const logOut = () => {
    googleLogout();
    localStorage.removeItem('access_token');
    setProfileInfo(null);
    setUserInfo(null);
    setSpreadsheets([]);
  };

  let formattedValues: any[] = [];
  if (output) {
    try {
      const parsedOutput = JSON.parse(output);
      formattedValues = extractNameAndUrlPairs(parsedOutput);
    } catch (error) {
      console.error('Error parsing output:', error);
    }
  }
  console.log("formattedValues:", formattedValues);

  return (
    <>
    <Header />
    <Card className="max-w-4xl mx-auto mt-8">
    <CardContent className="p-6">
      {profileInfo ? (
        <div>
          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={profileInfo.picture} alt="Profile Image" />
              <AvatarFallback>{profileInfo.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-xl font-bold">{profileInfo.name}</CardTitle>
            <p className="text-gray-600">{profileInfo.email}</p>
          </div>
          
          <Button variant="destructive" onClick={logOut} className="w-full mb-6">
            Log out
          </Button>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="searchTerm">Search Term</Label>
              <Input
                id="searchTerm"
                {...register('searchTerm')}
                defaultValue="Chair"
                className={errors.searchTerm ? 'border-red-500' : ''}
              />
              {errors.searchTerm && <p className="text-red-500 text-sm">{errors.searchTerm.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <RadioGroup 
                defaultValue="Australia" 
                onValueChange={(value: "Australia" | "New Zealand") => setValue('location', value)}
              >                
              <div className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Australia" id="australia" />
                    <Label htmlFor="australia">Australia</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="New Zealand" id="newZealand" />
                    <Label htmlFor="newZealand">New Zealand</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="spreadsheetId">Spreadsheet</Label>
              <Select onValueChange={(value) => {
                setSelectedSpreadsheetId(value);
                setValue('spreadsheetId', value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select a spreadsheet (${spreadsheets.length})`} />
                </SelectTrigger>
                <SelectContent>
                  {spreadsheets.map((sheet, index) => (
                    <SelectItem key={index} value={sheet.id}>
                      {sheet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'Loading...' : 'Search'}
            </Button>
          </form>

          <div className="mt-6 space-y-2">
            <Label htmlFor="output">Output</Label>
            <div className="relative w-full h-64">
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <Textarea
                  id="output"
                  value={output}
                  readOnly
                  className="w-full h-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </div>
        </div>
      ) : (
        <Button onClick={() => login()} className="w-full">
          Sign in with Google
        </Button>
      )}
    </CardContent>
  </Card>
    </>
  );
};
