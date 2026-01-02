import React, { useState } from 'react';
import { useSIM } from '../context/SIMContext';
import { Edit2, Trash2, RefreshCw, Plus, Save, X, Upload } from 'lucide-react';
import type { SIMCard } from '../types';

interface AdminTableProps {
    filterStatus: 'all' | 'active' | 'expired' | 'expiring_soon' | 'expired_today';
}

export const AdminTable: React.FC<AdminTableProps> = ({ filterStatus }) => {
    const { simCards, deleteSIMCard, renewSIMCard, updateSIMCard, addSIMCard, importSIMCards, role } = useSIM();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<SIMCard>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newCardData, setNewCardData] = useState<Partial<SIMCard>>({
        status: 'Active',
        renewalFlag: false,
        billAmount: 0
    });
    const [renewModalOpen, setRenewModalOpen] = useState(false);
    const [selectedCardForRenew, setSelectedCardForRenew] = useState<SIMCard | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [renewError, setRenewError] = useState<string>('');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const getDynamicStatus = (card: SIMCard) => {
        if (!card.expirationDate) return card.status;
        const cardDateStr = card.expirationDate.split('T')[0];
        const cardDate = new Date(card.expirationDate);

        if (cardDateStr === todayStr) return 'Expired Today';
        if (cardDate < now) return 'Expired';
        return 'Active';
    };

    const filteredCards = simCards
        .filter((card) => {
            const currentStatus = getDynamicStatus(card);

            // Status Filter
            const matchesFilter = () => {
                if (filterStatus === 'all') return true;
                if (filterStatus === 'active') return currentStatus === 'Active' || currentStatus === 'Expired Today';
                if (filterStatus === 'expired') return currentStatus === 'Expired';
                if (filterStatus === 'expired_today') return currentStatus === 'Expired Today';
                if (filterStatus === 'expiring_soon') {
                    if (!card.expirationDate) return false;
                    const days = (new Date(card.expirationDate).getTime() - now.getTime()) / (1000 * 3600 * 24);
                    return days <= 3 && days > 0;
                }
                return true;
            };

            // Search Filter
            const dateStr = card.expirationDate ? new Date(card.expirationDate).toLocaleDateString('ar-IQ') : '';
            const matchesSearch =
                card.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                card.phoneNumber.includes(searchTerm) ||
                dateStr.includes(searchTerm);

            return matchesFilter() && matchesSearch;
        })
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName, 'ar'));

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            if (!text) return;

            const lines = text.split('\n');
            if (lines.length < 2) return;

            const headers = lines[0].split(',').map(h => h.trim());
            const mapIdx = {
                name: headers.indexOf('اسم الموظف'),
                phone: headers.indexOf('رقم الهاتف'),
                job: headers.indexOf('العنوان الوظيفي'),
                location: headers.indexOf('موقع العمل'),
                bill: headers.indexOf('مبلغ الباقة'),
                expiry: headers.indexOf('تاريخ الانتهاء'),
                credit: headers.indexOf('المبلغ المقدم')
            };

            const newCards: SIMCard[] = [];
            lines.slice(1).forEach((line) => {
                const cols = line.split(',');
                if (cols.length < 2) return;

                const getVal = (idx: number) => idx !== -1 ? cols[idx]?.trim() : '';

                let expDateVal = getVal(mapIdx.expiry);
                let finalExpDate = new Date(Date.now() + 86400000 * 30).toISOString();

                if (expDateVal) {
                    const parsedDate = new Date(expDateVal);
                    if (!isNaN(parsedDate.getTime())) {
                        finalExpDate = parsedDate.toISOString();
                    }
                }

                const isExpired = new Date(finalExpDate) < now;

                const card: SIMCard = {
                    id: crypto.randomUUID(),
                    employeeName: getVal(mapIdx.name) || 'Unknown',
                    phoneNumber: getVal(mapIdx.phone) || '',
                    jobTitle: getVal(mapIdx.job) || '',
                    workLocation: getVal(mapIdx.location) || '',
                    billAmount: Number(getVal(mapIdx.bill)) || 0,
                    status: isExpired ? 'Expired' : 'Active',
                    renewalFlag: false,
                    expirationDate: finalExpDate,
                    creditBalance: Number(getVal(mapIdx.credit)) || 0
                };

                if (card.phoneNumber) newCards.push(card);
            });

            if (newCards.length > 0) {
                const success = await importSIMCards(newCards);
                if (success) {
                    alert(`Successfully imported ${newCards.length} lines`);
                    if (event.target) event.target.value = '';
                } else {
                    alert('Failed to import lines. Check console for details.');
                }
            } else {
                alert('No valid lines found or header mismatch.');
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleEditClick = (card: SIMCard) => {
        setEditingId(card.id);
        setEditFormData(card);
    };

    const handleSave = (id: string) => {
        updateSIMCard(id, editFormData);
        setEditingId(null);
    };

    const handleAddNew = () => {
        if (newCardData.employeeName && newCardData.phoneNumber) {
            addSIMCard(newCardData as Omit<SIMCard, 'id'>);
            setIsAdding(false);
            setNewCardData({ status: 'Active', renewalFlag: false, billAmount: 0 });
        }
    };

    const openRenewModal = (card: SIMCard) => {
        setSelectedCardForRenew(card);
        setPaymentAmount(0);
        setRenewError('');
        setRenewModalOpen(true);
    };

    const handleConfirmRenew = () => {
        if (!selectedCardForRenew) return;
        const bill = selectedCardForRenew.billAmount || 0;
        const credit = selectedCardForRenew.creditBalance || 0;
        const total = paymentAmount + credit;

        if (total < bill) {
            setRenewError(`المبلغ غير كافي. المطلوب: ${bill}، المتوفر: ${total} (رصيد: ${credit})`);
            return;
        }

        renewSIMCard(selectedCardForRenew.id, paymentAmount);
        setRenewModalOpen(false);
        setSelectedCardForRenew(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-800 whitespace-nowrap">إدارة الخطوط</h2>
                </div>

                <div className="flex-1 w-full lg:max-w-sm relative order-2 lg:order-none">
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو الرقم..."
                        className="w-full pl-4 pr-10 py-3 lg:py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {role === 'admin' && (
                    <div className="flex flex-wrap items-center gap-2 lg:gap-3 order-3 lg:order-none">
                        <button
                            onClick={() => {
                                const headers = ['اسم الموظف,رقم الهاتف,العنوان الوظيفي,موقع العمل,مبلغ الباقة,تاريخ الانتهاء,الرصيد المقدم,الحالة'];
                                const rows = simCards.map(c => [
                                    c.employeeName,
                                    c.phoneNumber,
                                    c.jobTitle || '',
                                    c.workLocation || '',
                                    c.billAmount || 0,
                                    c.expirationDate ? new Date(c.expirationDate).toLocaleDateString('en-CA') : '',
                                    c.creditBalance || 0,
                                    c.status
                                ].join(','));
                                const csvContent = '\uFEFF' + [headers, ...rows].join('\n');
                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', 'sim_cards_export.csv');
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
                        >
                            <Upload className="w-4 h-4 rotate-180" />
                            <span>تصدير CSV</span>
                        </button>

                        <div className="flex-1 lg:flex-none relative">
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
                                <Upload className="w-4 h-4" />
                                <span>استيراد CSV</span>
                            </button>
                        </div>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full lg:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl transition-colors shadow-sm text-sm font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            <span>إضافة خط جديد</span>
                        </button>
                    </div>
                )}
            </div>

            {renewModalOpen && selectedCardForRenew && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-4">تجديد الاشتراك</h3>
                            <div className="bg-slate-50 p-4 rounded-xl mb-6 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">اسم الموظف:</span>
                                    <span className="font-semibold text-slate-900">{selectedCardForRenew.employeeName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">مبلغ الباقة:</span>
                                    <span className="font-semibold text-slate-900">{selectedCardForRenew.billAmount?.toLocaleString()} د.ع</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">الرصيد المدور:</span>
                                    <span className="font-semibold text-emerald-600">{selectedCardForRenew.creditBalance || 0} د.ع</span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">مبلغ التسديد</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="أدخل المبلغ..."
                                    value={paymentAmount}
                                    onChange={(e) => {
                                        setPaymentAmount(Number(e.target.value));
                                        setRenewError('');
                                    }}
                                    autoFocus
                                />
                                {renewError && <p className="text-red-600 text-sm mt-2">{renewError}</p>}
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={handleConfirmRenew} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700">تأكيد التجديد</button>
                                <button onClick={() => setRenewModalOpen(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200">إلغاء</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">الاسم</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">الرقم</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">الفاتورة</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">تاريخ الانتهاء</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">الحالة</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isAdding && (
                                <tr className="bg-indigo-50">
                                    <td className="px-6 py-4"><input className="w-full p-1 border rounded" placeholder="الاسم" onChange={e => setNewCardData({ ...newCardData, employeeName: e.target.value })} /></td>
                                    <td className="px-6 py-4"><input className="w-full p-1 border rounded" placeholder="الرقم" onChange={e => setNewCardData({ ...newCardData, phoneNumber: e.target.value })} /></td>
                                    <td className="px-6 py-4"><input type="number" className="w-full p-1 border rounded" placeholder="0" onChange={e => setNewCardData({ ...newCardData, billAmount: Number(e.target.value) })} /></td>
                                    <td className="px-6 py-4"><input type="date" className="w-full p-1 border rounded" onChange={e => setNewCardData({ ...newCardData, expirationDate: new Date(e.target.value).toISOString() })} /></td>
                                    <td className="px-6 py-4 text-center">-</td>
                                    <td className="px-6 py-4 text-center flex gap-2 justify-center">
                                        <button onClick={handleAddNew} className="text-green-600"><Save className="w-5 h-5" /></button>
                                        <button onClick={() => setIsAdding(false)} className="text-red-500"><X className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            )}
                            {filteredCards.map((card) => {
                                const isEditing = editingId === card.id;
                                const currentStatus = getDynamicStatus(card);
                                const isExpired = currentStatus === 'Expired';
                                const isExpiredToday = currentStatus === 'Expired Today';
                                const hasCredit = (card.creditBalance || 0) > 0;

                                return (
                                    <tr key={card.id} className={`hover:bg-slate-50 transition-colors ${card.renewalFlag ? 'bg-green-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            {isEditing ? (
                                                <input
                                                    className="w-full p-1 border rounded"
                                                    value={editFormData.employeeName || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, employeeName: e.target.value })}
                                                />
                                            ) : card.employeeName}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {isEditing ? (
                                                <input
                                                    className="w-full p-1 border rounded"
                                                    value={editFormData.phoneNumber || ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, phoneNumber: e.target.value })}
                                                />
                                            ) : card.phoneNumber}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    className="w-full p-1 border rounded"
                                                    value={editFormData.billAmount || 0}
                                                    onChange={(e) => setEditFormData({ ...editFormData, billAmount: Number(e.target.value) })}
                                                />
                                            ) : (
                                                <div>
                                                    <div>{card.billAmount?.toLocaleString()} د.ع</div>
                                                    {hasCredit && <div className="text-xs text-emerald-600 font-bold">+{card.creditBalance} د.ع رصيد</div>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {isEditing ? (
                                                <input
                                                    type="date"
                                                    className="w-full p-1 border rounded"
                                                    value={editFormData.expirationDate ? editFormData.expirationDate.split('T')[0] : ''}
                                                    onChange={(e) => setEditFormData({ ...editFormData, expirationDate: new Date(e.target.value).toISOString() })}
                                                />
                                            ) : (card.expirationDate ? new Date(card.expirationDate).toLocaleDateString('ar-IQ') : '-')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${isExpired ? 'bg-red-100 text-red-800' :
                                                    isExpiredToday ? 'bg-amber-100 text-amber-800 ring-2 ring-red-400' :
                                                        'bg-green-100 text-green-800'
                                                }`}>
                                                {isExpired ? 'منتهي' : isExpiredToday ? 'منتهي اليوم' : 'فعال'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {role === 'admin' ? (
                                                <div className="flex justify-center gap-3">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => handleSave(card.id)} className="text-green-600"><Save className="w-5 h-5" /></button>
                                                            <button onClick={() => setEditingId(null)} className="text-slate-400"><X className="w-5 h-5" /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => openRenewModal(card)} className="text-indigo-600" title="تجديد"><RefreshCw className="w-5 h-5" /></button>
                                                            <button onClick={() => handleEditClick(card)} className="text-slate-400"><Edit2 className="w-5 h-5" /></button>
                                                            <button onClick={() => deleteSIMCard(card.id)} className="text-red-400"><Trash2 className="w-5 h-5" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
