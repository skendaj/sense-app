import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { extractNameAndUrlPairs } from '../utils/extractNameAndUrlPairs';
import { Header } from './Header';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { CircleNotch } from '@phosphor-icons/react';
import { formattedList } from '@/utils/formattedList';
import { ShoppingData, extractSerpApiSourceAndLinkPairs } from '@/utils/extractSerpApiSourceAndLinkPairs';

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
  const [serpResults, setSerpResults] = useState<ShoppingData>({});
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [nextLink, setNextLink] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const { register, handleSubmit, formState: { errors }, setValue, getValues } = useForm<FormData>({
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
          params: { includeGridData: true, ranges: 'A1:B31155' }
        }
      );
      
      setOutput(JSON.stringify(sheetsResponse.data));
    } catch (error) {
      setIsLoading(false);
      console.error('Error fetching spreadsheet content:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSerpResults = async (searchTerm: string, location: string, url?: string) => {
    setIsLoading(true);
    
    const apiKey = import.meta.env.VITE_SERP_API_KEY;
    const requestUrl = url ? `${url}&api_key=${apiKey}` : 'https://serpapi.com/search.json';
    
    try {
      const response = await axios.get(requestUrl, {
        params: !url ? {
          engine: 'google_shopping',
          google_domain: location === 'Australia' ? 'google.com.au' : 'google.co.nz',
          q: searchTerm,
          tbm: 'shop',
          location: location,
          num: itemsPerPage,
          api_key: apiKey,
        } : undefined,
      });
  
      setSerpResults(response.data);
      setNextLink(response.data.serpapi_pagination?.next || null);
      return response.data;
    } catch (error) {
      console.error('Error fetching SERP results:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log("formData:", data);
    setCurrentPage(0);
    setNextLink(null); 
    setIsLoading(true);
    try {
      const serpResults = await fetchSerpResults(data.searchTerm, data.location || 'Australia');
      const serpSourceLinkPairs = extractSerpApiSourceAndLinkPairs(serpResults);
      setOutput(formattedList(serpSourceLinkPairs));
    } catch (error) {
      console.error('Error during submission:', error);
      setOutput('Error fetching results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextPage = async () => {
    if (nextLink) {
      await fetchSerpResults('', '', nextLink);
      setCurrentPage(currentPage + 1);
    }
  };
  
  
  // const handlePreviousPage = async () => {
  //   const searchTerm = getValues('searchTerm') as string;
  //   const location = getValues('location') as string;
  //   if (currentPage > 0) {
  //     const previousPage = currentPage - 1;
  //     const start = previousPage * itemsPerPage;
  //     setCurrentPage(previousPage);
  //     await fetchSerpResults(searchTerm, location, start);
  //   }
  // };

  const logOut = () => {
    googleLogout();
    localStorage.removeItem('access_token');
    setProfileInfo(null);
    setUserInfo(null);
    setSpreadsheets([]);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Prospect Search</CardTitle>
          </CardHeader>
          <CardContent>
            {profileInfo ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={profileInfo.picture} alt="Profile" />
                    <AvatarFallback>{profileInfo.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h2 className="text-xl font-semibold">{profileInfo.name}</h2>
                  <p className="text-sm text-gray-500">{profileInfo.email}</p>
                </div>
              
                <Button variant="destructive" onClick={logOut} className="w-full">
                  Log out
                </Button>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchTerm">Search Term</Label>
                    <Input
                      id="searchTerm"
                      {...register('searchTerm')}
                      className={errors.searchTerm ? 'border-red-500' : ''}
                    />
                    {errors.searchTerm && <p className="text-sm text-red-500">{errors.searchTerm.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Location</Label>
                    <RadioGroup 
                      defaultValue="Australia" 
                      onValueChange={(value: "Australia" | "New Zealand") => setValue('location', value)}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Australia" id="australia" />
                        <Label htmlFor="australia">Australia</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="New Zealand" id="newZealand" />
                        <Label htmlFor="newZealand">New Zealand</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spreadsheetId">Spreadsheet</Label>
                    <Select onValueChange={(value) => {
                      setSelectedSpreadsheetId(value)
                      setValue('spreadsheetId', value)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select a spreadsheet (${spreadsheets.length})`} />
                      </SelectTrigger>
                      <SelectContent>
                        {spreadsheets.map((sheet) => (
                          <SelectItem key={sheet.id} value={sheet.id}>
                            {sheet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <CircleNotch size={16} className="mr-2 animate-spin" />
                        Loading
                      </>
                    ) : (
                      'Search'
                    )}
                  </Button>
                </form>

                <div className="space-y-2">
                <Label htmlFor="output">Output</Label>
                <div className="relative w-full h-64">
                  {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CircleNotch size={16} className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div
                      id="output"
                      className="w-full h-full text-left resize-none overflow-auto p-3 bg-white border border-neutral-200 rounded-lg shadow-sm dark:bg-neutral-900 dark:border-neutral-800"
                      dangerouslySetInnerHTML={{ __html: output }}
                    />
                  )}
                </div>
                {output && (
                  <div className="flex justify-between mt-2">
                    {/* <Button onClick={handlePreviousPage} disabled={currentPage === 0}>
                      Previous
                    </Button> */}
                    <Button onClick={handleNextPage}>
                      Next
                    </Button>
                  </div>
                )}
              </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <Button onClick={() => login()} size="lg">
                  Sign in with Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};