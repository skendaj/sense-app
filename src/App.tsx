
import './App.css'
import { SearchForm } from './components/SearchForm'
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {

  return (
    <GoogleOAuthProvider clientId="925328567254-5s20k4bldoob4tklqagi40mmsupoobrf.apps.googleusercontent.com">
      <SearchForm />
    </GoogleOAuthProvider>
  )
}

export default App
