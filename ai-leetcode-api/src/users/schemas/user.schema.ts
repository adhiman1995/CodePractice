import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true })
    password: string; // Will store the bcrypt hash

    // User's DSA Profile (from Onboarding)
    @Prop({ type: Object, default: null })
    profile: {
        level: string;
        topics: string[];
        problemsPerDay: number;
    };

    // User's progression stats
    @Prop({
        type: Object,
        default: {
            totalSolved: 0,
            easySolved: 0,
            mediumSolved: 0,
            hardSolved: 0,
            currentStreak: 0,
            ranking: Math.floor(Math.random() * 50000) + 1000 // placeholder ranking
        }
    })
    stats: {
        totalSolved: number;
        easySolved: number;
        mediumSolved: number;
        hardSolved: number;
        currentStreak: number;
        ranking: number;
    };
}

export const UserSchema = SchemaFactory.createForClass(User);
