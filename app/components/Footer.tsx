import { Link } from "@remix-run/react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-gray-300 py-8 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-2">People I&apos;ve Met</h3>
            <p className="text-sm">A personal collection of memorable connections.</p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/people" className="hover:text-white transition-colors">People</Link>
            <Link to="/author" className="hover:text-white transition-colors">About Me</Link>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-6 pt-6 text-sm text-center">
          <p>&copy; {currentYear} People I&apos;ve Met. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 