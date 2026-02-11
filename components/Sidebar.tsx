
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from '../lib/firebase';

const navItems = [
    { name: 'Dashboard', icon: 'home', path: '/dashboard' },
    { name: 'Your Logs', icon: 'calendar_today', path: '/logs' },
    { name: 'Symptom Log', icon: 'add_notes', path: '/log-new' },
    { name: 'AI Assistant', icon: 'smart_toy', path: '/chat' },
    { name: 'Doctor\'s Prep', icon: 'medical_information', path: '/prep' },
    { name: 'My Profile', icon: 'person', path: '/profile' },
];

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut();
            localStorage.removeItem('anonymous_user');
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <aside className="w-64 hidden lg:flex flex-col bg-white dark:bg-background-dark border-r border-slate-200 dark:border-rose-900/20 h-full fixed left-0 top-0 pt-20 pb-10 px-6 z-40">
            <nav className="flex flex-col gap-2 flex-grow">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                isActive 
                                ? 'bg-primary/10 text-primary border border-primary/20' 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-primary/5 dark:hover:bg-rose-950/20'
                            }`}
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="text-sm font-bold tracking-tight">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
            <div className="pt-6 border-t border-slate-200 dark:border-rose-900/20">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl animate-pulse">🕵️‍♂️</span>
                    <div>
                        <p className="text-sm font-semibold">Incognito Mode</p>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Private Vault</p>
                    </div>
                </div>
                <Link to="/settings" className="w-full py-2 bg-slate-100 dark:bg-rose-950/30 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors mb-2">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                </Link>
                <button 
                    onClick={handleLogout}
                    className="w-full py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
