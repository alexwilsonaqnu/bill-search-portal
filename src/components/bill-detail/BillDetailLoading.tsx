
import Navbar from "@/components/Navbar";

const BillDetailLoading = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-28 pb-20 px-6 animate-fade-in">
        <div className="h-16 w-3/4 bg-gray-100 rounded animate-pulse-light mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="h-64 bg-gray-100 rounded animate-pulse-light"></div>
          </div>
          <div className="md:col-span-2">
            <div className="h-96 bg-gray-100 rounded animate-pulse-light"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillDetailLoading;
