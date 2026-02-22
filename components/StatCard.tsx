import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  color: string;
  icon?: React.ElementType; 
  description?: string;     
  onClick?: () => void;
  actionText?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  subValue, 
  color, 
  icon: Icon, 
  description, 
  onClick, 
  actionText 
}) => {
  return (
    <div 
      onClick={onClick}
      className={`relative bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white transition-all duration-300 overflow-hidden group
        ${onClick ? 'cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1' : ''}`} 
    >
      {/* Organic Background Shape */}
      <div 
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-5 blur-3xl transition-transform group-hover:scale-150" 
        style={{ backgroundColor: color }}
      ></div>

      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-island-muted text-[10px] font-black uppercase tracking-widest mb-3 font-display">{title}</h3>
          <p className="text-4xl font-display font-extrabold text-island-navy tracking-tight" style={{ color: color }}>
            {value}
          </p>
          
          {description && (
            <p className="text-sm text-island-muted/80 mt-2 font-medium leading-relaxed">{description}</p>
          )}

          {subValue && (
            <p className="text-xs mt-2 font-bold px-3 py-1 rounded-full inline-block" style={{ color: color, backgroundColor: `${color}15` }}>
              {subValue}
            </p>
          )}
        </div>

        {/* Icon Squircle */}
        {Icon && (
          <div className="p-4 rounded-2xl text-white shadow-lg shadow-gray-100 transform rotate-3 group-hover:rotate-6 transition-transform" style={{ backgroundColor: color }}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      
      {/* Action Footer */}
      {actionText && onClick && (
        <div className="mt-6 pt-4 border-t border-island-sand flex items-center text-xs font-bold uppercase tracking-wide text-island-muted group-hover:text-island-navy transition-colors">
          {actionText} <ArrowRightIcon className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
        </div>
      )}
    </div>
  );
};