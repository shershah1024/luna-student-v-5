'use client'

interface LoaderProps {
  spinnerClassName?: string;
}

export function Loader({ spinnerClassName }: LoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div 
          className={spinnerClassName || "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"}
        ></div>
        <p className="mt-4 text-gray-600">Loading exam content...</p>
      </div>
    </div>
  )
}
