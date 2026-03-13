import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { Problem } from './schemas/problem.schema';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/problems')
export class ProblemsController {
    constructor(private readonly problemsService: ProblemsService) {}

    @Get('history')
    @UseGuards(JwtAuthGuard)
    async getUserHistory(@Request() req) {
        return this.problemsService.getUserProblems(req.user.userId);
    }

    @Post('save-generated')
    @UseGuards(JwtAuthGuard)
    async saveGenerated(@Request() req, @Body() body: { problems: any[] }) {
        return this.problemsService.saveGeneratedProblems(req.user.userId, body.problems);
    }

    @Post('solve')
    @UseGuards(JwtAuthGuard)
    async markSolved(@Request() req, @Body() body: { problemId: string }) {
        return this.problemsService.markSolved(req.user.userId, body.problemId);
    }
}
