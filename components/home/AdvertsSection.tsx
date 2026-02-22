import React from 'react';
import { Advert } from '../../types';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface AdvertsSectionProps {
    adverts?: Advert[];
    onBookAdvert: (ad: Advert) => void;
}

export const AdvertsSection: React.FC<AdvertsSectionProps> = ({ adverts, onBookAdvert }) => {
    if (!adverts || adverts.length === 0) return null;

    return (
        <section className="py-20 bg-white">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Featured Experiences</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {adverts.map((ad) => (
                        <div key={ad.id} className="group relative overflow-hidden rounded-2xl shadow-lg h-[400px] flex flex-col">
                            <div className="absolute inset-0">
                                <img
                                    src={ad.imageUrl}
                                    alt={ad.title}
                                    className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                            </div>
                            <div className="relative z-10 flex flex-col justify-end h-full p-6 text-white">
                                <div className="transform translate-y-2 group-hover:translate-y-0 transition duration-300">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-2xl font-bold leading-tight">{ad.title}</h3>
                                        {ad.price && (
                                            <span className="bg-sey-yellow text-gray-900 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ml-2 shadow-sm">
                                                {ad.price}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-200 mb-6 line-clamp-3 opacity-90">{ad.description}</p>
                                    <button
                                        onClick={() => onBookAdvert(ad)}
                                        className="w-full bg-white text-gray-900 hover:bg-sey-blue hover:text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg"
                                    >
                                        Book This Experience
                                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
