
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
    { name: 'Dashboard', icon: 'home', path: '/' },
    { name: 'Symptom Log', icon: 'add_notes', path: '/log-new' },
    { name: 'AI Assistant', icon: 'smart_toy', path: '/chat' },
    { name: 'Doctor\'s Prep', icon: 'medical_information', path: '/prep' },
    { name: 'My Profile', icon: 'person', path: '/profile' },
];

const Sidebar: React.FC = () => {
    const location = useLocation();

    return (
        <aside className="w-64 hidden lg:flex flex-col bg-white dark:bg-background-dark border-r border-slate-200 dark:border-rose-900/20 h-full fixed left-0 top-0 pt-20 pb-10 px-6">
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
                    <div className="size-10 rounded-full bg-cover bg-center border border-slate-200 dark:border-rose-900/40" style={{ backgroundImage: `url('https://picsum.photos/seed/user/100')` }}></div>
                    <div>
                        <p className="text-sm font-semibold">User Profile</p>
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Private Vault</p>
                    </div>
                </div>
                <Link to="/profile" className="w-full py-2 bg-slate-100 dark:bg-rose-950/30 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary/10 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
