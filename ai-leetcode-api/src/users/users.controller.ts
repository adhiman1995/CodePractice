import { Controller, Put, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/users')
export class UsersController {
    constructor(private usersService: UsersService) { }

    @UseGuards(JwtAuthGuard)
    @Put('profile')
    async updateProfile(@Request() req, @Body() profileData: any) {
        const email = req.user.email;
        const updatedUser = await this.usersService.updateProfile(email, profileData);
        if (!updatedUser) {
            throw new NotFoundException('User not found');
        }
        return {
            email: updatedUser.email,
            profile: updatedUser.profile,
            stats: updatedUser.stats
        };
    }
}
