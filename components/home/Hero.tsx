import React from 'react';
import { BusinessSettings, DEFAULT_HERO_IMAGE_URL } from '../../types';

interface HeroProps {
    settings?: BusinessSettings;
    onBookClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onBookClick }) => {
    const heroImage = settings?.heroImageUrl || DEFAULT_HERO_IMAGE_URL;

    return (
        <div className={`relative h-[85vh] flex items-center justify-center overflow-hidden ${!heroImage ? 'bg-blue-50' : ''}`}>
            {heroImage && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={heroImage}
                        alt="Seychelles"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30"></div>
                </div>
            )}

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto mt-16">
                <h1 className={`text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight ${heroImage ? 'text-white drop-shadow-lg' : 'text-sey-blue'}`}>
                    {settings?.name || "Kreol Island Tours"}
                </h1>
                <p className={`text-xl md:text-2xl mb-10 font-medium max-w-2xl mx-auto ${heroImage ? 'text-sey-yellow drop-shadow-md' : 'text-gray-600'}`}>
                    {settings?.tagline || "Experience the Seychelles like a local"}
                </p>
                <button
                    onClick={onBookClick}
                    className="bg-sey-red hover:bg-red-700 text-white font-bold py-4 px-8 rounded-full text-lg transition-all transform hover:scale-105 shadow-xl"
                >
                    Book Your Adventure
                </button>
            </div>
        </div>
    );
};
