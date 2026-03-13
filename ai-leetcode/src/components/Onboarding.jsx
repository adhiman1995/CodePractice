import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Code2, Brain, Rocket, CheckCircle2 } from 'lucide-react';

const LEVELS = [
    { id: 'Beginner', label: 'Beginner', icon: Code2, description: 'New to DSA. I know basic loops and arrays.', color: 'from-emerald-500 to-emerald-600', border: 'border-emerald-200', bg: 'bg-emerald-50' },
    { id: 'Intermediate', label: 'Intermediate', icon: Brain, description: 'Comfortable with trees, recursion, and basic DP.', color: 'from-amber-500 to-amber-600', border: 'border-amber-200', bg: 'bg-amber-50' },
    { id: 'Advanced', label: 'Advanced', icon: Rocket, description: 'Confident with graphs, advanced DP, and system design.', color: 'from-red-500 to-red-600', border: 'border-red-200', bg: 'bg-red-50' },
];

const TOPICS = [
    'Arrays & Hashing', 'Strings', 'Two Pointers', 'Sliding Window',
    'Stacks & Queues', 'Linked Lists', 'Binary Search', 'Trees',
    'Graphs', 'Dynamic Programming', 'Greedy', 'Backtracking',
    'Heaps', 'Tries', 'Bit Manipulation', 'Math'
];

export default function Onboarding({ onComplete }) {
    const [step, setStep] = useState(1);
    const [level, setLevel] = useState('');
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [problemCount, setProblemCount] = useState(3);

    const toggleTopic = (topic) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        );
    };

    const [isFinishing, setIsFinishing] = useState(false);

    const handleFinish = async () => {
        setIsFinishing(true);
        try {
            const profile = {
                level,
                topics: selectedTopics.length > 0 ? selectedTopics : ['Arrays & Hashing', 'Strings', 'Two Pointers'],
                problemsPerDay: problemCount,
                createdAt: new Date().toISOString()
            };
            await onComplete(profile);
        } catch (err) {
            console.error("Finish failed", err);
        } finally {
            setIsFinishing(false);
        }
    };

    const canProceed = () => {
        if (step === 1) return level !== '';
        if (step === 2) return true; // topics are optional, defaults applied
        if (step === 3) return problemCount >= 1 && problemCount <= 5;
        return false;
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-indigo-950 flex items-center justify-center overflow-hidden relative">
            {/* Background decorations */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl"></div>

            <div className="relative z-10 w-full max-w-2xl mx-auto px-6">
                {/* Progress bar */}
                <div className="flex items-center justify-center space-x-3 mb-10">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${s < step ? 'bg-indigo-500 text-white' :
                                    s === step ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/30 scale-110' :
                                        'bg-gray-800 text-gray-500'
                                }`}>
                                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && <div className={`w-16 h-0.5 transition-all duration-500 ${s < step ? 'bg-indigo-500' : 'bg-gray-800'}`}></div>}
                        </div>
                    ))}
                </div>

                {/* Step contents ... */}
                {step === 1 && (
                    <div className="animate-fadeIn">
                        <div className="text-center mb-10">
                            <h1 className="text-4xl font-extrabold text-white mb-3">Welcome to <span className="bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">CodePath AI</span></h1>
                            <p className="text-gray-400 text-lg">Let's personalize your learning journey. What's your current DSA level?</p>
                        </div>
                        <div className="space-y-4">
                            {LEVELS.map(l => (
                                <button
                                    key={l.id}
                                    onClick={() => setLevel(l.id)}
                                    className={`w-full flex items-center p-5 rounded-2xl border-2 transition-all duration-300 text-left group ${level === l.id
                                            ? `border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10`
                                            : 'border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-800/50'
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-5 flex-shrink-0 bg-gradient-to-br ${l.color} shadow-lg`}>
                                        <l.icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-bold ${level === l.id ? 'text-white' : 'text-gray-300'}`}>{l.label}</h3>
                                        <p className="text-sm text-gray-500">{l.description}</p>
                                    </div>
                                    {level === l.id && (
                                        <CheckCircle2 className="w-6 h-6 text-indigo-400 flex-shrink-0 ml-3" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-fadeIn">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-extrabold text-white mb-3">Pick Your Focus Areas</h1>
                            <p className="text-gray-400">Select the DSA topics you want to practice. Leave blank for a broad mix.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {TOPICS.map(topic => (
                                <button
                                    key={topic}
                                    onClick={() => toggleTopic(topic)}
                                    className={`px-4 py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${selectedTopics.includes(topic)
                                            ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300'
                                            : 'border-gray-800 bg-gray-900/50 text-gray-400 hover:border-gray-700 hover:text-gray-300'
                                        }`}
                                >
                                    {selectedTopics.includes(topic) && <span className="mr-1.5">✓</span>}
                                    {topic}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-fadeIn">
                        <div className="text-center mb-10">
                            <h1 className="text-3xl font-extrabold text-white mb-3">Daily Goal</h1>
                            <p className="text-gray-400">How many problems do you want to solve each day?</p>
                        </div>
                        <div className="bg-gray-900/50 border-2 border-gray-800 rounded-2xl p-8 max-w-sm mx-auto">
                            <div className="text-center mb-8">
                                <span className="text-7xl font-extrabold bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">{problemCount}</span>
                                <p className="text-gray-500 text-sm mt-2 font-medium">problems per day</p>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="5"
                                value={problemCount}
                                onChange={(e) => setProblemCount(Number(e.target.value))}
                                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-10">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(step - 1)}
                            disabled={isFinishing}
                            className="flex items-center text-gray-400 hover:text-white font-semibold transition-colors disabled:opacity-50"
                        >
                            <ChevronLeft className="w-5 h-5 mr-1" />
                            Back
                        </button>
                    ) : <div />}

                    {step < 3 ? (
                        <button
                            onClick={() => setStep(step + 1)}
                            disabled={!canProceed()}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold py-3 px-8 rounded-xl flex items-center transition-all shadow-lg hover:shadow-indigo-500/25"
                        >
                            Continue
                            <ChevronRight className="w-5 h-5 ml-1" />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            disabled={isFinishing}
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-700 text-white font-bold py-3 px-8 rounded-xl flex items-center transition-all shadow-lg hover:shadow-orange-500/25"
                        >
                            {isFinishing ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                <Sparkles className="w-5 h-5 mr-2" />
                            )}
                            {isFinishing ? 'Initializing...' : 'Start My Journey'}
                        </button>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
            `}</style>
        </div>
    );
}
