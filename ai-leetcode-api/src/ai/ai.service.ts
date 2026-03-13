import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Groq } from 'groq-sdk';

@Injectable()
export class AiService {
    private readonly logger = new Logger(AiService.name);
    private groq: Groq;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('GROQ_API_KEY') || this.configService.get<string>('VITE_GROQ_API_KEY');
        if (!apiKey) {
            this.logger.warn('GROQ_API_KEY is not defined in environment variables.');
        }

        // Initialize Groq client
        this.groq = new Groq({ apiKey });
    }

    async analyzeCode(code: string, problemDescription: string, language: string, approach: string): Promise<string> {
        const systemPrompt = `You are an elite AI Coding Tutor. Your goal is to guide the user to become a better engineer by analyzing their thought process (approach) and their implementation (code).

The user is tackling this problem:
"${problemDescription}"

They are using: ${language}

User's Logical Approach:
"""
${approach || 'No approach provided.'}
"""

User's Submitted Code:
"""
${code}
"""

Your Analysis must follow this structure:
1. **### 🧠 Approach Evaluation**: Critique their logic. Is the time/space complexity optimal? Did they miss any key algorithmic insight? Mention if their code actually follows their described approach.
2. **### 💻 Code Review**: Identify specific bugs, syntax errors, or anti-patterns. Use inline code snippets to show what's wrong.
3. **### 💡 Targeted Suggestions**: Give 2-3 specific "hints" or "next steps" that would improve their solution (e.g., "Consider using a HashMap to reduce time complexity from O(n²) to O(n)").
4. **### 🚀 Optimal Implementation**: Provide a complete, production-grade, and well-commented solution in ${language}. Ensure the code is clean, follows best practices, and is wrapped in a markdown code block.

Tone: Professional, encouraging, and highly technical. Use Markdown formatting (bolding, lists, code blocks) to make your feedback beautiful and easy to read.`;

        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Code:\n${code}` },
                ],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.2,
                max_tokens: 3000,
            });

            return chatCompletion.choices[0]?.message?.content || 'No feedback generated.';
        } catch (error) {
            this.logger.error('Error analyzing code with Groq:', error);
            throw new Error(error.message || 'Failed to analyze code.');
        }
    }

    async generateProblem(topic?: string, difficulty?: string): Promise<any> {
        const systemPrompt = `You are an expert platform generating LeetCode-style coding challenges.
The user wants a new custom problem${topic ? ` about ${topic}` : ''}${difficulty ? ` of ${difficulty} difficulty` : ''}.

Generate a unique coding problem.
Return the result STRICTLY as a JSON object with the following keys:
- "title": A catchy problem title string
- "difficulty": "Easy", "Medium", or "Hard" string
- "timeEstimate": e.g., "15m", "30m" string
- "topic": The main algorithm topic string
- "statement": The detailed problem statement text (no examples or constraints here)
- "constraints": A list of constraints (e.g. ["n <= 100", "nums[i] is positive"])
- "examples": A list of example objects: [{"input": "...", "output": "...", "explanation": "..."}]
- "aiInsight": A brief hint or reason why this problem is good. string

Output ONLY valid JSON. Do not include markdown formatting or additional explanation.`;

        try {
            const chatCompletion = await this.groq.chat.completions.create({
                messages: [{ role: 'system', content: systemPrompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7,
                max_tokens: 2048,
                response_format: { type: 'json_object' }
            });

            const content = chatCompletion.choices[0]?.message?.content || '{}';
            // Extract JSON if wrapped in markdown blocks
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            const jsonStr = jsonMatch ? jsonMatch[0] : content;
            return JSON.parse(jsonStr);
        } catch (error) {
            this.logger.error('Error generating problem with Groq:', error);
            throw new HttpException('Failed to generate custom problem: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /** Normalize a structured problem into a consistent shape */
    private normalizeProblem(p: any): any {
        // If problem already has structured fields, keep them
        const statement = p.statement || p.description?.statement || (typeof p.description === 'string' ? p.description : '');
        let constraints = p.constraints || p.description?.constraints || '';
        if (Array.isArray(constraints)) {
            constraints = constraints.join('\n');
        }

        let examples: { input: string; output: string; explanation?: string }[] = [];
        if (Array.isArray(p.examples)) {
            examples = p.examples.map((ex: any) => ({
                input: String(ex.input || ex.in || ''),
                output: String(ex.output || ex.out || ''),
                explanation: ex.explanation || ex.explain || undefined,
            }));
        } else if (p.description?.examples && Array.isArray(p.description.examples)) {
            examples = p.description.examples.map((ex: any) => ({
                input: String(ex.input || ex.in || ''),
                output: String(ex.output || ex.out || ''),
                explanation: ex.explanation || undefined,
            }));
        }

        // Also keep a flat description fallback for backwards compat
        const flatDescription = [
            statement,
            examples.length > 0 ? examples.map((e, i) => `Example ${i + 1}:\n  Input: ${e.input}\n  Output: ${e.output}${e.explanation ? '\n  Explanation: ' + e.explanation : ''}`).join('\n') : '',
            constraints ? `Constraints:\n${constraints}` : '',
        ].filter(Boolean).join('\n\n');

        return {
            ...p,
            statement,
            examples,
            constraints,
            description: flatDescription || statement,
        };
    }

    /** Parse raw text into a problems array, handling many output formats */
    private parseProblemsFromText(text: string): any[] {
        // Strip markdown code fences
        let cleaned = text.replace(/```[a-z]*\s*/gi, '').replace(/```\s*/g, '').trim();

        // Try to extract valid JSON
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('No JSON object found');

        const jsonStr = cleaned.slice(start, end + 1);
        const parsed = JSON.parse(jsonStr);

        let problems: any[];
        if (Array.isArray(parsed)) {
            problems = parsed;
        } else if (parsed.problems && Array.isArray(parsed.problems)) {
            problems = parsed.problems;
        } else {
            const firstArray = Object.values(parsed).find(v => Array.isArray(v));
            problems = (firstArray as any[]) || [parsed];
        }

        return problems
            .filter(p => p && p.title)
            .map(p => this.normalizeProblem(p));
    }

    async generateProblemBatch(topic: string = 'General Algorithms', difficulty: string = 'Medium', count: number = 3): Promise<any[]> {
        const prompt = `You are a coding challenge generator. Generate exactly ${count} LeetCode-style problems as a JSON object.

Difficulty: ${difficulty}
Topics to pick from: ${topic}

STRICT FORMAT RULES:
- Return a JSON object with key "problems" containing an array of exactly ${count} items
- Each item MUST have ALL of these fields:
  - id: a unique string like "p1"
  - title: a descriptive problem title string
  - difficulty: exactly "${difficulty}"
  - timeEstimate: string like "20m"
  - topic: a string from the topics list above
  - statement: the main problem description as a plain string (NO nested objects, NO special quotes)
  - examples: an array of 2-3 objects, each with "input" (string), "output" (string), and optional "explanation" (string)
  - constraints: a string listing constraints like "1 <= n <= 10^5, -10^9 <= arr[i] <= 10^9"
  - starterCode: a JSON object with keys "Python 3", "JavaScript", "Java", "C++" containing a customized starter function for this specific problem (e.g., correct function name and parameters)
  - aiInsight: a one-sentence hint or insight about the optimal approach
- Do NOT use single or double quotes inside string values. Rephrase if needed.
- Spread problems across different topics from the list.

Return ONLY raw JSON, no markdown fences.`;

        const MAX_RETRIES = 3;
        let lastError: any;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await this.groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    temperature: attempt === 1 ? 0.7 : 0.4, // Lower temp on retry
                    max_tokens: 3500,
                });

                const content = response.choices[0]?.message?.content || '';
                const problems = this.parseProblemsFromText(content);

                if (problems.length > 0) {
                    this.logger.log(`Generated ${problems.length} problems on attempt ${attempt}`);
                    return problems;
                }
            } catch (err: any) {
                lastError = err;

                // Groq json_validate_failed: the error contains the actual generated text in failed_generation
                // We can often salvage it!
                if (err?.error?.error?.failed_generation) {
                    this.logger.warn(`Attempt ${attempt}: Groq json_validate_failed — trying to salvage failed_generation...`);
                    try {
                        const salvaged = this.parseProblemsFromText(err.error.error.failed_generation);
                        if (salvaged.length > 0) {
                            this.logger.log(`Salvaged ${salvaged.length} problems from failed_generation on attempt ${attempt}`);
                            return salvaged;
                        }
                    } catch (parseErr) {
                        this.logger.warn(`Could not salvage failed_generation: ${parseErr.message}`);
                    }
                }

                this.logger.warn(`Attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`);
                if (attempt < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
                }
            }
        }

        this.logger.error(`All ${MAX_RETRIES} attempts failed. Last error:`, lastError);
        throw new HttpException('Failed to generate problems after multiple attempts. Please try again.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

