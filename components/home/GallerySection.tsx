import React from 'react';
import { GalleryImage } from '../../types';

interface GallerySectionProps {
    gallery?: GalleryImage[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
    if (!gallery || gallery.length === 0) return null;

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Moments in Paradise</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gallery.map((img, idx) => (
                        <div
                            key={img.id}
                            className={`relative overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all duration-300 ${idx === 0 ? 'col-span-2 row-span-2' : ''} min-h-[200px]`}
                        >
                            <img
                                src={img.imageUrl}
                                alt={img.caption || ''}
                                className="w-full h-full object-cover hover:scale-105 transition duration-500"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
