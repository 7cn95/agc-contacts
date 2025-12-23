import React from 'react';
import { useSIM } from '../context/SIMContext';
import { DollarSign, AlertTriangle, CheckCircle, Activity } from 'lucide-react';

export interface AdminDashboardProps {
    onFilterSelect: (status: 'all' | 'active' | 'expired' | 'expiring_soon') => void;
    activeFilter: 'all' | 'active' | 'expired' | 'expiring_soon';
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onFilterSelect, activeFilter }) => {
    const { simCards } = useSIM();

    const totalCost = simCards.reduce((acc, card) => acc + (card.billAmount || 0), 0);
    const expiringSoon = simCards.filter((card) => {
        if (!card.expirationDate) return false;
        const days = (new Date(card.expirationDate).getTime() - Date.now()) / (1000 * 3600 * 24);
        return days <= 3 && days >= 0;
    }).length;
    const expired = simCards.filter(c => c.status === 'Expired').length;
    const active = simCards.filter(c => c.status === 'Active').length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Cost */}
            <div
                onClick={() => onFilterSelect('all')}
                className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer hover:border-indigo-200 transition-all flex items-center justify-between ${activeFilter === 'all' ? 'ring-2 ring-indigo-500 border-transparent' : 'border-slate-100'}`}
            >
                <div>
                    <p className="text-sm font-medium text-slate-500">التكلفة الشهرية</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">
                        {totalCost.toLocaleString()} <span className="text-sm font-normal text-slate-400">د.ع</span>
                    </p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                    <DollarSign className="w-6 h-6" />
                </div>
            </div>

            {/* Expiring Soon */}
            <div
                onClick={() => onFilterSelect('expiring_soon')}
                className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer hover:bg-amber-50/50 transition-all flex items-center justify-between ${activeFilter === 'expiring_soon' ? 'ring-2 ring-amber-500 border-transparent' : (expiringSoon > 0 ? 'border-amber-200 ring-4 ring-amber-50' : 'border-slate-100')}`}
            >
                <div>
                    <p className="text-sm font-medium text-slate-500">تنتهي قريباً (3 أيام)</p>
                    <p className={`text-2xl font-bold mt-1 ${expiringSoon > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                        {expiringSoon}
                    </p>
                </div>
                <div className={`p-3 rounded-xl ${expiringSoon > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                    <AlertTriangle className="w-6 h-6" />
                </div>
            </div>

            {/* Active Lines */}
            <div
                onClick={() => onFilterSelect('active')}
                className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer hover:border-emerald-200 transition-all flex items-center justify-between ${activeFilter === 'active' ? 'ring-2 ring-emerald-500 border-transparent' : 'border-slate-100'}`}
            >
                <div>
                    <p className="text-sm font-medium text-slate-500">الخطوط الفعالة</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{active}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                    <CheckCircle className="w-6 h-6" />
                </div>
            </div>

            {/* Expired Lines */}
            <div
                onClick={() => onFilterSelect('expired')}
                className={`bg-white p-6 rounded-2xl shadow-sm border cursor-pointer hover:border-red-200 transition-all flex items-center justify-between ${activeFilter === 'expired' ? 'ring-2 ring-red-500 border-transparent' : 'border-slate-100'}`}
            >
                <div>
                    <p className="text-sm font-medium text-slate-500">الخطوط المنتهية</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{expired}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl text-red-600">
                    <Activity className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
};
