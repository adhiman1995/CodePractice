import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Problem, ProblemDocument } from './schemas/problem.schema';
import { UserProblem, UserProblemDocument } from './schemas/user-problem.schema';

@Injectable()
export class ProblemsService {
    constructor(
        @InjectModel(Problem.name) private problemModel: Model<ProblemDocument>,
        @InjectModel(UserProblem.name) private userProblemModel: Model<UserProblemDocument>,
    ) {}

    async saveGeneratedProblems(userId: string, problems: any[]): Promise<any> {
        const userProblems = problems.map(p => ({
            userId,
            generatedProblemDetails: p,
            isCompleted: p.isCompleted || false,
            assignedDate: p.assignedDate || new Date()
        }));
        return this.userProblemModel.insertMany(userProblems);
    }

    async getUserProblems(userId: string): Promise<UserProblem[]> {
        return this.userProblemModel.find({ userId }).sort({ assignedDate: -1 }).exec();
    }

    async markSolved(userId: string, problemId: string): Promise<any> {
        // Find by generatedProblemDetails.id or problemId
        return this.userProblemModel.findOneAndUpdate(
            { 
                userId, 
                $or: [
                    { 'generatedProblemDetails.id': problemId },
                    { 'problemId': problemId }
                ]
            },
            { isCompleted: true, completedAt: new Date() },
            { new: true }
        );
    }

    async findAll(): Promise<Problem[]> {
        return this.problemModel.find().exec();
    }

    async findByDifficulty(difficulty: string): Promise<Problem[]> {
        return this.problemModel.find({ difficulty }).exec();
    }

    async create(problemData: Partial<Problem>): Promise<Problem> {
        const createdProblem = new this.problemModel(problemData);
        return createdProblem.save();
    }

    async createBatch(problems: Partial<Problem>[]): Promise<any> {
        return this.problemModel.insertMany(problems, { ordered: false }).catch(err => {
            // Handle duplicate keys or other errors gracefully
            return {
                imported: err.insertedDocs?.length || 0,
                errors: err.writeErrors?.length || 0
            };
        });
    }

    async getRecommended(userProfile: any): Promise<Problem[]> {
        // Simple recommendation: return problems matching user's level and topics
        const query: any = {};
        if (userProfile.level) {
            query.difficulty = userProfile.level;
        }
        if (userProfile.topics && userProfile.topics.length > 0) {
            query.topic = { $in: userProfile.topics };
        }
        
        return this.problemModel.find(query).limit(5).exec();
    }
}
