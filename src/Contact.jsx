import React, { useState } from 'react';
import { ApiService } from './services/api';
import { Send, CheckCircle, User, Mail, Phone, MessageSquare } from 'lucide-react';
import { useSecurity } from './security/SecurityProvider';

export default function Contact() {
    const security = useSecurity();
    const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const validate = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Name is required';
        if (!form.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Invalid email';
        if (!form.message.trim()) newErrors.message = 'Message is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSending(true);
        try {
            await ApiService.sendMessage({
                name: form.name,
                email: form.email,
                phone: form.phone,
                message: form.message,
            });
            setSent(true);
            setForm({ name: '', email: '', phone: '', message: '' });
        } catch (error) {
            alert(error.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen bg-ivory dark:bg-onyx-950 pt-24 flex items-center justify-center px-6 transition-colors duration-300">
                <div className="text-center animate-fade-up">
                    <div className="w-20 h-20 mx-auto mb-8 border-2 border-green-500/50 rounded-full flex items-center justify-center">
                        <CheckCircle size={48} className="text-green-500" />
                    </div>
                    <h2 className="font-display text-3xl text-onyx-900 dark:text-white mb-4">Message Sent!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-8">
                        Thank you for reaching out. We'll get back to you soon.
                    </p>
                    <button
                        onClick={() => setSent(false)}
                        className="btn-elegant"
                    >
                        Send Another Message
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory dark:bg-onyx-950 pt-24 pb-20 transition-colors duration-300">
            {/* Header */}
            <header className="text-center py-12 px-6">
                <p className="font-script text-gold-600 dark:text-gold-400 text-2xl mb-4">Get In Touch</p>
                <h1 className="font-display text-4xl md:text-5xl font-light text-onyx-900 dark:text-white mb-4 tracking-wide">
                    CONTACT US
                </h1>
                <div className="divider-gold mb-8" />
                <p className="font-display text-lg text-gray-600 dark:text-gray-400 font-light italic max-w-2xl mx-auto">
                    Have a question or special request? We'd love to hear from you
                </p>
            </header>

            <div className="max-w-2xl mx-auto px-6">
                <form onSubmit={handleSubmit} className="elegant-frame animate-fade-up">
                    <div className="space-y-8">
                        {/* Name */}
                        <div className="relative">
                            <User className="absolute left-0 top-4 text-gray-600" size={18} />
                            <input
                                name="name"
                                placeholder="YOUR NAME"
                                value={form.name}
                                onChange={handleChange}
                                className={`pl-8 ${errors.name ? 'border-b-red-500' : ''}`}
                            />
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <Mail className="absolute left-0 top-4 text-gray-600" size={18} />
                            <input
                                name="email"
                                type="email"
                                placeholder="YOUR EMAIL"
                                value={form.email}
                                onChange={handleChange}
                                className={`pl-8 ${errors.email ? 'border-b-red-500' : ''}`}
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                        </div>

                        {/* Phone */}
                        <div className="relative">
                            <Phone className="absolute left-0 top-4 text-gray-600" size={18} />
                            <input
                                name="phone"
                                placeholder="YOUR PHONE (OPTIONAL)"
                                value={form.phone}
                                onChange={handleChange}
                                className="pl-8"
                            />
                        </div>

                        {/* Message */}
                        <div className="relative">
                            <MessageSquare className="absolute left-0 top-4 text-gray-600" size={18} />
                            <textarea
                                name="message"
                                placeholder="YOUR MESSAGE"
                                value={form.message}
                                onChange={handleChange}
                                rows={5}
                                className={`pl-8 resize-none text-onyx-900 dark:text-white bg-transparent ${errors.message ? 'border-b-red-500' : ''}`}
                            />
                            {errors.message && <p className="text-red-400 text-xs mt-1">{errors.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={sending}
                            className="btn-filled w-full flex items-center justify-center gap-3"
                        >
                            {sending ? (
                                'Sending...'
                            ) : (
                                <>
                                    <Send size={16} /> Send Message
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Contact Info */}
                <div className="mt-16 text-center">
                    <p className="text-gray-500 text-sm mb-4">Or reach us directly:</p>
                    <p className="font-display text-lg text-gold-400">+234 708 622 1958</p>
                    <p className="text-gray-400 mt-2">Olabanjiariyo@gmail.com</p>
                </div>
            </div>
        </div>
    );
}
