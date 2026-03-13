import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }

    async register(registerDto: any) {
        const { email, password } = registerDto;

        // Check if user exists
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await this.usersService.create({
            email,
            password: hashedPassword
        });

        // Generate JWT
        const payload = { email: user.email, sub: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                email: user.email,
                profile: user.profile,
                stats: user.stats
            }
        };
    }

    async login(loginDto: any) {
        const { email, password } = loginDto;
        const user = await this.usersService.findOneByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { email: user.email, sub: user.email };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                email: user.email,
                profile: user.profile,
                stats: user.stats
            }
        };
    }
}
