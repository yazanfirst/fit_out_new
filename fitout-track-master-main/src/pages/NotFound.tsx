
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-primary mb-6">404</h1>
        <p className="text-xl text-gray-700 mb-4">Oops! We couldn't find the page you're looking for.</p>
        <p className="text-gray-500 mb-8">
          The page at <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{location.pathname}</span> doesn't exist or may have been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button 
            className="flex items-center w-full sm:w-auto"
            onClick={() => navigate(-1)}
            variant="outline"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button 
            className="flex items-center w-full sm:w-auto"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
