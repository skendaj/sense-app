import { Button } from "./ui/button";

export const Header = () => {
  return (
    <div className="container mx-auto px-4 md:px-6 lg:px-8">
    <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6">
      {/* <Link href="#" className="mr-6 hidden lg:flex" prefetch={false}> */}
        {/* <CarIcon className="h-6 w-6" /> */}
        <span className="sr-only">Sense</span>
      {/* </Link> */}
      <div className="ml-auto flex gap-2">
        {/* <Link
          href="#"
          className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 focus:bg-gray-100 focus:text-gray-900 focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-gray-100/50 data-[state=open]:bg-gray-100/50 dark:bg-gray-950 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:data-[active]:bg-gray-800/50 dark:data-[state=open]:bg-gray-800/50"
          prefetch={false}
        > */}
          Home
        {/* </Link> */}
      
        
       
       
        <Button variant="outline" className="justify-self-end px-2 py-1 text-xs">
          Sign in
        </Button>
        <Button className="justify-self-end px-2 py-1 text-xs">Sign Up</Button>
      </div>
    </header>
  </div>
  );
};