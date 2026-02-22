import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="animate-pulse flex flex-col items-center">
        {/* Static SVG Logo to avoid database dependency during loading */}
        <div className="h-16 w-16 mb-6">
            <svg 
              viewBox="0 0 100 100" 
              className="h-full w-full drop-shadow-sm" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id="loadingCircleClip">
                  <circle cx="50" cy="50" r="50" />
                </clipPath>
              </defs>
              <g clipPath="url(#loadingCircleClip)">
                 <path d="M0 100 L0 0 L33 0 Z" fill="#003D88" />
                 <path d="M0 100 L33 0 L66 0 Z" fill="#FCD856" />
                 <path d="M0 100 L66 0 L100 0 Z" fill="#D62828" />
                 <path d="M0 100 L100 0 L100 33 Z" fill="#FFFFFF" />
                 <path d="M0 100 L100 33 L100 100 Z" fill="#007A3D" />
              </g>
            </svg>
        </div>
        
        <div className="h-1 w-32 bg-gray-200 rounded overflow-hidden">
           <div className="h-full bg-sey-blue w-1/3 animate-[shimmer_1s_infinite]"></div>
        </div>
        <p className="text-sm text-gray-400 mt-4 font-medium">Loading Kreolitt...</p>
      </div>
    </div>
  );
};