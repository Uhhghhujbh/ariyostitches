import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Home from './Home';
import Shop from './Shop';
import Checkout from './Checkout';
import Success from './Success';
import Admin from './Admin';
import Layaway from './Layaway';
import LayawayPrint from './LayawayPrint';
import Contact from './Contact';
import { CartProvider } from './CartContext';
import { LayawayProvider } from './LayawayContext';
import { SecurityProvider } from './security/SecurityProvider';
import ErrorBoundary from './security/ErrorBoundary';
import { ThemeProvider } from './ThemeContext';

function App() {
    return (
        <ErrorBoundary>
            <SecurityProvider>
                <CartProvider>
                    <LayawayProvider>
                        <ThemeProvider>
                            <BrowserRouter>
                                <div className="min-h-screen bg-ivory dark:bg-onyx-950 text-onyx-900 dark:text-white font-sans transition-colors duration-300">
                                    <Navbar />
                                    <Routes>
                                        <Route path="/" element={<Home />} />
                                        <Route path="/shop" element={<Shop />} />
                                        <Route path="/cart" element={<Checkout />} />
                                        <Route path="/success/:id" element={<Success />} />
                                        <Route path="/me" element={<Admin />} />
                                        <Route path="/layaway" element={<Layaway />} />
                                        <Route path="/layaway/print/:id" element={<LayawayPrint />} />
                                        <Route path="/contact" element={<Contact />} />
                                    </Routes>
                                </div>
                            </BrowserRouter>
                        </ThemeProvider>
                    </LayawayProvider>
                </CartProvider>
            </SecurityProvider>
        </ErrorBoundary>
    );
}

export default App;