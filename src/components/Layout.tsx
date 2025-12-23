import React, { useState } from 'react';
import { useSIM } from '../context/SIMContext';
import { LoginModal } from './LoginModal';
import { Smartphone, LogOut, Shield } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { role, setRole } = useSIM();
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    return (
        <div dir="rtl" className="min-h-screen bg-slate-50 flex flex-col font-cairo">
            {/* Navbar */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                            <Smartphone className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-900 leading-tight">
                                خطوط AGC
                            </h1>
                            <p className="text-xs text-slate-500 font-medium">
                                {role === 'admin' ? 'لوحة تحكم المسؤول' : 'بوابة الموظفين'}
                            </p>
                        </div>
                    </div>

                    <div>
                        {role === 'guest' ? (
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                                <Shield className="w-4 h-4" />
                                <span className="hidden sm:inline">دخول مسؤول</span>
                            </button>
                        ) : (
                            <button
                                onClick={() => setRole('guest')}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">خروج</span>
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Login Modal */}
            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">
                {children}
            </main>

            {/* Footer */}
            <footer className="py-6 border-t border-slate-200 bg-white/80 backdrop-blur-sm mt-auto">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-400 text-xs sm:text-sm font-medium">
                        تصميم و تطوير حسين عبدالكريم مسؤول قسم IT
                    </p>
                </div>
            </footer>
        </div>
    );
};
