import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AiService } from './ai.service';

class AnalyzeCodeDto {
    code: string;
    problemDescription: string;
    language: string;
    approach: string;
}

@Controller('api/analyze')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Post()
    async analyze(@Body() dto: AnalyzeCodeDto) {
        if (!dto.code || !dto.problemDescription || !dto.language) {
            throw new HttpException('Missing code, problem description, or language', HttpStatus.BAD_REQUEST);
        }

        try {
            const feedback = await this.aiService.analyzeCode(dto.code, dto.problemDescription, dto.language, dto.approach);
            return { feedback };
        } catch (error) {
            throw new HttpException(error.message || 'Internal API Error', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
