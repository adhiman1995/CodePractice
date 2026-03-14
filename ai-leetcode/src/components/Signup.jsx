import React, { useState } from 'react';
import { Mail, Lock, Sparkles, ArrowRight, Loader2, UserPlus, Code2 } from 'lucide-react';
import API_BASE_URL from '../config';

export default function Signup({ setAuthToken, setUserProfile, onNavigateToLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSignup = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('codepath_token', data.access_token);
                localStorage.setItem('codepath_user', JSON.stringify(data.user)); // Store full user object
                setAuthToken(data.access_token);
                setUserProfile(data.user);
            } else {
                const errorData = await res.json().catch(() => ({}));
                setError(errorData.message || 'Registration failed. User may already exist.');
            }
        } catch (err) {
            setError('Failed to connect to the server');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-full bg-orange-400 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-white/10 rounded-full -translate-y-1/2 -translate-x-1/2 blur-[120px]"></div>
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-black/5 rounded-full translate-y-1/2 translate-x-1/2 blur-[100px]"></div>

            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-10 relative z-10 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.2)]">
                <div className="flex flex-col items-center mb-10">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-indigo-500/10 rounded-xl blur-xl"></div>
                        <div className="relative w-16 h-16 bg-gradient-to-tr from-orange-600 to-orange-500 rounded-xl flex items-center justify-center shadow-lg transform transition-transform duration-500 hover:scale-105">
                            <Code2 className="w-10 h-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tighter flex items-center">
                        CodePractice<span className="text-orange-500 text-4xl">.</span>AI
                    </h1>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">Join the Mastery</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 text-[13px] font-bold p-4 rounded-2xl flex items-center animate-shake">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-3"></span>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Email</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-indigo-600">
                                <Mail className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl leading-5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600/50 sm:text-sm transition-all duration-300"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 group-focus-within:text-indigo-600">
                                <Lock className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl leading-5 text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-600/50 sm:text-sm transition-all duration-300"
                                placeholder="Min. 6 Characters"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full flex items-center justify-center py-4 px-4 rounded-2xl shadow-xl shadow-orange-500/20 text-sm font-bold uppercase tracking-widest text-white bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-300 group active:scale-[0.98]"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-3" /> : <></>}
                        {isLoading ? 'Registering...' : 'Register'}
                        {!isLoading && <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                        Already Registered?{' '}
                        <button onClick={onNavigateToLogin} className="text-orange-500 hover:text-orange-600 transition-colors ml-1">
                            Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
