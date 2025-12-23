import React, { useState } from 'react';
import { useSIM } from '../context/SIMContext';
import { Search, Phone, MapPin, User } from 'lucide-react';

export const GuestTable: React.FC = () => {
    const { simCards } = useSIM();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredCards = simCards.filter((card) =>
        card.employeeName.includes(searchTerm) ||
        card.jobTitle.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pr-10 pl-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm transition-all"
                    placeholder="بحث باسم الموظف أو العنوان الوظيفي..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Mobile Card View (Visible on small screens) */}
            <div className="grid gap-4 sm:hidden">
                {filteredCards.map((card) => (
                    <div key={card.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                    <User className="w-4 h-4 text-emerald-600" />
                                    {card.employeeName}
                                </h3>
                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                    {card.jobTitle}
                                </p>
                                <p className="text-sm font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg mt-2 inline-block" dir="ltr">
                                    {card.phoneNumber}
                                </p>
                            </div>
                            <a
                                href={`tel:${card.phoneNumber}`}
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-full hover:bg-emerald-100 transition-colors"
                                aria-label="Call"
                            >
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>
                        <div className="pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                            <MapPin className="w-3 h-3" />
                            {card.workLocation}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View (Hidden on small screens) */}
            <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    اسم الموظف
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    رقم الهاتف
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    العنوان الوظيفي
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    موقع العمل
                                </th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    اتصال
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredCards.map((card) => (
                                <tr key={card.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                                                {card.employeeName.charAt(0)}
                                            </div>
                                            <div className="mr-4">
                                                <div className="text-sm font-medium text-slate-900">{card.employeeName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-900" dir="ltr">{card.phoneNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-slate-900">{card.jobTitle}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                            {card.workLocation}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <a
                                            href={`tel:${card.phoneNumber}`}
                                            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-900 font-bold px-3 py-1 rounded-md hover:bg-emerald-50 transition-colors"
                                        >
                                            <Phone className="w-4 h-4" />
                                            اتصال
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
