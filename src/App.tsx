import { useState } from 'react';
import { SIMProvider, useSIM } from './context/SIMContext';
import { Layout } from './components/Layout';
import { GuestTable } from './components/GuestTable';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminTable } from './components/AdminTable';
import { ExpenseReport } from './components/ExpenseReport';

function AppContent() {
  const { role } = useSIM();

  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'expiring_soon'>('all');
  const [adminView, setAdminView] = useState<'dashboard' | 'reports'>('dashboard');

  return (
    <Layout>
      {role === 'admin' ? (
        <div className="space-y-6 animate-fade-in">
          {/* Admin Tabs */}
          <div className="flex gap-4 border-b border-slate-200 mb-6 sticky top-0 bg-slate-50 z-30 pt-2">
            <button
              onClick={() => setAdminView('dashboard')}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative ${adminView === 'dashboard' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              لوحة التحكم
              {adminView === 'dashboard' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
            </button>
            <button
              onClick={() => setAdminView('reports')}
              className={`pb-3 px-1 font-medium text-sm transition-colors relative ${adminView === 'reports' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              التقارير المالية
              {adminView === 'reports' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full" />}
            </button>
          </div>

          {adminView === 'dashboard' ? (
            <div className="space-y-8 animate-fade-in">
              <AdminDashboard onFilterSelect={setFilterStatus} activeFilter={filterStatus} />
              <AdminTable filterStatus={filterStatus} />
            </div>
          ) : (
            <ExpenseReport />
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="mb-6 text-center sm:text-right">
            <h2 className="text-2xl font-bold text-slate-900">دليل أرقام الموظفين</h2>
            <p className="text-slate-500 mt-2">ابحث عن اسم الموظف أو وظيفته للحصول على رقم الاتصال</p>
          </div>
          <GuestTable />
        </div>
      )}
    </Layout>
  );
}

function App() {
  return (
    <SIMProvider>
      <AppContent />
    </SIMProvider>
  );
}

export default App;
