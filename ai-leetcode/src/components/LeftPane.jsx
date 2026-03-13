import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function LeftPane({ dailyProblems, activeProblem, setActiveProblem, setCurrentView }) {

    return (
        <aside className="w-[380px] bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto shrink-0">
            <div className="p-6">
                <div className="text-xs font-semibold text-gray-400 tracking-wider mb-2 uppercase">
                    Practice <span className="mx-1">&rsaquo;</span> Today's Problems
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Daily Practice</h1>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Focus on today's assigned problems. Complete them all to keep your streak alive.
                </p>

                {/* Active Problem Detail View */}
                {activeProblem && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm relative overflow-hidden">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xl font-bold text-gray-900 leading-tight">{activeProblem.title}</h2>
                            <span className={`text-xs flex-shrink-0 font-semibold px-2 py-1 rounded ${activeProblem.difficulty === 'Easy' ? 'text-emerald-600 bg-emerald-50' :
                                activeProblem.difficulty === 'Medium' ? 'text-amber-600 bg-amber-50' :
                                    'text-red-600 bg-red-50'
                                }`}>
                                {activeProblem.difficulty}
                            </span>
                        </div>
                        {activeProblem.topic && (
                            <div className="mb-4">
                                <span className="inline-flex items-center space-x-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    <span>{activeProblem.topic}</span>
                                </span>
                            </div>
                        )}
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed pb-2 border-b border-gray-100 mb-4">
                            {activeProblem.description}
                        </div>
                        <div className="flex justify-start">
                            <button
                                onClick={() => setActiveProblem(null)}
                                className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                ← Back to Problem List
                            </button>
                        </div>
                    </div>
                )}

                {/* Daily Problem List */}
                {!activeProblem && dailyProblems.length > 0 && (
                    <div className="space-y-3">
                        {dailyProblems.map((p, idx) => (
                            <div
                                key={p.id || idx}
                                onClick={() => setActiveProblem(p)}
                                className="border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:bg-orange-50/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 w-6 h-6 flex items-center justify-center rounded-md flex-shrink-0">{idx + 1}</span>
                                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{p.title}</h3>
                                    </div>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded flex-shrink-0 ${p.difficulty === 'Easy' ? 'text-emerald-600 bg-emerald-50' :
                                        p.difficulty === 'Medium' ? 'text-amber-600 bg-amber-50' :
                                            'text-red-600 bg-red-50'
                                        }`}>
                                        {p.difficulty}
                                    </span>
                                </div>
                                <div className="flex items-center space-x-3 text-xs text-gray-500 mb-3 pl-9">
                                    <span className="flex items-center"><svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {p.timeEstimate}</span>
                                    <span className="flex items-center"><svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> {p.topic}</span>
                                </div>
                                {p.aiInsight && (
                                    <div className="bg-orange-50/50 rounded-lg p-3 border border-orange-100 italic text-xs text-gray-600 ml-9">
                                        {p.aiInsight}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!activeProblem && dailyProblems.length === 0 && (
                    <div className="flex flex-col items-center justify-center text-center py-16">
                        <div className="bg-gray-100 p-5 rounded-2xl mb-5">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">No problems assigned</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-xs">Head to the Dashboard to generate a fresh set of practice problems.</p>
                        <button
                            onClick={() => setCurrentView('Dashboard')}
                            className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-sm font-bold py-2.5 px-6 rounded-xl flex items-center transition-all shadow-md hover:shadow-lg"
                        >
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
