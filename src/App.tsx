
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import BillDetail from "./pages/BillDetail";
import NotFound from "./pages/NotFound";

// Add history listener for debugging
const enableHistoryDebugging = () => {
  if (typeof window !== 'undefined') {
    // Listen for navigation events
    window.addEventListener('popstate', () => {
      console.log('Navigation occurred:', window.location.href);
    });
    
    // Log initial location
    console.log('Initial location:', window.location.href);
  }
};

// Create a new QueryClient instance with debug logging
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for debugging
      meta: {
        onError: (error: Error) => {
          console.error('Query error:', error);
        }
      }
    }
  }
});

// Call debug function
enableHistoryDebugging();

const App = () => {
  console.log("App rendered");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/bill/:id" element={<BillDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
