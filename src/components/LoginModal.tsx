import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { useSIM } from '../context/SIMContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const { setRole } = useSIM();

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === '0099') {
            setRole('admin');
            onClose();
            setPin('');
            setError(false);
        } else if (pin === '1234') { // Updated Viewer PIN
            setRole('viewer');
            onClose();
            setPin('');
            setError(false);
        } else {
            setError(true);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Lock className="w-5 h-5 text-indigo-600" />
                            تسجيل دخول المسؤول
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                رمز الدخول (PIN)
                            </label>
                            <input
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value);
                                    setError(false);
                                }}
                                className={`w-full px-4 py-3 text-center text-2xl tracking-widest rounded-xl border focus:ring-2 focus:outline-none transition-all
                  ${error
                                        ? 'border-red-300 focus:ring-red-200 bg-red-50 text-red-900'
                                        : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-500 bg-slate-50'
                                    }`}
                                placeholder="••••"
                                autoFocus
                            />
                            {error && (
                                <p className="mt-2 text-sm text-red-600 text-center animate-pulse">
                                    الرمز غير صحيح، حاول مرة أخرى
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors shadow-sm active:transform active:scale-95"
                        >
                            دخول
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
