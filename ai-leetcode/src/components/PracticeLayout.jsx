import React, { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronRight, Clock, Tag, Lightbulb, RotateCcw, CheckCircle2, Sparkles, RefreshCw, Maximize2, Minimize2, BookOpen, MessageCircle, Rocket, Award, Plus, Minus } from 'lucide-react';
import API_BASE_URL from '../config';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-java';
import 'prismjs/themes/prism-tomorrow.css';
import '../markdown.css';
import { analyzeCode } from '../services/aiService';
import { markProblemComplete } from '../services/problemStorage';

const LANGUAGE_TEMPLATES = {
    'Python 3': `class Solution:\n    def solve(self, input_data):\n        # Write your solution here\n        pass\n`,
    'JavaScript': `/**\n * @param {*} input\n * @return {*}\n */\nvar solve = function(input) {\n    // Write your solution here\n};\n`,
    'Java': `class Solution {\n    public Object solve(Object input) {\n        // Write your solution here\n        return null;\n    }\n}\n`,
    'C++': `class Solution {\npublic:\n    // Write your solution here\n};\n`,
};

const PRISM_LANGS = {
    'Python 3': 'python',
    'JavaScript': 'javascript',
    'Java': 'java',
    'C++': 'cpp',
};

import { saveTodaysProblems, getTodayKey, areAllProblemsComplete, hasTodaysProblems } from '../services/problemStorage';

export default function PracticeLayout({ dailyProblems, activeProblem, setActiveProblem, setCurrentView, setDailyProblems, allProblems, setAllProblems, userProfile, authToken }) {
    const [language, setLanguage] = useState('Python 3');
    const [code, setCode] = useState(LANGUAGE_TEMPLATES['Python 3']);
    const [approach, setApproach] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [error, setError] = useState(null);
    const [isFeedbackExpanded, setIsFeedbackExpanded] = useState(false);
    const [feedbackHeight, setFeedbackHeight] = useState(280);
    const isResizing = useRef(false);
    const [cursorLine, setCursorLine] = useState(1);
    const [cursorCol, setCursorCol] = useState(1);
    const [expandedFeedback, setExpandedFeedback] = useState({});

    // AI Generator State
    const levelToDifficulty = { Beginner: 'Easy', Intermediate: 'Medium', Advanced: 'Hard' };
    const [problemCount, setProblemCount] = useState(userProfile?.profile?.problemsPerDay || 5);
    const [difficulty, setDifficulty] = useState(levelToDifficulty[userProfile?.profile?.level] || 'Medium');
    const [domain, setDomain] = useState('DSA'); // 'DSA', 'ML', 'DL'
    const [subtopic, setSubtopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Auto-select first problem if none selected
    useEffect(() => {
        if (!activeProblem && dailyProblems && dailyProblems.length > 0) {
            setActiveProblem(dailyProblems[0]);
        }
    }, [dailyProblems, activeProblem, setActiveProblem]);

    // Sync code when problem Changes
    useEffect(() => {
        if (activeProblem) {
            const starter = activeProblem?.starterCode?.[language] || LANGUAGE_TEMPLATES[language];
            setCode(starter);
        }
    }, [activeProblem?.id]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/problems/generateBatch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    topic: subtopic || domain,
                    difficulty,
                    count: problemCount
                })
            });

            if (res.ok) {
                const generatedBatch = await res.json();
                if (Array.isArray(generatedBatch) && generatedBatch.length > 0) {
                    const today = getTodayKey();
                    const taggedBatch = generatedBatch.map(p => ({ ...p, generatedDate: today }));
                    saveTodaysProblems(taggedBatch);
                    setDailyProblems(taggedBatch);

                    // Update global history list
                    if (setAllProblems) {
                        setAllProblems(prev => {
                            const filtered = prev.filter(p => p.generatedDate !== today);
                            return [...taggedBatch, ...filtered];
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Generator failed", err);
        } finally {
            setIsGenerating(false);
        }
    };

    // ... rest of the existing useEffect and handlers (MouseMove, startResizing, renderAiReview, renderSimpleFeedback etc.) stay mostly same but for brevity I will keep the important bits ...

    // Initial resize listeners
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing.current) return;
            const newHeight = window.innerHeight - e.clientY;
            if (newHeight > 100 && newHeight < window.innerHeight * 0.8) {
                setFeedbackHeight(newHeight);
            }
        };

        const handleMouseUp = () => {
            isResizing.current = false;
            document.body.style.cursor = 'default';
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const startResizing = (e) => {
        e.preventDefault();
        isResizing.current = true;
        document.body.style.cursor = 'row-resize';
    };

    const renderAiReview = (jsonData) => {
        if (!jsonData) return null;
        let data;
        try {
            data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        } catch (e) {
            return renderSimpleFeedback(jsonData);
        }

        const getStatusColor = (status) => {
            if (status === 'Optimal') return 'text-emerald-500';
            if (status === 'Suboptimal') return 'text-orange-500';
            return 'text-red-500';
        };

        const getIconForType = (type) => {
            switch (type) {
                case 'algorithm': return <Lightbulb className="w-5 h-5 text-emerald-500" />;
                case 'optimization': return <Sparkles className="w-5 h-5 text-orange-500" />;
                case 'edge-case': return <MessageCircle className="w-5 h-5 text-blue-500" />;
                default: return <BookOpen className="w-5 h-5 text-indigo-500" />;
            }
        };

        return (
            <div className="space-y-8 animate-fadeIn text-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Efficiency Score</span>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-4xl font-extrabold text-gray-900">{data.efficiencyScore}</span>
                            <span className="text-xs font-bold text-gray-400">/100 {data.scoreDelta && <span className="text-emerald-500 ml-1">{data.scoreDelta}</span>}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: `${data.efficiencyScore}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Time Complexity</span>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-3xl font-extrabold text-gray-900 leading-none">{data.timeComplexity?.value}</span>
                            <span className={`text-[10px] font-bold uppercase ${getStatusColor(data.timeComplexity?.status)}`}>{data.timeComplexity?.status}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium leading-tight">{data.timeComplexity?.note}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Space Complexity</span>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-3xl font-extrabold text-gray-900 leading-none">{data.spaceComplexity?.value}</span>
                            <span className={`text-[10px] font-bold uppercase ${getStatusColor(data.spaceComplexity?.status)}`}>{data.spaceComplexity?.status}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium leading-tight">{data.spaceComplexity?.note}</p>
                    </div>
                </div>
                <div className="space-y-4 pt-4">
                    {data.detailedFeedback?.map((item, idx) => {
                        const isExpanded = expandedFeedback[idx] !== false;
                        return (
                            <div key={idx} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setExpandedFeedback(prev => ({ ...prev, [idx]: !isExpanded }))}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left group"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-gray-50 p-2 rounded-xl">{getIconForType(item.type)}</div>
                                        <span className="text-lg font-bold text-gray-800">{item.title}</span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                </button>
                                {isExpanded && (
                                    <div className="px-20 pb-6 animate-fadeIn">
                                        <p className="text-gray-600 text-[15px] leading-relaxed whitespace-pre-wrap">{item.content}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
                {data.optimalSolution && renderSimpleFeedback("### Optimal Solution\n```" + (PRISM_LANGS[language] || 'javascript') + "\n" + data.optimalSolution + "\n```")}
            </div>
        );
    };

    const renderSimpleFeedback = (text) => {
        if (!text) return null;
        const trimmed = text.trim();
        if (trimmed.startsWith('{') && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
            try { return renderAiReview(JSON.parse(trimmed)); } catch (e) { }
        }
        const parseInline = (line) => {
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <span key={i} className="text-white font-bold">{part.slice(2, -2)}</span>;
                }
                return part;
            });
        };
        const blocks = text.split(/(```[\s\S]*?```)/g);
        return blocks.map((block, index) => {
            if (block.startsWith('```')) {
                const match = /```(\w+)?\n([\s\S]*?)```/.exec(block);
                const lang = match ? match[1] || 'javascript' : 'javascript';
                const codeContent = match ? match[2].trim() : block.replace(/```/g, '').trim();
                const displayLang = lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1);
                return (
                    <div key={index} className="my-8 rounded-xl overflow-hidden border border-gray-700 shadow-2xl bg-[#1e1e2e]">
                        <div className="bg-[#212122ff] px-5 py-3 flex justify-between items-center border-b border-gray-700">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">{displayLang} Implementation</span>
                            </div>
                            <button onClick={() => navigator.clipboard.writeText(codeContent)} className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />Copy Code</button>
                        </div>
                        <pre className="p-6 overflow-x-auto text-sm md:text-base leading-relaxed"><code dangerouslySetInnerHTML={{ __html: Prism.highlight(codeContent, Prism.languages[lang] || Prism.languages[PRISM_LANGS[language]] || Prism.languages.javascript || Prism.languages.clike, lang) }} /></pre>
                    </div>
                );
            } else {
                const lines = block.split('\n');
                return (
                    <div key={index} className="space-y-1">
                        {lines.map((line, i) => {
                            const trimmedLine = line.trim();
                            if (trimmedLine === '') return <div key={i} className="h-4"></div>;
                            if (trimmedLine.startsWith('###')) {
                                return (<h3 key={i} className="text-xl font-bold text-orange-400 mt-10 mb-6 flex items-center"><span className="w-1.5 h-6 bg-orange-500 rounded-full mr-3"></span>{trimmedLine.replace(/###/g, '').trim()}</h3>);
                            }
                            if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                                return (<div key={i} className="flex items-start gap-4 mb-3 ml-1"><div className="w-1.5 h-1.5 rounded-full bg-orange-500/60 mt-2.5 shrink-0"></div><p className="text-gray-300 text-[15px] leading-relaxed">{parseInline(trimmedLine.replace(/^[-*]/g, '').trim())}</p></div>);
                            }
                            return (<p key={i} className="text-gray-300 text-[15px] leading-relaxed mb-4">{parseInline(line)}</p>);
                        })}
                    </div>
                );
            }
        });
    };

    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        const starter = activeProblem?.starterCode?.[lang] || LANGUAGE_TEMPLATES[lang];
        setCode(starter);
        setAiFeedback(null);
        setError(null);
    };

    const handleProblemSelect = (problem) => {
        setActiveProblem(problem);
        setAiFeedback(null);
        setError(null);
        setApproach('');
    };

    const handleMarkDone = async () => {
        if (!activeProblem) return;
        const updated = markProblemComplete(activeProblem.id);
        if (updated) {
            setDailyProblems(updated);
            setActiveProblem(prev => ({ ...prev, isCompleted: true }));
            // Also update history view
            if (setAllProblems) {
                setAllProblems(prev => prev.map(p => p.id === activeProblem.id ? { ...p, isCompleted: true } : p));
            }
        }
    };

    const handleSubmit = async () => {
        if (!activeProblem) return;
        setIsAnalyzing(true);
        setAiFeedback(null);
        setError(null);
        try {
            const feedback = await analyzeCode(code, activeProblem.description, language, approach);
            setAiFeedback(feedback);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleCodeChange = (newCode) => {
        setCode(newCode);
        const lines = newCode.split('\n').length;
        setCursorLine(lines);
    };

    const handleKeyDown = (e) => {
        const { key, target } = e;
        const { selectionStart, selectionEnd, value } = target;
        if (key === 'Tab') {
            e.preventDefault();
            const newCode = value.substring(0, selectionStart) + "    " + value.substring(selectionEnd);
            setCode(newCode);
            setTimeout(() => { target.selectionStart = target.selectionEnd = selectionStart + 4; }, 0);
        }
        if (key === 'Enter') {
            const beforeCursor = value.substring(0, selectionStart);
            const lines = beforeCursor.split('\n');
            const currentLine = lines[lines.length - 1];
            const indentationMatch = currentLine.match(/^(\s*)/);
            const indentation = indentationMatch ? indentationMatch[0] : '';
            let extraIndentation = '';
            const trimmedLine = currentLine.trim();
            if (trimmedLine.endsWith(':') || trimmedLine.endsWith('{') || trimmedLine.endsWith('(') || (language === 'C++' && trimmedLine.endsWith('public:'))) {
                extraIndentation = '    ';
            }
            if (indentation || extraIndentation) {
                e.preventDefault();
                const newCode = value.substring(0, selectionStart) + '\n' + indentation + extraIndentation + value.substring(selectionEnd);
                setCode(newCode);
                setTimeout(() => { target.selectionStart = target.selectionEnd = selectionStart + 1 + indentation.length + extraIndentation.length; }, 0);
            }
        }
    };

    const difficultyStyle = (d) => {
        if (d === 'Easy') return 'text-emerald-600 bg-emerald-50 border border-emerald-200';
        if (d === 'Medium') return 'text-amber-600 bg-amber-50 border border-amber-200';
        return 'text-red-600 bg-red-50 border border-red-200';
    };

    return (
        <div className="flex flex-1 h-full overflow-hidden" style={{ background: '#f8f9fa' }}>

            {/* ── LEFT SIDEBAR: Integrated Command Center ── */}
            <aside className="w-96 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

                {/* AI Generator Integration */}
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <h2 className="text-[14px] font-black text-gray-900 uppercase tracking-widest">Coding Problem Generator</h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Domain Selector */}
                        <div className="flex items-center gap-1.5 p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                            {[
                                { id: 'DSA', label: 'Algorithms' },
                                { id: 'ML', label: 'ML' },
                                { id: 'DL', label: 'Deep Learning' }
                            ].map(d => (
                                <button
                                    key={d.id}
                                    onClick={() => setDomain(d.id)}
                                    className={`flex-1 py-1.5 rounded-md text-[12px] font-black uppercase transition-all ${domain === d.id
                                        ? 'bg-orange-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                        }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>

                        {/* Topic Input */}
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder={`Specific topic (e.g. ${domain === 'DSA' ? 'Recursion' : domain === 'ML' ? 'Linear Regression' : 'Transformers'})`}
                                value={subtopic}
                                onChange={(e) => setSubtopic(e.target.value)}
                                className="w-full h-10 px-4 bg-white border border-gray-200 rounded-lg text-[13px] font-medium placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg border border-gray-100 shadow-sm">
                            {['Easy', 'Medium', 'Hard'].map(lvl => (
                                <button
                                    key={lvl}
                                    onClick={() => setDifficulty(lvl)}
                                    className={`flex-1 py-1.5 rounded-md text-[12px] font-black uppercase transition-all ${difficulty === lvl
                                        ? 'bg-gray-600 text-white shadow-sm'
                                        : 'text-gray-600 hover:text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {lvl}
                                </button>
                            ))}
                        </div>

                        {/* Problem Count Stepper */}
                        <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 shadow-sm">
                            <span className="text-[12px] font-black text-gray-600 uppercase tracking-widest ml-1">Batch Size</span>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setProblemCount(Math.max(1, problemCount - 1))}
                                    className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all active:scale-90"
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-black text-gray-900 min-w-[12px] text-center">{problemCount}</span>
                                <button
                                    onClick={() => setProblemCount(Math.min(10, problemCount + 1))}
                                    className="w-6 h-6 flex items-center justify-center rounded-md border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-indigo-600 transition-all active:scale-90"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white h-10 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/10 active:scale-95 disabled:opacity-50"
                        >
                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> <span className="text-xs text-white uppercase tracking-widest ml-1">Generate Problems</span></>}
                        </button>
                    </div>
                </div>

                {/* View Toggles */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setShowHistory(false)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${!showHistory ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                    >
                        Active Tasks
                    </button>
                    <button
                        onClick={() => setShowHistory(true)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${showHistory ? 'text-indigo-600 border-indigo-600 bg-white' : 'text-gray-400 border-transparent hover:text-gray-600'}`}
                    >
                        History
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {!showHistory ? (
                        /* Active tasks list */
                        dailyProblems.length === 0 ? (
                            <div className="text-center py-20 opacity-40">
                                <Rocket className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                                <p className="text-[11px] font-black uppercase tracking-[0.2em]">Generate Problems to Solve!</p>
                            </div>
                        ) : dailyProblems.map((p, idx) => {
                            const isActive = activeProblem?.id === p.id;
                            const isDone = p.isCompleted;
                            return (
                                <button
                                    key={p.id || idx}
                                    onClick={() => handleProblemSelect(p)}
                                    className={`w-full text-left rounded-lg p-4 transition-all border ${isActive
                                        ? 'bg-indigo-50/50 border-orange-400 shadow-sm ring-1 ring-orange-400'
                                        : isDone
                                            ? 'bg-emerald-50/30 border-emerald-100/50 opacity-60'
                                            : 'bg-white border-gray-200 hover:border-orange-400 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            {isDone
                                                ? <CheckCircle2 className="w-5 h-5 text-orange-500" />
                                                : <div className={`w-5 h-5 rounded-md text-[9px] font-black flex items-center justify-center ${isActive ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>{idx + 1}</div>
                                            }
                                            <span className={`text-[12px] font-black px-1.5 py-0.5 rounded shadow-sm ${difficultyStyle(p.difficulty)}`}>{p.difficulty}</span>
                                        </div>
                                    </div>
                                    <p className={`text-[14px] font-black leading-tight ${isDone ? 'text-emerald-800 line-through opacity-50' : isActive ? 'text-indigo-900' : 'text-gray-900'}`}>{p.title}</p>
                                    <div className="flex items-center gap-3 mt-3">
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{p.timeEstimate}</span>
                                        <span className="text-[12px] font-bold text-gray-300 uppercase tracking-widest">•</span>
                                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest truncate">{p.topic}</span>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        /* History list */
                        (allProblems || []).length === 0 ? (
                            <div className="text-center py-20 opacity-40">
                                <Award className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                                <p className="text-[11px] font-black uppercase tracking-[0.2em]">No Records</p>
                            </div>
                        ) : allProblems.map((p, idx) => (
                            <button
                                key={p.id || idx}
                                onClick={() => handleProblemSelect(p)}
                                className={`w-full text-left rounded-xl p-4 transition-all border ${activeProblem?.id === p.id ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-50 hover:border-gray-100 opacity-80'}`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${difficultyStyle(p.difficulty)}`}>{p.difficulty}</span>
                                    {p.isCompleted && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                </div>
                                <p className="text-[13px] font-black text-gray-800 line-clamp-1">{p.title}</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">{p.generatedDate || 'Archive'}</p>
                            </button>
                        ))
                    )}
                </div>
            </aside>

            {/* ── CENTER + RIGHT PANELS ── */}
            <div className="flex flex-1 overflow-hidden">
                {activeProblem ? (
                    <div className="flex flex-1 overflow-hidden">

                        {/* ── CENTER: Problem Description ── */}
                        <div className="w-[42%] shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
                            {/* Problem Header */}
                            <div className="px-6 py-5 border-b border-gray-100 shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${difficultyStyle(activeProblem.difficulty)}`}>
                                        {activeProblem.difficulty}
                                    </span>
                                    <div className="flex items-center text-xs text-gray-400 space-x-4">
                                        {activeProblem.timeEstimate && (
                                            <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5" />{activeProblem.timeEstimate}</span>
                                        )}
                                        {activeProblem.topic && (
                                            <span className="flex items-center gap-1.5 font-medium"><Tag className="w-3.5 h-3.5" />{activeProblem.topic}</span>
                                        )}
                                    </div>
                                </div>
                                <h1 className="text-2xl font-extrabold text-gray-900 leading-tight tracking-tight">{activeProblem.title}</h1>
                            </div>

                            {/* Scrollable Problem Body */}
                            <div className="flex-1 overflow-y-auto">
                                <div className="px-6 py-5 space-y-7">

                                    {/* Problem Statement */}
                                    <div>
                                        {/* <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Problem Statement</h2> */}
                                        <p className="text-xl text-gray-800 leading-relaxed whitespace-pre-wrap">
                                            {activeProblem.statement || activeProblem.description}
                                        </p>
                                    </div>

                                    {/* Examples / Test Cases */}
                                    {activeProblem.examples && activeProblem.examples.length > 0 ? (
                                        <div>
                                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Examples</h2>
                                            <div className="space-y-3">
                                                {activeProblem.examples.map((ex, i) => (
                                                    <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                                                        <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-200">
                                                            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Example {i + 1}</span>
                                                        </div>
                                                        <div className="p-4 space-y-2 font-mono text-sm">
                                                            <div className="flex items-start gap-3">
                                                                <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider w-16 shrink-0 pt-0.5">Input</span>
                                                                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm flex-1 break-all">{ex.input}</code>
                                                            </div>
                                                            <div className="flex items-start gap-3">
                                                                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider w-16 shrink-0 pt-0.5">Output</span>
                                                                <code className="bg-emerald-50 text-emerald-800 px-2 py-1 rounded text-sm flex-1 break-all border border-emerald-100">{ex.output}</code>
                                                            </div>
                                                            {ex.explanation && (
                                                                <div className="flex items-start gap-3 pt-1">
                                                                    <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider w-16 shrink-0 pt-0.5">Why</span>
                                                                    <p className="text-gray-600 text-sm leading-relaxed flex-1">{ex.explanation}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        /* Fallback: parse examples from flat description */
                                        activeProblem.description && activeProblem.description.includes('Example') && (
                                            <div>
                                                <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Examples</h2>
                                                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                                                    <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-mono">{
                                                        activeProblem.description.split('\n')
                                                            .filter(l => l.toLowerCase().includes('example') || l.toLowerCase().includes('input') || l.toLowerCase().includes('output'))
                                                            .join('\n')
                                                    }</pre>
                                                </div>
                                            </div>
                                        )
                                    )}

                                    {/* Constraints */}
                                    {activeProblem.constraints && (
                                        <div>
                                            <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Constraints</h2>
                                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                                <ul className="space-y-1.5">
                                                    {activeProblem.constraints.split(/,|\n/).map((c, i) => c.trim() && (
                                                        <li key={i} className="flex items-center gap-2 text-sm font-mono text-blue-900">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                                                            {c.trim()}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}

                                    {/* AI Insight Card */}
                                    {activeProblem.aiInsight && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">AI Insight</span>
                                            </div>
                                            <p className="text-sm text-amber-900 leading-relaxed">{activeProblem.aiInsight}</p>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Code Panel (Dark Theme) ── */}
                        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#2e2e2eff' }}>

                            {/* Toolbar */}
                            <div className="h-12 border-b flex items-center justify-between px-4 shrink-0" style={{ borderColor: '#2e2e2eff', background: '#2e2e2eff' }}>
                                <div className="flex items-center space-x-2">
                                    {/* Language Selector */}
                                    <div className="flex items-center space-x-1 bg-gray-700/50 border border-gray-600 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-200 cursor-pointer hover:bg-gray-600/50 transition-colors">
                                        <select
                                            value={language}
                                            onChange={(e) => handleLanguageChange(e.target.value)}
                                            className="bg-transparent text-gray-200 text-xs font-semibold focus:outline-none cursor-pointer"
                                            style={{ appearance: 'none' }}
                                        >
                                            {Object.keys(LANGUAGE_TEMPLATES).map(l => <option key={l} style={{ background: '#2a2a3e' }}>{l}</option>)}
                                        </select>
                                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                    <button
                                        onClick={() => setCode(LANGUAGE_TEMPLATES[language])}
                                        title="Reset Code"
                                        className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-700/50 rounded-lg transition-colors"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="flex items-center space-x-2">
                                    {!activeProblem?.isCompleted ? (
                                        <button
                                            onClick={handleMarkDone}
                                            className="flex items-center space-x-1.5 bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded-md text-xs font-bold transition-colors shadow-lg shadow-emerald-900/30"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>MARK AS DONE</span>
                                        </button>
                                    ) : (
                                        <span className="flex items-center space-x-1.5 text-emerald-400 text-xs font-bold bg-emerald-900/30 px-3 py-2 rounded-lg border border-emerald-700">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>COMPLETED</span>
                                        </span>
                                    )}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isAnalyzing}
                                        className="flex items-center space-x-1.5 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-800 disabled:text-orange-500 text-white px-4 py-2 rounded-md text-xs font-bold transition-colors shadow-lg shadow-orange-900/30"
                                    >
                                        {isAnalyzing
                                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            : <Sparkles className="w-3.5 h-3.5" />
                                        }
                                        <span>{isAnalyzing ? 'Analyzing...' : 'AI REVIEW'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* APPROACH Section */}
                            <div className="shrink-0 px-4 pt-4 pb-3" >
                                <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#2a2a3e', background: '#212122ff' }}>
                                    <div className="px-3 py-2 flex items-center space-x-2" >
                                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        <span className="text-[14px] font-bold tracking-widest uppercase" style={{ color: '#afafb1ff' }}>Approach</span>
                                    </div>
                                    <textarea
                                        value={approach}
                                        onChange={(e) => setApproach(e.target.value)}
                                        placeholder="Describe your approach before coding..."
                                        rows={4}
                                        className="w-full px-4 py-3 text-lg resize-none focus:outline-none"
                                        style={{

                                            color: '#b2b2b2ff',
                                            fontFamily: 'inherit',
                                            lineHeight: '1.6',
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Code Editor */}
                            <div className="flex-1 overflow-auto relative" >
                                {/* Line numbers + editor wrapper */}
                                <div className="flex min-h-full">
                                    {/* Line Numbers */}
                                    <div
                                        className="select-none shrink-0 pt-4 pb-4 px-3 text-right"
                                        style={{

                                            color: '#444466',
                                            fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                                            fontSize: 18,
                                            lineHeight: '1.7',
                                            minWidth: '48px',
                                            borderRight: '1px solid #2a2a3e',
                                            userSelect: 'none'
                                        }}
                                    >
                                        {code.split('\n').map((_, i) => (
                                            <div key={i}>{i + 1}</div>
                                        ))}
                                    </div>

                                    {/* Actual Editor */}
                                    <div className="flex-1">
                                        <Editor
                                            value={code}
                                            onValueChange={handleCodeChange}
                                            onKeyDown={handleKeyDown}
                                            highlight={c =>
                                                Prism.highlight(
                                                    c,
                                                    Prism.languages[PRISM_LANGS[language]] || Prism.languages.python || Prism.languages.javascript || Prism.languages.clike,
                                                    PRISM_LANGS[language] || 'python'
                                                )
                                            }
                                            padding={16}
                                            style={{
                                                fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
                                                fontSize: 18,
                                                minHeight: '100%',
                                                outline: 'none',
                                                lineHeight: '1.7',
                                                background: 'transparent',
                                                color: '#cdd6f4',
                                            }}
                                            textareaClassName="focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* AI Feedback Panel */}
                            {(isAnalyzing || aiFeedback || error) && (
                                <div
                                    className={`shrink-0 flex flex-col border-t relative`}
                                    style={{
                                        borderColor: '#2a2a3e',
                                        background: '#171719ff',
                                        height: isFeedbackExpanded ? '70%' : `${feedbackHeight}px`,
                                        maxHeight: '85%'
                                    }}
                                >
                                    {/* Resize Handle */}
                                    {!isFeedbackExpanded && (
                                        <div
                                            onMouseDown={startResizing}
                                            className="absolute top-0 left-0 right-0 h-1 cursor-row-resize hover:bg-orange-500/50 transition-colors z-50"
                                        ></div>
                                    )}

                                    <div className="flex items-center justify-between px-4 py-2 shrink-0 border-b bg-[#212122ff]" style={{ borderColor: '#2a2a3e' }}>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                                            <span className="text-sm font-bold text-gray-200 uppercase tracking-widest">AI Tutor Analysis</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            {aiFeedback && !isAnalyzing && (
                                                <button
                                                    onClick={() => {
                                                        const panel = document.getElementById('ai-feedback-scroll');
                                                        if (panel) {
                                                            const solutionEl = panel.querySelector('h3:last-of-type') || panel.querySelector('.rounded-xl');
                                                            if (solutionEl) solutionEl.scrollIntoView({ behavior: 'smooth' });
                                                            else panel.scrollTo({ top: panel.scrollHeight, behavior: 'smooth' });
                                                        }
                                                    }}
                                                    className="flex items-center space-x-1.5 bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 px-3 py-1.5 rounded-md text-[11px] font-extrabold transition-all border border-orange-500/30"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    <span>VIEW SOLUTION</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setIsFeedbackExpanded(!isFeedbackExpanded)}
                                                className="text-gray-400 hover:text-white transition-colors p-1"
                                                title={isFeedbackExpanded ? "Restore" : "Maximize"}
                                            >
                                                {isFeedbackExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                            </button>
                                            <button onClick={() => { setAiFeedback(null); setError(null); setIsFeedbackExpanded(false); }} className="text-gray-400 hover:text-white p-1">
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div id="ai-feedback-scroll" className="flex-1 overflow-auto p-8" style={{ color: '#e1e1e6' }}>
                                        {isAnalyzing ? (
                                            <div className="flex flex-col items-center justify-center h-full space-y-6">
                                                <div className="relative">
                                                    <div className="w-16 h-16 border-4 border-orange-500/10 rounded-full animate-ping absolute"></div>
                                                    <Loader2 className="w-16 h-16 animate-spin text-orange-500 relative z-10" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xl font-bold text-white mb-2">Analyzing your code...</p>
                                                    <p className="text-gray-400 text-sm">Evaluating logic and preparing optimal solution</p>
                                                </div>
                                            </div>
                                        ) : error ? (
                                            <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl text-red-400">
                                                <p className="font-bold flex items-center mb-2"><RotateCcw className="w-4 h-4 mr-2" /> Analysis Failed</p>
                                                <p className="text-sm opacity-80">{error}</p>
                                            </div>
                                        ) : (
                                            <div className="max-w-4xl mx-auto pb-10">
                                                {renderSimpleFeedback(aiFeedback)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Status Bar */}
                            <div
                                className="shrink-0 h-6 flex items-center justify-between px-4 text-[10px] font-medium border-t"
                                style={{ background: '#2e2e2eff ', borderColor: '#2e2e2eff', color: '#adadadff' }}
                            >
                                <div className="flex items-center space-x-3">
                                    <span>Tab Size: 4</span>
                                    <span>UTF-8</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <span>Line {cursorLine}, Col {cursorCol}</span>
                                </div>
                            </div>
                        </div>

                    </div >
                ) : (
                    /* No Problem Selected */
                    <div className="flex-1 flex items-center justify-center" style={{ background: '#f8f9fa' }}>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ChevronRight className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-500 mb-2">Select a problem to start</h3>
                            <p className="text-sm text-gray-400">Choose from today's practice problems on the left</p>
                            {dailyProblems.length === 0 && (
                                <button
                                    onClick={() => setCurrentView('Dashboard')}
                                    className="mt-5 bg-indigo-600 text-white text-sm font-bold py-2.5 px-6 rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    Generate Problems →
                                </button>
                            )}
                        </div>
                    </div>
                )
                }
            </div >
        </div >
    );
}
