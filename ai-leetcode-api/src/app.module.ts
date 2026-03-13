import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiService } from './ai/ai.service';
import { AiController } from './ai/ai.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProblemsModule } from './problems/problems.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGODB_URI');
        if (!uri) {
          throw new Error('MONGODB_URI is not defined in the environment variables');
        }
        console.log(`[Database] Connecting to MongoDB using URI: ${uri.replace(/:([^:@]+)@/, ':****@')}`);
        return { uri };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    ProblemsModule,
  ],
  controllers: [AppController, AiController],
  providers: [AppService, AiService],
})
export class AppModule { }
