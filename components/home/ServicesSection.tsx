import React from 'react';
import { ServiceContent } from '../../types';
import {
    PaperAirplaneIcon,
    MapIcon,
    StarIcon,
    TruckIcon,
    GlobeAltIcon,
    LifebuoyIcon,
    TicketIcon,
    SunIcon
} from '@heroicons/react/24/outline';

const ICON_MAP: Record<string, React.ElementType> = {
    PaperAirplaneIcon,
    MapIcon,
    StarIcon,
    TruckIcon,
    GlobeAltIcon,
    LifebuoyIcon,
    TicketIcon,
    SunIcon
};

interface ServicesSectionProps {
    services?: ServiceContent[];
    onServiceClick: (service: any) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ services, onServiceClick }) => {
    const getServiceColor = (index: number) => {
        const colors = ['text-sey-blue', 'text-sey-green', 'text-yellow-700'];
        const borderColors = ['border-sey-blue', 'border-sey-green', 'border-sey-yellow'];
        const bgColors = ['bg-sey-blue', 'bg-sey-green', 'bg-sey-yellow'];
        const idx = index % 3;
        return { text: colors[idx], border: borderColors[idx], bg: bgColors[idx] };
    };

    return (
        <section className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Our Services</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {services?.map((service, idx) => {
                        const IconComponent = ICON_MAP[service.icon] || PaperAirplaneIcon;
                        const colors = getServiceColor(idx);
                        return (
                            <div
                                key={service.id}
                                onClick={() => onServiceClick(service)}
                                className={`bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all border-t-4 ${colors.border} group cursor-pointer transform hover:-translate-y-1 relative overflow-hidden`}
                            >
                                {service.showPrice && service.price && (
                                    <div className="absolute top-0 right-0 bg-sey-yellow text-gray-900 text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm z-10">
                                        {service.price}
                                    </div>
                                )}
                                <div className={`w-14 h-14 bg-opacity-10 rounded-full flex items-center justify-center mb-6 transition-colors ${colors.text} hover:${colors.bg} hover:text-white`}>
                                    <IconComponent className="w-8 h-8" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                                <p className="text-gray-600">{service.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
