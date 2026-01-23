import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from './firebase-config';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';

const LayawayContext = createContext();

export const useLayaway = () => useContext(LayawayContext);

export const LayawayProvider = ({ children }) => {
    const [layaways, setLayaways] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create new layaway plan
    const createLayaway = async (data) => {
        try {
            const layawayRef = await addDoc(collection(db, "layaways"), {
                ...data,
                totalAmount: data.totalAmount,
                paidAmount: 0,
                remainingAmount: data.totalAmount,
                payments: [],
                status: 'active', // active, completed, cancelled
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });
            return { success: true, id: layawayRef.id };
        } catch (error) {
            console.error("Error creating layaway:", error);
            return { success: false, error: error.message };
        }
    };

    // Make payment on layaway
    const makePayment = async (layawayId, amount, paymentRef) => {
        try {
            const layawayRef = doc(db, "layaways", layawayId);
            const layaway = layaways.find(l => l.id === layawayId);

            if (!layaway) throw new Error("Layaway not found");

            const newPaidAmount = layaway.paidAmount + amount;
            const newRemainingAmount = layaway.totalAmount - newPaidAmount;
            const isCompleted = newRemainingAmount <= 0;

            const newPayment = {
                amount,
                paymentRef,
                date: new Date().toISOString()
            };

            await updateDoc(layawayRef, {
                paidAmount: newPaidAmount,
                remainingAmount: Math.max(0, newRemainingAmount),
                payments: [...layaway.payments, newPayment],
                status: isCompleted ? 'completed' : 'active',
                updatedAt: new Date().toISOString()
            });

            // Update local state
            setLayaways(prev => prev.map(l =>
                l.id === layawayId
                    ? {
                        ...l,
                        paidAmount: newPaidAmount,
                        remainingAmount: Math.max(0, newRemainingAmount),
                        payments: [...l.payments, newPayment],
                        status: isCompleted ? 'completed' : 'active'
                    }
                    : l
            ));

            return { success: true, completed: isCompleted };
        } catch (error) {
            console.error("Error making payment:", error);
            return { success: false, error: error.message };
        }
    };

    // Fetch layaways by phone or email
    const fetchLayaways = async (identifier) => {
        setLoading(true);
        try {
            // Try phone first, then email
            let q = query(
                collection(db, "layaways"),
                where("customer.phone", "==", identifier)
            );
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                q = query(
                    collection(db, "layaways"),
                    where("customer.email", "==", identifier)
                );
                querySnapshot = await getDocs(q);
            }

            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });

            // Sort by date
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setLayaways(items);
            return items;
        } catch (error) {
            console.error("Error fetching layaways:", error);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Get progress percentage
    const getProgress = (layaway) => {
        if (!layaway || layaway.totalAmount === 0) return 0;
        return Math.round((layaway.paidAmount / layaway.totalAmount) * 100);
    };

    return (
        <LayawayContext.Provider value={{
            layaways,
            loading,
            createLayaway,
            makePayment,
            fetchLayaways,
            getProgress
        }}>
            {children}
        </LayawayContext.Provider>
    );
};
