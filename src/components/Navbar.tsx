
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="w-full px-6 py-4 border-b bg-white/70 backdrop-blur-sm fixed top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link 
          to="/"
          className="inline-block transition-transform duration-300 hover:scale-105"
        >
          <h1 className="text-4xl font-bold billinois-logo">
            Billinois
          </h1>
        </Link>
        
        <Button 
          variant="outline" 
          size="sm"
          className="flex items-center gap-1.5"
          onClick={() => console.log("Login clicked")}
        >
          <LogIn className="h-4 w-4" />
          <span>Login</span>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
