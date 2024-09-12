import { Button } from "./ui/button";
import { Label } from "./ui/label";

export const Header = () => {
  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6">
     <img className="h-8 w-auto mr-4" src="/sense.png" alt="Sense" />
        <Label className="text-white">Sense</Label>

      <div className="ml-auto flex gap-2">

       
        <Button variant="outline" className="justify-self-end px-2 py-1 text-xs rounded-lg">
          Sign in
        </Button>
      
      </div>
    </header>
  </div>
  );
};