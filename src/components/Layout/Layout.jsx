import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import FloatingChat from '../AI/FloatingChat';

const Layout = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-24 md:pb-8">
                    <Outlet />
                </main>
            </div>

            {/* Bottom Navigation - Visible only on mobile */}
            <BottomNav />

            {/* Floating AI Chat */}
            <FloatingChat />
        </div>
    );
};

export default Layout;
