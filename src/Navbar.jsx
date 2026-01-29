import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { useCart } from './CartContext';
import { auth } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';

export default function Navbar() {
    const { isDark, toggleTheme } = useTheme();
    const { cart } = useCart();
    const [isOpen, setIsOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const location = useLocation();

    // Admin emails from environment variable
    const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').toLowerCase().split(',');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && adminEmails.includes(user.email?.toLowerCase())) {
                setIsAdmin(true);
            } else {
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const navLinks = [
        { to: '/', label: 'Home' },
        { to: '/shop', label: 'Collection' },
        { to: '/layaway', label: 'Pay Small-Small' },
        { to: '/contact', label: 'Contact' },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <>
            <nav className="fixed top-0 w-full z-50 bg-ivory/90 dark:bg-onyx-950/90 backdrop-blur-sm border-b border-onyx-900/10 dark:border-white/5 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <img
                            src="/ariyologo.png"
                            alt="Ariyo Fashion"
                            className="w-10 h-10 rounded-full border border-gold-400/50"
                        />
                        <span className="font-display text-xl tracking-widest hidden sm:block">
                            <span className="text-gold-600 dark:text-gold-400">ARIYO</span>
                            <span className="text-onyx-900 dark:text-white ml-1">FASHION</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex gap-10 items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`text-sm tracking-[0.2em] uppercase transition-colors duration-300 ${isActive(link.to)
                                    ? 'text-gold-600 dark:text-gold-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-onyx-900 dark:hover:text-white'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="flex gap-6 items-center">
                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="text-gray-600 dark:text-gray-400 hover:text-gold-600 dark:hover:text-gold-400 transition-colors"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        <Link
                            to="/cart"
                            className={`relative transition-colors ${isActive('/cart') ? 'text-gold-600 dark:text-gold-400' : 'text-gray-600 dark:text-gray-400 hover:text-onyx-900 dark:hover:text-white'
                                }`}
                        >
                            <ShoppingBag size={20} />
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-gold-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                                    {cart.length}
                                </span>
                            )}
                        </Link>

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden text-gray-600 dark:text-gray-400 hover:text-onyx-900 dark:hover:text-white transition-colors"
                        >
                            {isOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu - Full Screen Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-40 bg-ivory dark:bg-onyx-950 flex flex-col items-center justify-center animate-fade-in text-onyx-900 dark:text-white">
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 text-gray-400 hover:text-white"
                    >
                        <X size={28} />
                    </button>

                    <nav className="text-center space-y-8">
                        {navLinks.map((link, idx) => (
                            <div key={link.to} className="animate-fade-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                                <Link
                                    to={link.to}
                                    onClick={() => setIsOpen(false)}
                                    className={`font-display text-3xl tracking-widest transition-colors ${isActive(link.to)
                                        ? 'text-gold-600 dark:text-gold-400'
                                        : 'text-onyx-900 dark:text-white hover:text-gold-600 dark:hover:text-gold-400'
                                        }`}
                                >
                                    {link.label.toUpperCase()}
                                </Link>
                            </div>
                        ))}
                    </nav>

                    <div className="absolute bottom-12">
                        <img src="/ariyologo.png" alt="Ariyo" className="w-16 h-16 rounded-full opacity-50" />
                    </div>
                </div>
            )}
        </>
    );
}