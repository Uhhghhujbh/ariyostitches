import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from './firebase-config';
import { doc, getDoc } from 'firebase/firestore';
import QRCode from 'react-qr-code';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Share2, CheckCircle, Home } from 'lucide-react';

export default function Success() {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const receiptRef = useRef();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const docSnap = await getDoc(doc(db, "orders", id));
                if (docSnap.exists()) setOrder(docSnap.data());
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
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
        pdf.save(`Ariyo_Receipt_${id.slice(0, 8)}.pdf`);
    };

    const shareReceipt = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Ariyo Fashion Receipt',
                    text: `Order #${id.slice(0, 8)} - ₦${order.total.toLocaleString()}`,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
        }
    };

    if (loading) {
        return (
            <div className="pt-32 min-h-screen flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Generating your receipt...</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="pt-32 min-h-screen flex flex-col items-center justify-center text-center px-6">
                <h2 className="text-2xl font-serif text-red-400 mb-4">Order Not Found</h2>
                <p className="text-gray-400 mb-8">This order may have been removed or the link is invalid.</p>
                <Link to="/" className="btn-gold">Go Home</Link>
            </div>
        );
    }

    return (
        <div className="pt-24 px-4 md:px-6 pb-20 min-h-screen flex flex-col items-center bg-ivory dark:bg-onyx-950 transition-colors duration-300">
            {/* Success Message */}
            <div className="text-center mb-8 animate-slide-up">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={48} className="text-green-500" />
                </div>
                <h2 className="text-3xl md:text-4xl gradient-text font-serif mb-2">Payment Successful!</h2>
                <p className="text-gray-600 dark:text-gray-400">Your order has been confirmed. Download your receipt below.</p>
            </div>

            {/* RECEIPT CARD */}
            <div
                ref={receiptRef}
                className="bg-white text-black w-full max-w-md shadow-2xl"
                style={{ fontFamily: 'system-ui, sans-serif' }}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-yellow-600 to-yellow-500 p-6 text-center text-white">
                    <img
                        src="/ariyologo.png"
                        alt="Ariyo Fashion"
                        className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white"
                    />
                    <h1 className="text-2xl font-bold uppercase tracking-widest">Ariyo Fashion</h1>
                    <p className="text-xs opacity-90 mt-1">Premium Bespoke Tailoring</p>
                </div>

                <div className="p-6">
                    {/* Order Info */}
                    <div className="bg-gray-100 rounded-lg p-4 mb-6">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <p><span className="font-bold">Order ID:</span></p>
                            <p className="text-right">{id.slice(0, 8).toUpperCase()}</p>
                            <p><span className="font-bold">Customer:</span></p>
                            <p className="text-right">{order.customer.name}</p>
                            <p><span className="font-bold">Phone:</span></p>
                            <p className="text-right">{order.customer.phone}</p>
                            <p><span className="font-bold">Date:</span></p>
                            <p className="text-right">{new Date(order.date).toLocaleDateString('en-NG', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            })}</p>
                        </div>
                    </div>

                    {/* Items */}
                    <table className="w-full mb-6 text-sm">
                        <thead>
                            <tr className="border-b-2 border-gray-200">
                                <th className="text-left py-2 font-bold">Item</th>
                                <th className="text-right py-2 font-bold">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, idx) => (
                                <tr key={idx} className="border-b border-gray-100">
                                    <td className="py-3">{item.name}</td>
                                    <td className="text-right font-medium">₦{Number(item.price).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Total */}
                    <div className="bg-black text-white rounded-lg p-4 flex justify-between items-center mb-6">
                        <span className="text-lg font-bold">Total Paid</span>
                        <span className="text-2xl font-bold text-yellow-400">₦{order.total.toLocaleString()}</span>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center py-4 border-t border-dashed border-gray-300">
                        <div className="p-3 bg-white border-2 border-black rounded-lg">
                            <QRCode
                                value={JSON.stringify({ id: id, amount: order.total, verified: true })}
                                size={100}
                            />
                        </div>
                        <p className="text-xs mt-2 text-gray-500 uppercase tracking-wider">Scan to verify at store</p>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                        <p>Ogidi Okolowo, Ilorin, Kwara State</p>
                        <p>Tel: 07086221958</p>
                        <p className="mt-2 font-bold">Thank you for shopping with us!</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <button onClick={downloadPDF} className="btn-gold">
                    <Download size={20} /> Download PDF
                </button>
                <button onClick={shareReceipt} className="btn-glass">
                    <Share2 size={20} /> Share Receipt
                </button>
                <Link to="/" className="btn-glass">
                    <Home size={20} /> Back to Home
                </Link>
            </div>
        </div>
    );
}