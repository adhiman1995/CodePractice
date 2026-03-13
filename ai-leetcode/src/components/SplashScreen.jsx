import React, { useEffect, useState } from 'react';
import { Code2, Sparkles } from 'lucide-react';

export default function SplashScreen({ onComplete }) {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) {
                setTimeout(onComplete, 500); // Wait for fade out animation
            }
        }, 2500);

        const progressInterval = setInterval(() => {
            setProgress(prev => Math.min(prev + 1, 100));
        }, 20);

        return () => {
            clearTimeout(timer);
            clearInterval(progressInterval);
        };
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f172a] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Background Decorative Elements */}
            <div className="absolute top-1/4 -left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative flex flex-col items-center">
                {/* Logo Animation */}
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-orange-500 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative w-24 h-24 bg-gradient-to-tr from-orange-500 to-orange-400 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-500 overflow-hidden group">
                        <Code2 className="w-12 h-12 text-white relative z-10" />
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    </div>
                    {/* Floating Sparkle Icons */}
                    <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-orange-400 animate-bounce" style={{ animationDuration: '3s' }} />
                </div>

                {/* Branding */}
                <h1 className="text-4xl font-black text-white tracking-tighter mb-2 flex items-center">
                    CodePractice<span className="text-orange-500 text-5xl">.</span>AI
                </h1>

                {/* Loading Bar */}
                <div className="w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden relative border border-gray-700/50">
                    <div
                        className="h-full bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600 bg-[length:200%_100%] transition-all duration-300 ease-out"
                        style={{
                            width: `${progress}%`,
                            animation: 'shimmer 2s infinite linear'
                        }}
                    ></div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-2">
                    <span className="text-[12px] font-black text-orange-500/80">{progress}%</span>
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
            `}</style>
        </div>
    );
}
