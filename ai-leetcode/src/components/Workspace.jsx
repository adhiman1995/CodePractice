import React, { useState } from 'react';
import { Settings, Play, Send, Loader2 } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism.css';
import { analyzeCode } from '../services/aiService';

const initialCode = `class Solution:
    def solve(self, input_data):
        # Write your solution here
        pass
`;

export default function Workspace({ activeProblem }) {
    const [code, setCode] = useState(initialCode);
    const [approach, setApproach] = useState('');
    const [language, setLanguage] = useState('Python 3');

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiFeedback, setAiFeedback] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
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

    return (
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
            {/* Toolbar */}
            <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 shrink-0 bg-gray-50/50">
                <div className="flex items-center space-x-3">
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 pl-3 pr-8 py-1.5 rounded-md text-sm font-medium transition-colors border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="Python 3">Python 3</option>
                            <option value="JavaScript">JavaScript</option>
                            <option value="Java">Java</option>
                            <option value="C++">C++</option>
                        </select>
                        <svg className="w-4 h-4 text-gray-500 absolute right-2.5 top-2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={handleSubmit}
                        disabled={isAnalyzing}
                        className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-4 py-1.5 rounded-md text-sm font-semibold transition-colors shadow-sm"
                    >
                        {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        <span>{isAnalyzing ? 'Analyzing...' : 'Submit Solution'}</span>
                    </button>
                </div>
            </div>

            {/* Code Editor Area */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

                {/* Approach Textarea */}
                <div className="flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-200 bg-white">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        1. Your Approach
                    </div>
                    <textarea
                        value={approach}
                        onChange={(e) => setApproach(e.target.value)}
                        placeholder="Explain your algorithmic approach here before coding... (e.g. I will use a two-pointer technique because...)"
                        className="flex-1 w-full p-4 text-sm text-gray-700 resize-none focus:outline-none leading-relaxed"
                    />
                </div>

                {/* Code Editor */}
                <div className="flex-1 flex flex-col bg-gray-50 relative font-mono text-sm">
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200/50 text-xs font-bold text-gray-500 uppercase tracking-wider z-20">
                        2. Your Code
                    </div>
                    <div className="flex-1 overflow-auto relative">
                        <div className="absolute top-0 left-0 w-10 h-full border-r border-gray-200/50 bg-gray-50 z-0"></div>
                        <div className="relative z-10 pl-6 h-full">
                            <Editor
                                value={code}
                                onValueChange={code => setCode(code)}
                                highlight={code => Prism.highlight(code, Prism.languages.python, 'python')}
                                padding={15}
                                style={{
                                    fontFamily: '"Fira Code", "JetBrains Mono", monospace',
                                    fontSize: 14,
                                    minHeight: '100%',
                                    outline: 'none',
                                    backgroundColor: 'transparent'
                                }}
                                textareaClassName="focus:outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Feedback Panel (Shows only when analyzing or results present) */}
            {(isAnalyzing || aiFeedback || error) && (
                <div className="h-64 border-t border-gray-200 bg-white flex flex-col shrink-0">
                    <div className="flex items-center px-4 py-3 border-b border-gray-100 bg-[#fafafa]">
                        <span className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                            <span>AI Feedback</span>
                            <span className="text-amber-500 text-lg leading-none mb-0.5">✨</span>
                        </span>
                    </div>
                    <div className="flex-1 overflow-auto p-5 font-mono text-sm text-gray-600 bg-white">
                        {isAnalyzing ? (
                            <div className="flex items-center text-amber-600">
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                <span>AI is analyzing your approach and code logic...</span>
                            </div>
                        ) : error ? (
                            <div className="text-red-500 font-semibold p-4 bg-red-50 rounded-md border border-red-200">
                                Error: {error}
                            </div>
                        ) : aiFeedback ? (
                            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {aiFeedback}
                            </div>
                        ) : null}
                    </div>
                </div>
            )}
        </div>
    );
}
