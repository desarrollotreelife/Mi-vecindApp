import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Outlet } from 'react-router-dom';
import { WelcomeBanner } from '../common/WelcomeBanner';

export const Layout: React.FC = () => {
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
            <WelcomeBanner />
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content Area */}
            <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
                <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                <main className="w-full flex-grow p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};
