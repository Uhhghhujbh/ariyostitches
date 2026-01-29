import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
// import { db } from './firebase-config'; // Removed
// import { doc, getDoc } from 'firebase/firestore'; // Removed
import { ApiService } from './services/api';
import QRCode from 'react-qr-code';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Share2, CheckCircle, Home, Printer } from 'lucide-react';

export default function LayawayPrint() {
    const { id } = useParams();
    const [layaway, setLayaway] = useState(null);
    const [loading, setLoading] = useState(true);
    const receiptRef = useRef();

    useEffect(() => {
        const fetchLayaway = async () => {
            try {
                // const docSnap = await getDoc(doc(db, "layaways", id));
                // if (docSnap.exists()) setLayaway({ id: docSnap.id, ...docSnap.data() });
                const response = await ApiService.getLayawayById(id);
                setLayaway(response.data);
            } catch (error) {
                console.error("Error fetching layaway:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLayaway();
    }, [id]);

    const downloadPDF = async () => {
        const element = receiptRef.current;
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        const data = canvas.toDataURL('image/png');

        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProperties = pdf.getImageProperties(data);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProperties.height * pdfWidth) / imgProperties.width;

        pdf.addImage(data, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Ariyo_Layaway_${id.slice(0, 8)}.pdf`);
    };

    if (loading) {
        return (
            <div className="pt-32 min-h-screen flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Loading receipt...</p>
            </div>
        );
    }

    if (!layaway) {
        return (
            <div className="pt-32 min-h-screen flex flex-col items-center justify-center text-center px-6">
                <h2 className="text-2xl font-serif text-red-400 mb-4">Layaway Not Found</h2>
                <Link to="/layaway" className="btn-gold">Back to Layaway</Link>
            </div>
        );
    }

    const isCompleted = layaway.status === 'completed';

    return (
        <div className="pt-24 px-4 md:px-6 pb-20 min-h-screen flex flex-col items-center bg-ivory dark:bg-onyx-950 transition-colors duration-300">
            {/* Header */}
            <div className="text-center mb-8 animate-slide-up">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isCompleted ? 'bg-green-500/20' : 'bg-gold-500/20'
                    }`}>
                    {isCompleted ? (
                        <CheckCircle size={48} className="text-green-500" />
                    ) : (
                        <Printer size={48} className="text-gold-400" />
                    )}
                </div>
                <h2 className="text-3xl md:text-4xl gradient-text font-serif mb-2">
                    {isCompleted ? 'Payment Complete!' : 'Layaway Progress'}
                </h2>
                <p className="text-gray-400">
                    {isCompleted
                        ? 'Your service is ready for collection. Show this receipt at the store.'
                        : 'Continue making payments to complete your layaway.'
                    }
                </p>
            </div>

            {/* RECEIPT */}
            <div
                ref={receiptRef}
                className="bg-white text-black w-full max-w-md shadow-2xl"
                style={{ fontFamily: 'system-ui, sans-serif' }}
            >
                {/* Header */}
                <div className={`p-6 text-center text-white ${isCompleted
                    ? 'bg-gradient-to-r from-green-600 to-green-500'
                    : 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                    }`}>
                    <img
                        src="/ariyologo.png"
                        alt="Ariyo Fashion"
                        className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white"
                    />
                    <h1 className="text-2xl font-bold uppercase tracking-widest">Ariyo Fashion</h1>
                    <p className="text-xs opacity-90 mt-1">Pay Small-Small Receipt</p>
                </div>

                <div className="p-6">
                    {/* Status Badge */}
                    <div className={`text-center py-2 px-4 rounded-full mb-6 font-bold ${isCompleted
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                        }`}>
                        {isCompleted ? '✓ FULLY PAID - READY FOR COLLECTION' : '⏳ PAYMENT IN PROGRESS'}
                    </div>

                    {/* Service Info */}
                    <div className="bg-gray-100 rounded-lg p-4 mb-6">
                        <h3 className="font-bold text-lg mb-2">{layaway.service?.name}</h3>
                        <p className="text-gray-600 text-sm">{layaway.service?.description}</p>
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm mb-6">
                        <p><span className="font-bold">Customer:</span></p>
                        <p className="text-right">{layaway.customer?.name}</p>
                        <p><span className="font-bold">Phone:</span></p>
                        <p className="text-right">{layaway.customer?.phone}</p>
                        <p><span className="font-bold">Layaway ID:</span></p>
                        <p className="text-right">{id.slice(0, 8).toUpperCase()}</p>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-black text-white rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-3 text-center">
                            <div>
                                <p className="text-xs text-gray-400">Total</p>
                                <p className="text-lg font-bold">₦{layaway.totalAmount?.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Paid</p>
                                <p className="text-lg font-bold text-green-400">₦{layaway.paidAmount?.toLocaleString()}</p>
                            </div>
                        </div>
                        {!isCompleted && (
                            <div className="text-center mt-3 pt-3 border-t border-gray-700">
                                <p className="text-xs text-gray-400">Remaining</p>
                                <p className="text-xl font-bold text-yellow-400">₦{layaway.remainingAmount?.toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    {/* Payment History */}
                    <h4 className="font-bold mb-3">Payment History</h4>
                    <table className="w-full text-sm mb-6">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="text-left py-2">Date</th>
                                <th className="text-right py-2">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {layaway.payments?.map((payment, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-2">
                                        {new Date(payment.date).toLocaleDateString('en-NG', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: '2-digit'
                                        })}
                                    </td>
                                    <td className="text-right font-medium text-green-600">
                                        +₦{payment.amount?.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* QR Code */}
                    {isCompleted && (
                        <div className="flex flex-col items-center py-4 border-t border-dashed border-gray-300">
                            <div className="p-3 bg-white border-2 border-black rounded-lg">
                                <QRCode
                                    value={JSON.stringify({
                                        id: id,
                                        type: 'layaway',
                                        amount: layaway.totalAmount,
                                        status: 'completed',
                                        verified: true
                                    })}
                                    size={100}
                                />
                            </div>
                            <p className="text-xs mt-2 text-gray-500 uppercase tracking-wider">
                                Scan to verify at store
                            </p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                        <p>Ogidi Okolowo, Ilorin, Kwara State</p>
                        <p>Tel: 07086221958</p>
                        <p className="mt-2 font-bold">Thank you for choosing Ariyo Fashion!</p>
                    </div>
                </div>

                {/* Watermark for completed */}
                {isCompleted && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] opacity-10 pointer-events-none">
                        <p className="text-8xl font-bold text-green-500">PAID</p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button onClick={downloadPDF} className="btn-gold">
                    <Download size={20} /> Download PDF
                </button>
                <Link to="/layaway" className="btn-glass">
                    <Home size={20} /> Back to Layaway
                </Link>
            </div>
        </div>
    );
}
