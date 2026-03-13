import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserProblemDocument = UserProblem & Document;

@Schema({ timestamps: true })
export class UserProblem {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Problem', required: false })
    problemId: Types.ObjectId;

    // For AI-generated problems that might not be in the global problem list initially
    @Prop({ type: Object })
    generatedProblemDetails: any;

    @Prop({ default: false })
    isCompleted: boolean;

    @Prop({ default: Date.now })
    assignedDate: Date;

    @Prop()
    completedAt: Date;
}

export const UserProblemSchema = SchemaFactory.createForClass(UserProblem);
