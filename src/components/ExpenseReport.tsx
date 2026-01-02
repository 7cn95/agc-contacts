import React, { useState } from 'react';
import { useSIM } from '../context/SIMContext';
import { FileText, Download, Printer, Wallet, Plus, TrendingDown, TrendingUp, AlertCircle, X, Save } from 'lucide-react';

export const ExpenseReport: React.FC = () => {
    const { renewalHistory, walletDeposits, externalExpenses, addDeposit, addExternalExpense, simCards, role } = useSIM();

    // Modals State
    const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isEditBalanceOpen, setIsEditBalanceOpen] = useState(false);

    // Form States
    const [fundAmount, setFundAmount] = useState<number>(0);
    const [fundNote, setFundNote] = useState('');

    const [expenseAmount, setExpenseAmount] = useState<number>(0);
    const [expenseDesc, setExpenseDesc] = useState('');
    const [expensePhone, setExpensePhone] = useState('');

    const [targetBalance, setTargetBalance] = useState<number>(0);

    // Wallet Calculations
    const totalDeposits = walletDeposits.reduce((acc, curr) => acc + curr.amount, 0);
    const totalRenewalCost = renewalHistory.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const totalExternalCost = externalExpenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalSpentGlobal = totalRenewalCost + totalExternalCost;
    const currentBalance = totalDeposits - totalSpentGlobal;

    // Forecasting
    const monthlyBurn = simCards.reduce((acc, curr) => acc + (curr.billAmount || 0), 0);
    const weeklyBurn = Math.round(monthlyBurn / 4.33); // Average weeks in a month
    // Forecasting: Liability until end of month
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    endOfMonth.setHours(23, 59, 59, 999);

    const liabilityCards = simCards.filter(card => {
        if (!card.billAmount || !card.expirationDate) return false;

        const expDate = new Date(card.expirationDate);
        // Check if expiration is strictly within the remaining days of the month
        return expDate >= now && expDate <= endOfMonth;
    });

    const requiredUntilMonthEnd = liabilityCards.reduce((acc, curr) => acc + (curr.billAmount || 0), 0);
    const isDeficit = currentBalance < requiredUntilMonthEnd;
    const deficitAmount = requiredUntilMonthEnd - currentBalance;
    const surplusAmount = currentBalance - requiredUntilMonthEnd;

    // Actions
    const handleAddFunds = () => {
        if (fundAmount > 0) {
            addDeposit(fundAmount, fundNote);
            setFundAmount(0);
            setFundNote('');
            setIsAddFundsOpen(false);
        }
    };

    const handleAddExpense = () => {
        if (expenseAmount > 0 && expenseDesc) {
            addExternalExpense(expenseAmount, expenseDesc, expensePhone);
            setExpenseAmount(0);
            setExpenseDesc('');
            setExpensePhone('');
            setIsAddExpenseOpen(false);
        }
    };

    const handleSetBalance = () => {
        const diff = targetBalance - currentBalance;
        if (diff === 0) {
            setIsEditBalanceOpen(false);
            return;
        }

        if (diff > 0) {
            // Add Deposit
            addDeposit(diff, 'تعديل رصيد يدوي');
        } else {
            // Add External Expense (Withdrawal)
            addExternalExpense(Math.abs(diff), 'تعديل رصيد يدوي');
        }
        setIsEditBalanceOpen(false);
    };

    const openEditBalance = () => {
        setTargetBalance(currentBalance);
        setIsEditBalanceOpen(true);
    };

    // Date Filters
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(1);
        return date.toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        return date.toISOString().split('T')[0];
    });

    // Unified Data
    const allTransactions = [
        ...renewalHistory.map(r => ({
            id: r.id,
            type: 'renewal' as const,
            date: r.transactionDate,
            amount: r.amountPaid,
            title: `تجديد: ${r.employeeName}`,
            details: `تنتهي في: ${new Date(r.newExpiry).toLocaleDateString('ar-IQ')}`,
            isRenewal: true
        })),
        ...externalExpenses.map(e => ({
            id: e.id,
            type: 'expense' as const,
            date: e.date,
            amount: e.amount,
            title: e.description,
            details: e.relatedPhoneNumber ? `رقم: ${e.relatedPhoneNumber}` : '-',
            isRenewal: false
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Filter Logic
    const filteredTransactions = allTransactions.filter(record => {
        const recordDate = new Date(record.date).setHours(0, 0, 0, 0);
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        return recordDate >= start && recordDate <= end;
    });

    // Report Stats
    const totalFilteredAmount = filteredTransactions.reduce((sum, record) => sum + record.amount, 0);
    const totalFilteredCount = filteredTransactions.length;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Wallet Overview Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 no-print">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-indigo-600" />
                            المحفظة المالية
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">تتبع الميزانية وحالة التجديدات والمصاريف</p>
                    </div>
                    {role === 'admin' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAddExpenseOpen(true)}
                                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                                <TrendingDown className="w-4 h-4" />
                                <span>تسجيل مصروف</span>
                            </button>
                            <button
                                onClick={() => setIsAddFundsOpen(true)}
                                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>إضافة رصيد</span>
                            </button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Current Balance */}
                    <div
                        className={`p-5 rounded-xl border relative group ${role === 'admin' ? 'bg-indigo-50 border-indigo-100 cursor-pointer shadow-sm' : 'bg-slate-50 border-slate-100'}`}
                        onClick={() => role === 'admin' && openEditBalance()}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <p className={`text-xs font-bold uppercase tracking-wider ${role === 'admin' ? 'text-indigo-600' : 'text-slate-500'}`}>الرصيد الحالي</p>
                            <Wallet className={`w-4 h-4 ${role === 'admin' ? 'text-indigo-400' : 'text-slate-400'}`} />
                        </div>
                        <div className="flex items-center gap-2">
                            <p className={`text-2xl font-bold ${role === 'admin' ? 'text-indigo-900' : 'text-slate-900'}`} dir="ltr">{currentBalance.toLocaleString()} <span className="text-sm font-normal opacity-60">IQD</span></p>
                            {role === 'admin' && <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">تعديل</span>}
                        </div>
                        <div className="mt-2 text-xs text-indigo-600 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>المودع: {totalDeposits.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Monthly Burn */}
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">التكلفة الشهرية</p>
                            <TrendingDown className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="text-2xl font-bold text-slate-900" dir="ltr">{monthlyBurn.toLocaleString()} <span className="text-sm font-normal text-slate-500">IQD</span></p>
                        <p className="mt-2 text-xs text-slate-500">اشتراكات الخطوط</p>
                    </div>

                    {/* Weekly Forecast */}
                    <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">التكلفة الأسبوعية</p>
                            <TrendingDown className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-2xl font-bold text-blue-900" dir="ltr">{weeklyBurn.toLocaleString()} <span className="text-sm font-normal text-blue-500">IQD</span></p>
                        <p className="mt-2 text-xs text-blue-600">تقديري بناءً على الشهري</p>
                    </div>

                    {/* Coverage / End of Month Forecast */}
                    <div className={`p-5 rounded-xl border ${isDeficit ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="flex justify-between items-start mb-2">
                            <p className={`text-xs font-bold uppercase tracking-wider ${isDeficit ? 'text-red-600' : 'text-emerald-600'}`}>الوضع حتى نهاية الشهر</p>
                            <AlertCircle className={`w-4 h-4 ${isDeficit ? 'text-red-400' : 'text-emerald-400'}`} />
                        </div>
                        <p className={`text-2xl font-bold ${isDeficit ? 'text-red-900' : 'text-emerald-900'}`}>
                            {isDeficit ? 'عجز محتمل' : 'تغطية ممتازة'}
                        </p>
                        <p className={`mt-2 text-xs ${isDeficit ? 'text-red-600' : 'text-emerald-600'}`}>
                            {isDeficit
                                ? `تحتاج ${deficitAmount.toLocaleString()} د.ع لتغطية ${liabilityCards.length} خط`
                                : `فائض ${surplusAmount.toLocaleString()} د.ع بعد تجديد ${liabilityCards.length} خط`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Set Balance Modal */}
            {isEditBalanceOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <div className="text-right">
                                <h3 className="text-lg font-bold text-slate-900">تعديل الرصيد الحالي</h3>
                                <p className="text-sm text-slate-500">سيتم إضافة عملية تسوية (إيداع أو صرف) تلقائياً</p>
                            </div>
                            <button onClick={() => setIsEditBalanceOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">الرصيد الفعلي الموجود الآن (د.ع)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-xl font-bold text-center"
                                    placeholder="0"
                                    value={targetBalance}
                                    onChange={(e) => setTargetBalance(Number(e.target.value))}
                                    autoFocus
                                />
                            </div>

                            <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-600 flex justify-between">
                                <span>الرصيد المسجل بالنظام:</span>
                                <span className="font-bold">{currentBalance.toLocaleString()}</span>
                            </div>

                            <button
                                onClick={handleSetBalance}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex justify-center items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                اعتماد الرصيد الجديد
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Funds Modal */}
            {isAddFundsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">إضافة رصيد للمحفظة</h3>
                            <button onClick={() => setIsAddFundsOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ (د.ع)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="0"
                                    value={fundAmount}
                                    onChange={(e) => setFundAmount(Number(e.target.value))}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات (اختياري)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="مثلاً: تعزيز رصيد شهر 5"
                                    value={fundNote}
                                    onChange={(e) => setFundNote(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleAddFunds}
                                disabled={fundAmount <= 0}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                حفظ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Expense Modal */}
            {isAddExpenseOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h3 className="text-lg font-bold text-slate-900">تسجيل مصروف خارجي</h3>
                            <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">المبلغ (د.ع)</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    placeholder="0"
                                    value={expenseAmount}
                                    onChange={(e) => setExpenseAmount(Number(e.target.value))}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">الوصف</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    placeholder="سبب الصرف..."
                                    value={expenseDesc}
                                    onChange={(e) => setExpenseDesc(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">رقم الهاتف (اختياري)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-500 focus:outline-none"
                                    placeholder="07..."
                                    value={expensePhone}
                                    onChange={(e) => setExpensePhone(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleAddExpense}
                                disabled={expenseAmount <= 0 || !expenseDesc}
                                className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                <Save className="w-5 h-5" />
                                تسجيل المصروف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 no-print">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-indigo-600" />
                    سجل العمليات (تجديدات ومصاريف)
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        <span>طباعة</span>
                    </button>
                    <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        <span>Excel</span>
                    </button>
                </div>
            </div>

            {/* Filters & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 no-print">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <label className="block text-xs font-medium text-slate-500 mb-1">من تاريخ</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full text-sm font-semibold text-slate-800 focus:outline-none"
                    />
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <label className="block text-xs font-medium text-slate-500 mb-1">إلى تاريخ</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full text-sm font-semibold text-slate-800 focus:outline-none"
                    />
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-1">مجموع المصروفات</p>
                    <p className="text-lg font-bold text-slate-900">{totalFilteredAmount.toLocaleString()} د.ع</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-medium text-slate-600 mb-1">عدد العمليات</p>
                    <p className="text-lg font-bold text-slate-900">{totalFilteredCount} عملية</p>
                </div>
            </div>

            {/* Printable Report Header */}
            <div className="hidden print-block mb-8 text-center border-b pb-4">
                <h1 className="text-2xl font-bold mb-2">تقرير المصاريف</h1>
                <p className="text-slate-500">للفترة من {startDate} إلى {endDate}</p>
                <div className="flex justify-center gap-8 mt-4">
                    <p><strong>الإجمالي:</strong> {totalFilteredAmount.toLocaleString()} د.ع</p>
                    <p><strong>العدد:</strong> {totalFilteredCount}</p>
                </div>
            </div>

            {/* Unified Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">التاريخ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">نوع العملية</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">التفاصيل</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">ملاحظات / رقم هاتف</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">المبلغ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(record.date).toLocaleDateString('ar-IQ')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {record.isRenewal ? (
                                                <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                    <TrendingUp className="w-3 h-3" />
                                                    تجديد اشتراك
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                    <TrendingDown className="w-3 h-3" />
                                                    مصروف خارجي
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {record.title}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {record.details}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                                            {record.amount.toLocaleString()} د.ع
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                        لا توجد بيانات للفترة المحددة
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-block { display: block !important; }
                    body { background: white; }
                    .shadow-sm { box-shadow: none !important; }
                    .border { border: 1px solid #ddd !important; }
                }
            `}</style>
        </div>
    );
};
