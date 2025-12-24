import React, { createContext, useContext, useEffect, useState } from 'react';
import type { SIMCard, SIMContextType, UserRole, RenewalRecord, WalletDeposit, ExternalExpense } from '../types';
import { supabase } from '../lib/supabase';

const SIMContext = createContext<SIMContextType | undefined>(undefined);

export const SIMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [simCards, setSimCards] = useState<SIMCard[]>([]);
    const [renewalHistory, setRenewalHistory] = useState<RenewalRecord[]>([]);
    const [walletDeposits, setWalletDeposits] = useState<WalletDeposit[]>([]);
    const [externalExpenses, setExternalExpenses] = useState<ExternalExpense[]>([]);
    const [role, setRole] = useState<UserRole>(() => {
        return (localStorage.getItem('user_role') as UserRole) || 'guest';
    });

    useEffect(() => {
        localStorage.setItem('user_role', role);
    }, [role]);


    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [simRes, renewRes, walletRes, expenseRes] = await Promise.all([
                    supabase.from('sim_cards').select('*'),
                    supabase.from('renewal_history').select('*'),
                    supabase.from('wallet_deposits').select('*'),
                    supabase.from('external_expenses').select('*')
                ]);

                if (simRes.data) {
                    const mappedCards: SIMCard[] = simRes.data.map((d: any) => ({
                        id: d.id,
                        employeeName: d.employeeName,
                        phoneNumber: d.phoneNumber,
                        jobTitle: d.position,           // Map DB 'position' -> Local 'jobTitle'
                        workLocation: d.department,     // Map DB 'department' -> Local 'workLocation'
                        billAmount: d.billAmount,
                        status: d.status,
                        expirationDate: d.expirationDate,
                        renewalFlag: false,             // Default
                        creditBalance: d.creditBalance || 0
                    }));
                    setSimCards(mappedCards);
                }
                if (renewRes.data) setRenewalHistory(renewRes.data);
                if (walletRes.data) setWalletDeposits(walletRes.data);
                if (expenseRes.data) setExternalExpenses(expenseRes.data);

            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    const addDeposit = async (amount: number, note?: string) => {
        const deposit = {
            amount,
            date: new Date().toISOString(),
            note
        };

        const { data, error } = await supabase.from('wallet_deposits').insert([deposit]).select().single();
        if (error) {
            console.error('Error adding deposit:', error);
            alert('Error adding fund: ' + error.message);
            return;
        }
        if (data) setWalletDeposits(prev => [data, ...prev]);
    };

    const addExternalExpense = async (amount: number, description: string, phoneNumber?: string) => {
        const expense = {
            amount,
            date: new Date().toISOString(),
            description,
            relatedPhoneNumber: phoneNumber
        };

        const { data, error } = await supabase.from('external_expenses').insert([expense]).select().single();
        if (error) {
            console.error('Error adding expense:', error);
            return;
        }
        if (data) setExternalExpenses(prev => [data, ...prev]);
    };

    const addSIMCard = async (card: Omit<SIMCard, 'id'>) => {
        const { data, error } = await supabase.from('sim_cards').insert([card]).select().single();
        if (error) {
            console.error('Error adding SIM card:', error);
            return;
        }
        if (data) setSimCards(prev => [...prev, data]);
    };

    const updateSIMCard = async (id: string, updates: Partial<SIMCard>) => {
        // Optimistic update for UI responsiveness
        setSimCards(prev => prev.map(card => card.id === id ? { ...card, ...updates } : card));

        // Auto-update status logic if needed (handled in backend or just update object)
        const finalUpdates = { ...updates };
        if (updates.expirationDate) {
            const isExpired = new Date(updates.expirationDate) < new Date();
            finalUpdates.status = isExpired ? 'Expired' : 'Active';
        }

        const { error } = await supabase.from('sim_cards').update(finalUpdates).eq('id', id);
        if (error) {
            console.error('Error updating SIM card:', error);
            // Revert would go here, but focusing on simple happy path
        }
    };

    const deleteSIMCard = async (id: string) => {
        setSimCards(prev => prev.filter(card => card.id !== id));
        const { error } = await supabase.from('sim_cards').delete().eq('id', id);
        if (error) console.error('Error deleting SIM card:', error);
    };

    const renewSIMCard = async (id: string, paymentAmount: number) => {
        const card = simCards.find(c => c.id === id);
        if (!card) return;

        const billAmount = card.billAmount || 0;
        let totalFunds = paymentAmount + (card.creditBalance || 0);

        if (totalFunds < billAmount) {
            alert(`رصيد غير كافي. المطلوب: ${billAmount}، المتوفر: ${totalFunds}`);
            return;
        }

        // Logic: Renew for 1 MONTH ONLY per action (to avoid burning all credit)
        // User can click again if they want more, or we can add "Months" selector later.

        const now = new Date();
        let currentExp = new Date(card.expirationDate || now);
        // If expired, start count from TODAY
        if (currentExp < now) currentExp = now;

        // Add 30 Days
        currentExp.setDate(currentExp.getDate() + 30);
        const newExpiry = currentExp.toISOString();

        // Calculate remaining credit
        const remainingCredit = totalFunds - billAmount;
        const transactionDate = new Date().toISOString();

        // 1. Create Renewal Record using Supabase
        const { error: historyError, data: historyData } = await supabase.from('renewal_history').insert([{
            simCardId: card.id,
            employeeName: card.employeeName,
            amountPaid: billAmount, // We record the COST of the renewal, not necessarily the paymentAmount (which might be 0 if using credit)
            transactionDate,
            renewalDate: transactionDate,
            newExpiry,
        }]).select().single();

        if (historyError) {
            console.error('Error logging renewal:', historyError);
            alert('Error renewing: ' + historyError.message);
            return;
        }

        if (historyData) {
            const localRecord: RenewalRecord = {
                id: historyData.id,
                simCardId: historyData.simCardId,
                employeeName: historyData.employeeName,
                amountPaid: historyData.amountPaid,
                transactionDate: historyData.transactionDate,
                newExpiry: historyData.newExpiry,
                previousExpiry: card.expirationDate || new Date().toISOString(),
                billAmount: billAmount
            };
            setRenewalHistory(prev => [localRecord, ...prev]);
        }

        // 2. Update SIM Card (Status, Expiry, AND Credit Balance)
        const simUpdates: Partial<SIMCard> = {
            expirationDate: newExpiry,
            status: 'Active',
            creditBalance: remainingCredit // PERSIST NEW BALANCE
        };

        await updateSIMCard(id, simUpdates);
    };

    const importSIMCards = async (newCards: SIMCard[]): Promise<boolean> => {
        // Map SIMCard type to DB Schema
        // DB Columns: phoneNumber, employeeName, position, department, billAmount, expirationDate, status, company (optional)

        const cardsToInsert = newCards.map(card => ({
            phoneNumber: card.phoneNumber,
            employeeName: card.employeeName,
            position: card.jobTitle,      // Mapping jobTitle -> position
            department: card.workLocation,// Mapping workLocation -> department
            billAmount: card.billAmount,
            expirationDate: card.expirationDate,
            status: card.status,
            creditBalance: card.creditBalance,
            // serialNumber, provider, planType, company are optional/missing in CSV context
            // renewalFlag are NOT in DB, so we exclude them
        }));

        const { data, error } = await supabase.from('sim_cards').insert(cardsToInsert).select();

        if (error) {
            console.error('Error importing cards:', error);
            // alert('Error importing: ' + error.message); // Caller should handle UI
            return false;
        }

        if (data) {
            // We need to map back from DB result (if keys differ) to local State
            // But since local state uses local types, and data returns DB cols...
            // better to construct local objects properly or fetch fresh.
            // For now, let's map DB result back to SIMCard
            const importedCards: SIMCard[] = data.map(d => ({
                id: d.id,
                employeeName: d.employeeName,
                phoneNumber: d.phoneNumber,
                jobTitle: d.position,           // Map back
                workLocation: d.department,     // Map back
                billAmount: d.billAmount,
                status: d.status,
                expirationDate: d.expirationDate,
                renewalFlag: false,             // Default
                creditBalance: d.creditBalance  // Map back
            }));

            setSimCards(prev => [...prev, ...importedCards]);
            return true;
        }
        return false;
    };

    return (
        <SIMContext.Provider
            value={{
                simCards,
                renewalHistory,
                walletDeposits,
                externalExpenses,
                role,
                addSIMCard,
                updateSIMCard,
                deleteSIMCard,
                renewSIMCard,
                addDeposit,
                addExternalExpense,
                importSIMCards,
                setRole,
            }}
        >
            {children}
        </SIMContext.Provider>
    );
};

export const useSIM = () => {
    const context = useContext(SIMContext);
    if (!context) {
        throw new Error('useSIM must be used within a SIMProvider');
    }
    return context;
};
