
const LoadingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 text-gray-800 rounded-lg p-3 max-w-[80%]">
        <div className="flex space-x-2">
          <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce"></div>
          <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce delay-75"></div>
          <div className="h-2 w-2 bg-brand-primary rounded-full animate-bounce delay-150"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;

