import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsService } from '../services/settingsService';

interface LogoProps {
  className?: string;
  showText?: boolean;
  lightText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "h-10", 
  showText = true, 
  lightText = false 
}) => {
  // Fetch settings to check for custom logo and name
  const { data: settings } = useQuery({ 
    queryKey: ['settings'], 
    queryFn: settingsService.getSettings,
  });

  const businessName = settings?.name || "Kreol Island Tours";

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* If custom logo exists in settings, use it. Otherwise, use default SVG. */}
      {settings?.logoUrl ? (
         <img 
           src={settings.logoUrl} 
           alt={businessName} 
           className="h-full w-auto object-contain drop-shadow-sm rounded-full" 
         />
      ) : (
        /* Abstract Seychelles Flag Icon (Fallback) */
        <svg 
          viewBox="0 0 100 100" 
          className="h-full w-auto drop-shadow-sm" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <clipPath id="circleClip">
              <circle cx="50" cy="50" r="50" />
            </clipPath>
          </defs>
          <g clipPath="url(#circleClip)">
             {/* Radiating bands adapted for circle */}
             {/* Blue */}
             <path d="M0 100 L0 0 L33 0 Z" fill="#003D88" />
             {/* Yellow */}
             <path d="M0 100 L33 0 L66 0 Z" fill="#FCD856" />
             {/* Red */}
             <path d="M0 100 L66 0 L100 0 Z" fill="#D62828" />
             {/* White */}
             <path d="M0 100 L100 0 L100 33 Z" fill="#FFFFFF" />
             {/* Green */}
             <path d="M0 100 L100 33 L100 100 Z" fill="#007A3D" />
          </g>
        </svg>
      )}

      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <span className={`font-extrabold tracking-wide text-lg uppercase ${lightText ? 'text-white' : 'text-sey-blue'}`}>
            {businessName}
          </span>
        </div>
      )}
    </div>
  );
};