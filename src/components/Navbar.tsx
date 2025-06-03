
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="w-full px-6 py-4 border-b bg-white/70 backdrop-blur-sm fixed top-0 z-10">
      <div className="max-w-7xl mx-auto ml-20">
        <Link 
          to="/"
          className="inline-block transition-transform duration-300 hover:scale-105"
          aria-label="Billinois Home"
        >
          <h1 className="text-4xl font-bold logo-text billinois-logo">Billinois</h1>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
