import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService } from './services/api';

const LayawayContext = createContext();

export const useLayaway = () => useContext(LayawayContext);

export const LayawayProvider = ({ children }) => {
    const [layaways, setLayaways] = useState([]);
    const [loading, setLoading] = useState(false);

    // Create new layaway plan
    const createLayaway = async (data) => {
        try {
            const response = await ApiService.createLayaway(data);
            return { success: true, id: response.data.id };
        } catch (error) {
            console.error("Error creating layaway:", error);
            return { success: false, error: error.message };
        }
    };

    // Make payment on layaway
    const makePayment = async (layawayId, amount, paymentRef) => {
        try {
            const response = await ApiService.recordPayment(layawayId, { amount, paymentRef });
            const { completed } = response.data;

            // Update local state by re-fetching
            // In a real app we might just update locally, but re-fetching ensures sync
            const currentLayaway = layaways.find(l => l.id === layawayId);
            if (currentLayaway) {
                // Update specific item in state optimistically or partially
                const newPaid = currentLayaway.paidAmount + amount;
                const newRem = currentLayaway.totalAmount - newPaid;

                setLayaways(prev => prev.map(l =>
                    l.id === layawayId
                        ? { ...l, paidAmount: newPaid, remainingAmount: newRem, status: completed ? 'completed' : 'active' } // rudimentary update
                        : l
                ));
            }

            return { success: true, completed };
        } catch (error) {
            console.error("Error making payment:", error);
            return { success: false, error: error.message };
        }
    };

    // Fetch layaways by phone or email
    const fetchLayaways = async (identifier) => {
        setLoading(true);
        try {
            // Determine if phone or email
            const isEmail = identifier.includes('@');
            const response = await ApiService.getLayaways(
                isEmail ? null : identifier,
                isEmail ? identifier : null
            );

            setLayaways(response.data);
            return response.data;
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
