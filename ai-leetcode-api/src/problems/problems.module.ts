import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { Problem, ProblemSchema } from './schemas/problem.schema';
import { UserProblem, UserProblemSchema } from './schemas/user-problem.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Problem.name, schema: ProblemSchema },
            { name: UserProblem.name, schema: UserProblemSchema }
        ]),
    ],
    controllers: [ProblemsController],
    providers: [ProblemsService],
    exports: [ProblemsService],
})
export class ProblemsModule {}
