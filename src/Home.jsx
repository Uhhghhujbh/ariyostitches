import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Phone, Mail, Star } from 'lucide-react';

export default function Home() {
    const services = [
        { title: 'Bespoke Tailoring', desc: 'Custom-made garments crafted to your exact measurements' },
        { title: 'Ready-to-Wear', desc: 'Premium pre-made pieces for immediate purchase' },
        { title: 'Alterations', desc: 'Expert modifications to perfect your existing wardrobe' },
        { title: 'Fabric Sourcing', desc: 'Access to the finest materials from around the world' },
    ];

    const testimonials = [
        { name: 'Chief Adebayo Oluwaseun', text: 'The craftsmanship is unmatched. My agbada was absolutely perfect for my chieftaincy ceremony.', location: 'Lagos' },
        { name: 'Alhaja Fatima Ibrahim', text: 'Finally found a tailor who understands quality. Beautiful work every single time.', location: 'Abuja' },
        { name: 'Dr. Chinedu Okafor', text: 'The pay-small-small option made it possible to afford premium quality. Exceptional service.', location: 'Ilorin' },
    ];

    return (
        <div className="min-h-screen bg-onyx-950">
            {/* HERO SECTION - Full Screen Elegant */}
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center bg-fixed"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558171813-4c088753af8f?w=1920')" }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-onyx-950" />

                {/* Content */}
                <div className="relative z-10 text-center px-6 max-w-4xl animate-fade-up">
                    {/* Logo */}
                    <div className="mb-8">
                        <img
                            src="/ariyologo.png"
                            alt="Ariyo Fashion"
                            className="w-28 h-28 mx-auto rounded-full border-2 border-gold-400/50"
                        />
                    </div>

                    {/* Script Title */}
                    <p className="font-script text-gold-400 text-3xl md:text-4xl mb-4">
                        Welcome to
                    </p>

                    {/* Main Title */}
                    <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-light text-white mb-6 tracking-wide">
                        ARIYO <span className="text-gradient-gold">FASHION</span>
                    </h1>

                    {/* Divider */}
                    <div className="divider-ornament mb-8">
                        <span className="text-gold-400 text-sm tracking-[0.3em]">EST. 2010</span>
                    </div>

                    {/* Subtitle */}
                    <p className="font-display text-xl md:text-2xl text-gray-300 font-light italic mb-12">
                        Premium Bespoke Tailoring & Ready-to-Wear Collections
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link to="/shop" className="btn-elegant inline-flex items-center justify-center gap-3">
                            View Collection <ArrowRight size={16} />
                        </Link>
                        <Link to="/layaway" className="btn-filled inline-flex items-center justify-center gap-3">
                            Pay Small-Small
                        </Link>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
                    <div className="w-px h-16 bg-gradient-to-b from-gold-400 to-transparent" />
                </div>
            </section>

            {/* ABOUT SECTION - Elegant Split */}
            <section className="py-32 px-6 bg-onyx-950">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Image Side */}
                        <div className="relative">
                            <div className="corner-decor p-6">
                                <img
                                    src="https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=800"
                                    alt="Craftsmanship"
                                    className="w-full aspect-[4/5] object-cover"
                                />
                            </div>
                            {/* Floating Badge */}
                            <div className="absolute -bottom-8 -right-8 bg-gold-400 text-black p-8 text-center">
                                <p className="font-display text-4xl font-bold">15+</p>
                                <p className="text-sm tracking-widest uppercase">Years</p>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="lg:pl-8">
                            <p className="font-script text-gold-400 text-2xl mb-4">Our Story</p>
                            <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-8">
                                A Legacy of Fine Tailoring
                            </h2>
                            <div className="divider-gold mb-8 ml-0" style={{ margin: '0 0 2rem 0' }} />

                            <p className="text-gray-400 leading-relaxed mb-6">
                                Nestled in the heart of Ilorin, Ariyo Home of Fashion has been crafting
                                exceptional garments for over fifteen years. Our master tailors combine
                                time-honored Nigerian craftsmanship with contemporary design sensibilities.
                            </p>
                            <p className="text-gray-400 leading-relaxed mb-8">
                                From stunning agbadas for momentous occasions to sophisticated senator
                                suits for discerning gentlemen, every piece that leaves our atelier
                                carries the mark of excellence.
                            </p>

                            <div className="flex items-center gap-4 text-gold-400 mb-12">
                                <MapPin size={18} />
                                <span className="font-display text-lg">Ogidi Okolowo, Ilorin, Kwara State</span>
                            </div>

                            <Link to="/shop" className="btn-elegant inline-flex items-center gap-3">
                                Explore Our Work <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* SERVICES SECTION - Elegant Grid */}
            <section className="py-32 px-6 bg-onyx-900 relative">
                {/* Top Border */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />

                <div className="max-w-6xl mx-auto text-center">
                    <p className="font-script text-gold-400 text-2xl mb-4">What We Offer</p>
                    <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-6">
                        Our Services
                    </h2>
                    <div className="divider-gold mb-20" />

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5">
                        {services.map((service, idx) => (
                            <div
                                key={idx}
                                className="bg-onyx-900 p-10 text-center group hover:bg-onyx-800 transition-colors duration-500"
                            >
                                <span className="font-display text-5xl text-gold-400/20 group-hover:text-gold-400/40 transition-colors">
                                    0{idx + 1}
                                </span>
                                <h3 className="font-display text-xl text-white mt-4 mb-3">
                                    {service.title}
                                </h3>
                                <p className="text-gray-500 text-sm leading-relaxed">
                                    {service.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Border */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />
            </section>

            {/* TESTIMONIALS - Elegant */}
            <section className="py-32 px-6 bg-onyx-950">
                <div className="max-w-5xl mx-auto text-center">
                    <p className="font-script text-gold-400 text-2xl mb-4">Testimonials</p>
                    <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-6">
                        Words From Our Clients
                    </h2>
                    <div className="divider-gold mb-20" />

                    <div className="space-y-16">
                        {testimonials.map((t, idx) => (
                            <div key={idx} className="elegant-frame max-w-3xl mx-auto">
                                <div className="flex justify-center gap-1 mb-6">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} className="text-gold-400 fill-gold-400" />
                                    ))}
                                </div>
                                <p className="font-display text-2xl md:text-3xl font-light text-white italic leading-relaxed mb-8">
                                    "{t.text}"
                                </p>
                                <div className="divider-gold mb-6" />
                                <p className="font-display text-lg text-gold-400">{t.name}</p>
                                <p className="text-gray-500 text-sm tracking-widest uppercase">{t.location}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CONTACT SECTION */}
            <section className="py-32 px-6 bg-onyx-900 relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-400/30 to-transparent" />

                <div className="max-w-4xl mx-auto text-center">
                    <p className="font-script text-gold-400 text-2xl mb-4">Get In Touch</p>
                    <h2 className="font-display text-4xl md:text-5xl font-light text-white mb-6">
                        Visit Our Atelier
                    </h2>
                    <div className="divider-gold mb-16" />

                    <div className="grid md:grid-cols-3 gap-12">
                        <div>
                            <MapPin className="w-8 h-8 text-gold-400 mx-auto mb-4" />
                            <h3 className="font-display text-lg text-white mb-2">Location</h3>
                            <p className="text-gray-500">
                                Ogidi Okolowo<br />
                                Ilorin, Kwara State<br />
                                Nigeria
                            </p>
                        </div>
                        <div>
                            <Phone className="w-8 h-8 text-gold-400 mx-auto mb-4" />
                            <h3 className="font-display text-lg text-white mb-2">Telephone</h3>
                            <p className="text-gray-500">
                                +234 708 622 1958
                            </p>
                        </div>
                        <div>
                            <Mail className="w-8 h-8 text-gold-400 mx-auto mb-4" />
                            <h3 className="font-display text-lg text-white mb-2">Email</h3>
                            <p className="text-gray-500">
                                Olabanjiariyo@gmail.com
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 px-6 bg-onyx-950 border-t border-white/5">
                <div className="max-w-6xl mx-auto text-center">
                    <img src="/ariyologo.png" alt="Ariyo" className="w-12 h-12 rounded-full mx-auto mb-4" />
                    <p className="font-display text-xl tracking-widest text-white mb-2">
                        ARIYO FASHION
                    </p>
                    <p className="text-gray-600 text-sm mb-4">
                        © {new Date().getFullYear()} Ariyo Home Of Fashion. All rights reserved.
                    </p>
                    <div className="border-t border-white/5 pt-4 mt-4">
                        <p className="text-gray-500 text-xs">
                            Developed by{' '}
                            <a
                                href="https://learnovatech.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gold-400 hover:text-gold-500 transition-colors"
                            >
                                LearnovaTech
                            </a>
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}