import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, Settings, LogOut, CheckCircle, Code2 } from 'lucide-react';

export default function TopNav({ currentView, setCurrentView, onSignOut, userProfile }) {
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showToast, setShowToast] = useState(false);

    const profileRef = useRef(null);
    const notifRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileOpen(false);
            }
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim() !== '') {
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            setSearchQuery('');
        }
    };
    return (
        <header className="h-16 bg-[#fbfbfb] border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center space-x-8">
                {/* Logo */}
                <div className="flex items-center space-x-2 text-xl font-bold text-gray-900">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white">
                        <Code2 className="w-5 h-5" />
                    </div>
                    <span>CodePractice.AI</span>
                </div>

                {/* Nav Links */}
                <nav className="hidden md:flex items-center space-x-6 text-md font-medium text-gray-500">
                    <button
                        onClick={() => setCurrentView('Practice')}
                        className={`transition-all pb-1 -mb-[3px] ${currentView === 'Practice' ? 'text-gray-900 border-b-2 border-orange-500 font-bold' : 'hover:text-gray-900 border-b-2 border-transparent'}`}
                    >
                        Practice
                    </button>
                </nav>
            </div>

            <div className="flex items-center space-x-4">


                {/* Notifications Dropdown */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className={`p-2 rounded-full transition-colors relative focus:outline-none ${isNotifOpen ? 'bg-orange-100 text-orange-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full border border-white"></span>
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 transform opacity-100 scale-100 transition-all duration-200">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                                <button className="text-xs text-orange-600 font-medium hover:text-orange-700">Mark all read</button>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">Weekly AI Report Ready!</p>
                                    <p className="text-xs text-gray-500">Your performance analysis for last week is ready.</p>
                                    <span className="text-[10px] font-medium text-gray-400 mt-2 block">2 hours ago</span>
                                </div>
                                <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                                    <p className="text-sm font-semibold text-gray-900 mb-1">New AI Challenge</p>
                                    <p className="text-xs text-gray-500">A new Hard Graph problem was recommended for you.</p>
                                    <span className="text-[10px] font-medium text-gray-400 mt-2 block">1 day ago</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                    <button
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-orange-500 text-white flex items-center justify-center font-medium shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                    >
                        <User className="w-4 h-4" />
                    </button>

                    {isProfileOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 transform opacity-100 scale-100 transition-all duration-200">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <p className="text-sm font-bold text-gray-900">{userProfile?.email?.split('@')[0] || 'User'}</p>
                                <p className="text-xs text-gray-500 truncate">{userProfile?.email || 'user@codepath.ai'}</p>
                            </div>
                            {/* <div className="py-1">
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 font-medium transition-colors flex items-center">
                                    <User className="w-4 h-4 mr-2" /> My Profile
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 font-medium transition-colors flex items-center">
                                    <Settings className="w-4 h-4 mr-2" /> Settings
                                </button>
                            </div> */}
                            <div className="border-t border-gray-100 py-1">
                                <button
                                    onClick={onSignOut}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors flex items-center"
                                >
                                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Simulated Search Toast */}
            {showToast && (
                <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-2xl flex items-center space-x-3 z-50 animate-bounce-short">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <div>
                        <p className="text-sm font-bold">Search Initiated</p>
                        <p className="text-xs text-gray-300">Looking for custom problems...</p>
                    </div>
                </div>
            )}
        </header>
    );
}
