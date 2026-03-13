import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai/ai.service';
import { ProblemsService } from './problems/problems.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('api')
export class AppController {
  constructor(
    private readonly aiService: AiService,
    private readonly problemsService: ProblemsService
  ) { }

  @Get('dashboard')
  getDashboardStats() {
    return {
      userStats: {
        totalSolved: 142,
        easySolved: 85,
        mediumSolved: 45,
        hardSolved: 12,
        currentStreak: 12,
        ranking: 15420
      },
      attemptedProblems: [
        { id: 1, title: 'Valid Palindrome II', difficulty: 'Medium', status: 'Attempted', timeSpent: '45m', lastAttempt: '2 hours ago' },
        { id: 2, title: 'Two Sum', difficulty: 'Easy', status: 'Solved', timeSpent: '15m', lastAttempt: '1 day ago' },
        { id: 3, title: 'Merge Intervals', difficulty: 'Medium', status: 'Solved', timeSpent: '30m', lastAttempt: '2 days ago' },
        { id: 4, title: 'Trapping Rain Water', difficulty: 'Hard', status: 'Attempted', timeSpent: '1h 20m', lastAttempt: '3 days ago' },
        { id: 5, title: 'LRU Cache', difficulty: 'Medium', status: 'Attempted', timeSpent: '50m', lastAttempt: '4 days ago' },
      ]
    };
  }

  @Get('problems/recommended')
  async getRecommendedProblems() {
    const dbProblems = await this.problemsService.findAll();
    if (dbProblems.length > 0) {
      // Return the first 5 for now
      return dbProblems.slice(0, 5).map(p => ({
        id: p['_id'],
        title: p.title,
        difficulty: p.difficulty,
        timeEstimate: p.timeEstimate || '15m',
        topic: p.topic,
        aiInsight: `This problem matches your focus on ${p.topic}.`
      }));
    }
    
    // Fallback to mock data if DB is empty
    return [
      {
        id: 'p1',
        title: 'Two Sum IV - Input is a BST',
        difficulty: 'Easy',
        timeEstimate: '10m',
        topic: 'Binary Search Trees',
        aiInsight: '"Since you struggled with DFS recursion yesterday, this will help solidify your tree traversal logic."'
      },
      {
        id: 'p2',
        title: 'Longest Increasing Subsequence',
        difficulty: 'Medium',
        timeEstimate: '25m',
        topic: 'Dynamic Programming',
        aiInsight: `"You've mastered 1D DP arrays. This problem introduces optimal sub-structure patterns for 2D challenges."`
      }
    ];
  }

  @Get('problems/featured')
  getFeaturedProblem() {
    return {
      title: 'Valid Palindrome II',
      timeEstimate: '15 mins',
      difficulty: 'Medium',
      description: 'Given a string s, return true if the s can be palindrome after deleting at most one character from it.'
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('problems/generate')
  async generateProblem(@Body() body: { topic?: string, difficulty?: string }) {
    return this.aiService.generateProblem(body.topic, body.difficulty);
  }

  @UseGuards(JwtAuthGuard)
  @Post('problems/generateBatch')
  async generateProblemBatch(@Body() body: { topic?: string, difficulty?: string, count?: number }) {
    return this.aiService.generateProblemBatch(body.topic, body.difficulty, body.count);
  }
}
