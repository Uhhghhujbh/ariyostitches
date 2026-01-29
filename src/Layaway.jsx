import React, { useState } from 'react';
import { useLayaway } from './LayawayContext';
import { FlutterWaveButton, closePaymentModal } from 'flutterwave-react-v3';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard, Search, Plus, CheckCircle,
    Clock, ArrowRight, Printer
} from 'lucide-react';

export default function Layaway() {
    const { layaways, loading, createLayaway, makePayment, fetchLayaways, getProgress } = useLayaway();
    const navigate = useNavigate();

    const [view, setView] = useState('search');
    const [searchPhone, setSearchPhone] = useState('');
    const [searched, setSearched] = useState(false);

    // Create layaway state
    const [serviceName, setServiceName] = useState('');
    const [serviceDesc, setServiceDesc] = useState('');
    const [totalAmount, setTotalAmount] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

    // Payment state
    const [selectedLayaway, setSelectedLayaway] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [errors, setErrors] = useState({});

    const MIN_PAYMENT = 500;

    const handleSearch = async () => {
        if (!searchPhone.trim()) return;
        await fetchLayaways(searchPhone);
        setSearched(true);
        if (layaways.length > 0) setView('list');
    };

    const handleCreateLayaway = async () => {
        const newErrors = {};
        if (!serviceName.trim()) newErrors.serviceName = 'Required';
        if (!totalAmount || Number(totalAmount) < 1000) newErrors.totalAmount = 'Min ₦1,000';
        if (!customerName.trim()) newErrors.customerName = 'Required';
        if (!customerPhone.trim()) newErrors.customerPhone = 'Required';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        const result = await createLayaway({
            service: { name: serviceName, description: serviceDesc },
            totalAmount: Number(totalAmount),
            customer: { name: customerName, email: customerEmail, phone: customerPhone }
        });

        if (result.success) {
            alert('Layaway created! Start making payments.');
            setView('search');
            setSearchPhone(customerPhone);
            handleSearch();
        }
    };

    const paymentConfig = {
        public_key: import.meta.env.VITE_FLW_PUBLIC_KEY,
        tx_ref: `LAYAWAY-${Date.now()}`,
        amount: Number(paymentAmount) || MIN_PAYMENT,
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        customer: selectedLayaway ? {
            email: selectedLayaway.customer.email || 'customer@ariyofashion.com',
            phone_number: selectedLayaway.customer.phone,
            name: selectedLayaway.customer.name
        } : {},
        customizations: {
            title: 'Ariyo Fashion - Pay Small-Small',
            description: `Payment for: ${selectedLayaway?.service?.name || 'Service'}`,
            logo: '/ariyologo.png',
        },
    };

    const handlePaymentSuccess = async (response) => {
        const result = await makePayment(selectedLayaway.id, Number(paymentAmount), response.transaction_id);
        closePaymentModal();

        if (result.success) {
            if (result.completed) {
                alert('🎉 Payment completed! Print your receipt.');
                navigate(`/layaway/print/${selectedLayaway.id}`);
            } else {
                alert('Payment recorded!');
                setView('list');
                fetchLayaways(searchPhone);
            }
        }
        setSelectedLayaway(null);
        setPaymentAmount('');
    };

    return (
        <div className="min-h-screen bg-ivory dark:bg-onyx-950 pt-24 pb-20 transition-colors duration-300">
            {/* Header */}
            <header className="text-center py-12 px-6">
                <p className="font-script text-gold-600 dark:text-gold-400 text-2xl mb-4">Flexible Payments</p>
                <h1 className="font-display text-4xl md:text-5xl font-light text-onyx-900 dark:text-white mb-4 tracking-wide">
                    PAY SMALL-SMALL
                </h1>
                <div className="divider-gold mb-8" />
                <p className="font-display text-lg text-gray-600 dark:text-gray-400 font-light italic max-w-2xl mx-auto">
                    Pay for your garments in comfortable installments
                </p>
            </header>

            <div className="max-w-2xl mx-auto px-6">
                {/* SEARCH VIEW */}
                {view === 'search' && (
                    <div className="elegant-frame animate-fade-up bg-white dark:bg-onyx-900 border border-onyx-900/10 dark:border-white/10">
                        <h2 className="font-display text-xl text-onyx-900 dark:text-white mb-8 text-center tracking-wide">
                            CHECK YOUR STATUS
                        </h2>

                        <div className="flex gap-4 mb-8">
                            <input
                                type="text"
                                placeholder="ENTER PHONE NUMBER"
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                                className="flex-1 text-center bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 outline-none"
                            />
                            <button onClick={handleSearch} className="btn-filled px-8">
                                <Search size={18} />
                            </button>
                        </div>

                        {searched && layaways.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-600 dark:text-gray-500 mb-4">No layaway found for this number</p>
                            </div>
                        )}

                        <div className="border-t border-onyx-900/10 dark:border-white/10 pt-8 mt-8 text-center">
                            <p className="text-gray-500 text-sm mb-6">Need to start a new layaway?</p>
                            <button onClick={() => setView('create')} className="btn-elegant w-full">
                                <Plus size={16} className="mr-2" /> Create New Layaway
                            </button>
                        </div>
                    </div>
                )}

                {/* LIST VIEW */}
                {view === 'list' && (
                    <div className="animate-fade-up">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-display text-xl text-onyx-900 dark:text-white tracking-wide">YOUR LAYAWAYS</h2>
                            <button onClick={() => setView('search')} className="text-gold-600 dark:text-gold-400 text-sm">
                                ← Back
                            </button>
                        </div>

                        <div className="space-y-8">
                            {layaways.map((layaway) => {
                                const progress = getProgress(layaway);
                                const isCompleted = layaway.status === 'completed';

                                return (
                                    <div key={layaway.id} className="border border-onyx-900/10 dark:border-white/10 p-8 bg-white dark:bg-onyx-900">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="font-display text-xl text-onyx-900 dark:text-white">
                                                    {layaway.service?.name}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-500 text-sm">{layaway.service?.description}</p>
                                            </div>
                                            <span className={`text-xs tracking-widest uppercase ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gold-600 dark:text-gold-400'
                                                }`}>
                                                {isCompleted ? '✓ Complete' : 'Active'}
                                            </span>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-6">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-gray-500">Progress</span>
                                                <span className="text-gold-400">{progress}%</span>
                                            </div>
                                            <div className="progress-elegant">
                                                <div className="progress-elegant-fill" style={{ width: `${progress}%` }} />
                                            </div>
                                        </div>

                                        {/* Amounts */}
                                        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-500 text-xs uppercase tracking-wider">Total</p>
                                                <p className="font-display text-lg text-onyx-900 dark:text-white">
                                                    ₦{layaway.totalAmount.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 text-xs uppercase tracking-wider">Paid</p>
                                                <p className="font-display text-lg text-green-400">
                                                    ₦{layaway.paidAmount.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-600 dark:text-gray-500 text-xs uppercase tracking-wider">Balance</p>
                                                <p className="font-display text-lg text-gold-600 dark:text-gold-400">
                                                    ₦{layaway.remainingAmount.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>

                                        {isCompleted ? (
                                            <button
                                                onClick={() => navigate(`/layaway/print/${layaway.id}`)}
                                                className="btn-filled w-full"
                                            >
                                                <Printer size={16} className="mr-2" /> Print Receipt
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedLayaway(layaway); setView('pay'); }}
                                                className="btn-elegant w-full"
                                            >
                                                <CreditCard size={16} className="mr-2" /> Make Payment
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* CREATE VIEW */}
                {view === 'create' && (
                    <div className="elegant-frame animate-fade-up bg-white dark:bg-onyx-900 border border-onyx-900/10 dark:border-white/10">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-display text-xl text-onyx-900 dark:text-white tracking-wide">NEW LAYAWAY</h2>
                            <button onClick={() => setView('search')} className="text-gold-600 dark:text-gold-400 text-sm">
                                Cancel
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <input
                                    placeholder="SERVICE / ITEM NAME"
                                    value={serviceName}
                                    onChange={(e) => setServiceName(e.target.value)}
                                    className="bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full py-2 outline-none"
                                />
                                {errors.serviceName && <p className="text-red-400 text-xs mt-1">{errors.serviceName}</p>}
                            </div>
                            <textarea
                                placeholder="DESCRIPTION (OPTIONAL)"
                                value={serviceDesc}
                                onChange={(e) => setServiceDesc(e.target.value)}
                                rows={2}
                                className="resize-none bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full outline-none"
                            />
                            <div>
                                <input
                                    type="number"
                                    placeholder="TOTAL AMOUNT (₦)"
                                    value={totalAmount}
                                    onChange={(e) => setTotalAmount(e.target.value)}
                                    className="bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full py-2 outline-none"
                                />
                                {errors.totalAmount && <p className="text-red-400 text-xs mt-1">{errors.totalAmount}</p>}
                            </div>

                            <div className="border-t border-onyx-900/10 dark:border-white/10 pt-6 mt-6">
                                <p className="text-gray-500 text-sm uppercase tracking-wider mb-4">Customer Details</p>
                                <div className="space-y-6">
                                    <div>
                                        <input placeholder="FULL NAME" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full py-2 outline-none" />
                                        {errors.customerName && <p className="text-red-400 text-xs mt-1">{errors.customerName}</p>}
                                    </div>
                                    <div>
                                        <input placeholder="PHONE NUMBER" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full py-2 outline-none" />
                                        {errors.customerPhone && <p className="text-red-400 text-xs mt-1">{errors.customerPhone}</p>}
                                    </div>
                                    <input placeholder="EMAIL (OPTIONAL)" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full py-2 outline-none" />
                                </div>
                            </div>

                            <button onClick={handleCreateLayaway} className="btn-filled w-full mt-6">
                                Create Layaway
                            </button>
                        </div>
                    </div>
                )}

                {/* PAY VIEW */}
                {view === 'pay' && selectedLayaway && (
                    <div className="elegant-frame animate-fade-up bg-white dark:bg-onyx-900 border border-onyx-900/10 dark:border-white/10">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="font-display text-xl text-onyx-900 dark:text-white tracking-wide">MAKE PAYMENT</h2>
                            <button onClick={() => { setView('list'); setSelectedLayaway(null); }} className="text-gold-600 dark:text-gold-400 text-sm">
                                Cancel
                            </button>
                        </div>

                        <div className="border border-onyx-900/10 dark:border-white/10 p-6 mb-8">
                            <h3 className="font-display text-lg text-onyx-900 dark:text-white mb-2">{selectedLayaway.service?.name}</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-500">Remaining Balance</span>
                                <span className="text-gold-600 dark:text-gold-400 font-display text-lg">
                                    ₦{selectedLayaway.remainingAmount.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <p className="text-gray-500 text-sm uppercase tracking-wider mb-4">Payment Amount (min ₦{MIN_PAYMENT})</p>
                            <input
                                type="number"
                                placeholder={`₦${MIN_PAYMENT} - ₦${selectedLayaway.remainingAmount.toLocaleString()}`}
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                min={MIN_PAYMENT}
                                max={selectedLayaway.remainingAmount}
                                className="text-center text-2xl font-display bg-transparent text-onyx-900 dark:text-white border-b border-gray-300 dark:border-gray-700 w-full outline-none"
                            />

                            {/* Quick amounts */}
                            <div className="flex gap-3 mt-4">
                                {[500, 1000, 2000, 5000].filter(a => a <= selectedLayaway.remainingAmount).map(amount => (
                                    <button
                                        key={amount}
                                        onClick={() => setPaymentAmount(amount.toString())}
                                        className="flex-1 py-3 border border-onyx-900/10 dark:border-white/10 hover:border-gold-600 dark:hover:border-gold-400 text-onyx-900 dark:text-white text-sm transition-colors"
                                    >
                                        ₦{amount.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {Number(paymentAmount) >= MIN_PAYMENT && Number(paymentAmount) <= selectedLayaway.remainingAmount && (
                            <FlutterWaveButton
                                {...paymentConfig}
                                amount={Number(paymentAmount)}
                                callback={handlePaymentSuccess}
                                onClose={() => { }}
                                className="btn-filled w-full"
                                text={`Pay ₦${Number(paymentAmount).toLocaleString()}`}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
