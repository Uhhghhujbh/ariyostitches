import React, { useState, useEffect } from 'react';
import { auth } from './firebase-config';
import { ApiService } from './services/api';
// db import kept for auth, but Firestore imports removed
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useSecurity } from './security/SecurityProvider';
import {
    Upload, LogOut, Package, AlertCircle,
    CheckCircle, XCircle, Loader2, Link as LinkIcon, Mail, Trash2, Eye
} from 'lucide-react';

export default function Admin() {
    const security = useSecurity();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('upload');

    // Admin emails from environment variable
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').toLowerCase().split(',');

    // Login States
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    // Upload States - Now using URL instead of file
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodDesc, setProdDesc] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    // Verify States
    const [orderId, setOrderId] = useState('');
    const [verifyStatus, setVerifyStatus] = useState('idle');
    const [verifiedOrder, setVerifiedOrder] = useState(null);

    // Messages States
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const handleLogin = async () => {
        setLoginError('');
        setLoginLoading(true);

        try {
            await security.secureLogin(email, async () => {
                const userCred = await signInWithEmailAndPassword(auth, email, pass);

                // Check if admin using environment variable
                if (adminEmails.includes(email.toLowerCase())) {
                    setUser(userCred.user);
                } else {
                    await signOut(auth);
                    throw new Error("Not authorized as admin");
                }
            });
        } catch (e) {
            setLoginError(e.message);
        } finally {
            setLoginLoading(false);
        }
    };

    const fetchMessages = async () => {
        setLoadingMessages(true);
        try {
            const response = await ApiService.getMessages();
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoadingMessages(false);
        }
    };

    const markAsRead = async (msgId) => {
        try {
            await ApiService.markMessageRead(msgId);
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, read: true } : m));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const deleteMessage = async (msgId) => {
        if (!window.confirm('Delete this message?')) return;
        try {
            await ApiService.deleteMessage(msgId);
            setMessages(prev => prev.filter(m => m.id !== msgId));
        } catch (error) {
            console.error("Error deleting message:", error);
        }
    };

    useEffect(() => {
        if (user && activeTab === 'messages') {
            fetchMessages();
        }
    }, [user, activeTab]);

    const handleUpload = async () => {
        if (!imageUrl || !prodName || !prodPrice) {
            alert('Please fill all required fields (Name, Price, Image URL)');
            return;
        }

        // Validate URL format
        try {
            new URL(imageUrl);
        } catch {
            alert('Please enter a valid image URL');
            return;
        }

        const validation = security.validateInput(prodName);
        if (!validation.valid) {
            alert('Invalid input detected');
            return;
        }

        setUploading(true);
        try {
            await ApiService.addProduct({
                name: security.sanitize.string(prodName),
                price: security.sanitize.number(prodPrice),
                description: security.sanitize.string(prodDesc),
                image_url: imageUrl.trim()
            });

            alert("Product Added!");
            setProdName('');
            setProdPrice('');
            setProdDesc('');
            setImageUrl('');
        } catch (e) {
            alert("Error: " + (e.response?.data?.error || e.message));
        }
        setUploading(false);
    };

    const handleVerifyOrder = async () => {
        if (!orderId.trim()) return;

        setVerifyStatus('checking');
        setVerifiedOrder(null);

        try {
            const response = await ApiService.verifyOrder(orderId);
            const data = response.data;

            setVerifyStatus('valid');
            setVerifiedOrder(data);

            if (!data.scanned) {
                await ApiService.updateOrderStatus(orderId, undefined, true);
            }
        } catch (e) {
            console.error("Verify error:", e);
            setVerifyStatus('invalid');
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setUser(null);
        setEmail('');
        setPass('');
    };

    // Login Screen
    if (!user) {
        const loginStatus = security.getLoginStatus?.(email);

        return (
            <div className="pt-32 px-6 min-h-screen bg-ivory dark:bg-onyx-950 flex justify-center transition-colors duration-300">
                <div className="elegant-frame w-full max-w-sm h-fit animate-fade-up bg-white dark:bg-onyx-900 border border-onyx-900/10 dark:border-white/10">
                    <div className="text-center mb-8">
                        <img src="/ariyologo.png" alt="Ariyo" className="w-16 h-16 rounded-full mx-auto mb-4 border border-gold-400/50" />
                        <h2 className="font-display text-2xl text-gradient-gold">Admin Access</h2>
                    </div>

                    {loginError && (
                        <div className="bg-red-500/10 border border-red-500/30 p-4 mb-6 flex items-center gap-3 text-sm">
                            <AlertCircle size={18} className="text-red-400" />
                            <span className="text-red-400">{loginError}</span>
                        </div>
                    )}

                    {loginStatus?.locked && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 mb-6 text-sm text-center text-yellow-400">
                            Account locked. Try again in {loginStatus.unlockInSeconds}s
                        </div>
                    )}

                    <div className="space-y-6 mb-8">
                        <input
                            type="email"
                            placeholder="ADMIN EMAIL"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="text-center bg-transparent border-b border-gray-300 dark:border-gray-700 text-onyx-900 dark:text-white"
                        />
                        type="password"
                        placeholder="PASSWORD"
                        value={pass}
                        onChange={e => setPass(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="text-center bg-transparent border-b border-gray-300 dark:border-gray-700 text-onyx-900 dark:text-white"
                        />
                    </div>

                    <button
                        onClick={handleLogin}
                        disabled={loginLoading || loginStatus?.locked}
                        className="w-full btn-filled disabled:opacity-50"
                    >
                        {loginLoading ? 'Logging in...' : 'Login'}
                    </button>

                    {loginStatus?.attempts > 0 && (
                        <p className="text-center text-xs text-gray-500 mt-4">
                            {loginStatus.remainingAttempts} attempts remaining
                        </p>
                    )}
                </div>
            </div>
        );
    }

    const unreadCount = messages.filter(m => !m.read).length;

    return (
        <div className="pt-24 px-4 md:px-6 pb-20 max-w-5xl mx-auto min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <p className="font-script text-gold-600 dark:text-gold-400 text-xl">Welcome back</p>
                    <h1 className="font-display text-3xl text-onyx-900 dark:text-white tracking-wide">Admin Dashboard</h1>
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-onyx-900 dark:text-gray-400 dark:hover:text-white flex items-center gap-2 text-sm">
                    <LogOut size={18} /> Logout
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-onyx-900/10 dark:border-white/10 pb-4">
                {[
                    { id: 'upload', label: 'Add Product', icon: Upload },
                    { id: 'verify', label: 'Verify Order', icon: CheckCircle },
                    { id: 'messages', label: `Messages ${unreadCount > 0 ? `(${unreadCount})` : ''}`, icon: Mail },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${activeTab === tab.id
                            ? 'text-gold-600 dark:text-gold-400 border-b-2 border-gold-600 dark:border-gold-400 -mb-[18px]'
                            : 'text-gray-600 dark:text-gray-500 hover:text-onyx-900 dark:hover:text-white'
                            }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Upload Product - Now with URL */}
            {activeTab === 'upload' && (
                <div className="elegant-frame animate-fade-up bg-white dark:bg-onyx-900 border border-onyx-900/10 dark:border-white/10">
                    <h2 className="font-display text-xl text-onyx-900 dark:text-white mb-8 tracking-wide">
                        ADD NEW PRODUCT
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Product Name *</p>
                            <input placeholder="e.g. Premium Agbada Set" value={prodName} onChange={e => setProdName(e.target.value)} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Price (₦) *</p>
                            <input type="number" placeholder="e.g. 25000" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Description</p>
                            <textarea placeholder="Describe the product..." value={prodDesc} onChange={e => setProdDesc(e.target.value)} rows={3} className="resize-none" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Product Image *</p>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;

                                        // Validate size (e.g. 5MB)
                                        if (file.size > 5 * 1024 * 1024) {
                                            alert("File too large (Max 5MB)");
                                            return;
                                        }

                                        setUploading(true);
                                        const formData = new FormData();
                                        formData.append('file', file);

                                        try {
                                            const res = await ApiService.uploadFile(formData);
                                            setImageUrl(res.data.url);
                                        } catch (error) {
                                            console.error("Upload failed", error);
                                            alert("Image upload failed");
                                        } finally {
                                            setUploading(false);
                                        }
                                    }}
                                    className="block w-full text-sm text-gray-500
                                    file:mr-4 file:py-2 file:px-4
                                    file:rounded-full file:border-0
                                    file:text-sm file:font-semibold
                                    file:bg-gold-50 file:text-gold-700
                                    hover:file:bg-gold-100"
                                />
                                {imageUrl && <p className="text-xs text-green-500 mt-2">✓ Image uploaded successfully</p>}
                            </div>
                        </div>

                        {/* Image Preview */}
                        {imageUrl && (
                            <div className="border border-white/10 p-4">
                                <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Preview</p>
                                <img
                                    src={imageUrl}
                                    alt="Preview"
                                    className="max-h-48 object-contain mx-auto"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            </div>
                        )}

                        <button onClick={handleUpload} disabled={uploading} className="w-full btn-filled mt-4">
                            {uploading ? 'Saving...' : 'Save Product'}
                        </button>
                    </div>
                </div>
            )}

            {/* Verify Order */}
            {activeTab === 'verify' && (
                <div className="elegant-frame animate-fade-up bg-white dark:bg-onyx-900 border border-onyx-900/10 dark:border-white/10">
                    <h2 className="font-display text-xl text-onyx-900 dark:text-white mb-8 tracking-wide">
                        VERIFY CUSTOMER ORDER
                    </h2>

                    <div className="flex gap-4 mb-8">
                        <input placeholder="ENTER ORDER ID OR LAYAWAY ID" value={orderId} onChange={e => setOrderId(e.target.value)} className="flex-1 text-center" />
                        <button onClick={handleVerifyOrder} className="btn-filled px-8">Verify</button>
                    </div>

                    <div className="text-center py-12">
                        {verifyStatus === 'idle' && <p className="text-gray-500">Enter an order ID to verify</p>}
                        {verifyStatus === 'checking' && <Loader2 size={48} className="mx-auto animate-spin text-gold-400" />}
                        {verifyStatus === 'valid' && (
                            <div>
                                <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                                <p className="font-display text-2xl text-green-500 dark:text-green-400 mb-4">✓ VERIFIED</p>
                                {verifiedOrder && (
                                    <div className="border border-onyx-900/10 dark:border-white/10 p-6 text-left max-w-sm mx-auto text-onyx-900 dark:text-white">
                                        <p><strong>Type:</strong> {verifiedOrder.type}</p>
                                        <p><strong>Customer:</strong> {verifiedOrder.customer?.name}</p>
                                        <p><strong>Amount:</strong> ₦{(verifiedOrder.total || verifiedOrder.totalAmount)?.toLocaleString()}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        {verifyStatus === 'pending' && (
                            <div>
                                <AlertCircle size={64} className="mx-auto text-yellow-500 mb-4" />
                                <p className="font-display text-2xl text-yellow-400">⏳ IN PROGRESS</p>
                            </div>
                        )}
                        {verifyStatus === 'invalid' && (
                            <div>
                                <XCircle size={64} className="mx-auto text-red-500 mb-4" />
                                <p className="font-display text-2xl text-red-400">✗ INVALID</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Messages */}
            {activeTab === 'messages' && (
                <div className="animate-fade-up">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="font-display text-xl text-onyx-900 dark:text-white tracking-wide">
                            CUSTOMER MESSAGES
                        </h2>
                        <button onClick={fetchMessages} className="text-gold-400 text-sm">Refresh</button>
                    </div>

                    {loadingMessages ? (
                        <div className="text-center py-12">
                            <Loader2 size={32} className="mx-auto animate-spin text-gold-400" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-12 border border-white/10">
                            <Mail size={48} className="mx-auto mb-4 text-gray-600" />
                            <p className="text-gray-500">No messages yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`border p-6 rounded ${msg.read ? 'border-onyx-900/5 dark:border-white/5 bg-white dark:bg-onyx-900' : 'border-gold-400/30 bg-gold-400/5 dark:bg-gold-400/5'}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-display text-lg text-onyx-900 dark:text-white">{msg.name}</p>
                                            <p className="text-gray-500 text-sm">{msg.email} • {msg.phone || 'No phone'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {!msg.read && (
                                                <button onClick={() => markAsRead(msg.id)} className="text-gold-400 hover:text-gold-500" title="Mark as read">
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => deleteMessage(msg.id)} className="text-gray-500 hover:text-red-400" title="Delete">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <p className="text-gray-700 dark:text-gray-300">{msg.message}</p>
                                    <p className="text-gray-500 text-xs mt-4">
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )
            }
        </div>
    );
}
