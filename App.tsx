
import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { HealthProvider } from './HealthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Timeline from './pages/Timeline';
import ChatAssistant from './pages/ChatAssistant';
import PrepHub from './pages/PrepHub';
import Logger from './pages/Logger';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import QRHandshake from './pages/QRHandshake';

const navItems = [
    { name: 'Dashboard', icon: 'grid_view', path: '/' },
    { name: 'Your Logs', icon: 'calendar_today', path: '/logs' },
    { name: 'Symptom Log', icon: 'add_notes', path: '/log-new' },
    { name: 'AI Chat Bot', icon: 'smart_toy', path: '/chat' },
    { name: 'Clinical Report', icon: 'medical_information', path: '/prep' },
    { name: 'Profile', icon: 'person', path: '/profile' },
];

const Header = ({ toggleMobileMenu }: { toggleMobileMenu: () => void }) => {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-rose-900/20 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-4 lg:px-10 py-3">
            <div className="flex items-center justify-between max-w-[1400px] mx-auto">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={toggleMobileMenu}
                        className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-rose-950/20 rounded-lg"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <Link to="/" className="flex items-center gap-2">
                        <div className="text-primary">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                                <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor"></path>
                            </svg>
                        </div>
                        <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white">Symra</h1>
                    </Link>
                </div>

                <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-rose-950/20 p-1 rounded-xl">
                    {navItems.map((item) => (
                        <Link 
                            key={item.path}
                            to={item.path}
                            className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all hover:text-primary"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <Link to="/profile" className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
                        <span className="mdi mdi-incognito-circle text-slate-500 dark:text-slate-400 text-2xl"></span>
                        <span className="hidden sm:block text-sm font-bold text-slate-600 dark:text-slate-300">Anonymous User</span>
                    </Link>
                </div>
            </div>
        </header>
    );
};

const MobileMenu = ({ isOpen, closeMenu }: { isOpen: boolean, closeMenu: () => void }) => {
    const location = useLocation();
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] lg:hidden">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeMenu}></div>
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-background-dark shadow-2xl p-6 animate-in slide-in-from-left duration-300">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-black text-primary italic text-2xl">Symra</h2>
                    <button onClick={closeMenu} className="p-2 text-slate-400"><span className="material-symbols-outlined">close</span></button>
                </div>
                <nav className="flex flex-col gap-2">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={closeMenu}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isActive 
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-primary/5'
                                }`}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="text-sm font-bold">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const isQRHandshakePage = location.pathname.startsWith('/qr-handshake');

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans">
            {!isQRHandshakePage && (
                <>
                    <Header toggleMobileMenu={() => setIsMobileMenuOpen(true)} />
                    <MobileMenu isOpen={isMobileMenuOpen} closeMenu={() => setIsMobileMenuOpen(false)} />
                    <Sidebar />
                </>
            )}
            <main className="relative min-h-[calc(100vh-64px)] overflow-x-hidden">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/logs" element={<Timeline />} />
                    <Route path="/chat" element={<ChatAssistant />} />
                    <Route path="/prep" element={<PrepHub />} />
                    <Route path="/log-new" element={<Logger />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/qr-handshake/:reportId?" element={<QRHandshake />} />
                </Routes>
            </main>
            {!isQRHandshakePage && (
                <footer className="p-8 border-t border-slate-200 dark:border-rose-900/20 lg:ml-64 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <p>Symra, RoseHack 2026</p>
                </footer>
            )}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <HealthProvider>
            <Router>
                <AppContent />
            </Router>
        </HealthProvider>
    );
};

export default App;