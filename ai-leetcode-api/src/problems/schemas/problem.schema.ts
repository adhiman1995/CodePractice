import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProblemDocument = Problem & Document;

@Schema({ timestamps: true })
export class Problem {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    difficulty: string; // "Easy", "Medium", "Hard"

    @Prop({ required: true })
    topic: string;

    @Prop({ required: true })
    statement: string;

    @Prop({ type: [String], default: [] })
    constraints: string[];

    @Prop({ type: [{ input: String, output: String, explanation: String }], default: [] })
    examples: { input: string; output: string; explanation?: string }[];

    @Prop()
    timeEstimate: string;

    @Prop({ default: true })
    isExternal: boolean;

    @Prop()
    sourceUrl: string;

    @Prop({ unique: true, sparse: true })
    externalId: string;
}

export const ProblemSchema = SchemaFactory.createForClass(Problem);
