import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UserResponse } from './models/user.model';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  private readonly defaultName = process.env.DEFAULT_USER_NAME;
  private readonly defaultEmail = process.env.DEFAULT_USER_EMAIL;
  private readonly defaultPassword = process.env.DEFAULT_USER_PASSWORD;

  constructor(private readonly prisma: PrismaService) {}

  // Ensure the default user exists
  private async ensureDefaultUser(): Promise<User> {
    const existing = await this.prisma.user.findFirst();
    if (existing) {
      return existing;
    }

    if (!this.defaultName || !this.defaultEmail || !this.defaultPassword) {
      throw new Error('Default user credentials are not set');
    }

    return this.prisma.user.create({
      data: {
        name: this.defaultName,
        email: this.defaultEmail,
        password: this.defaultPassword,
      },
    });
  }

  // Get the user details
  async getUser(): Promise<UserResponse> {
    const user = await this.ensureDefaultUser();
    return {
      name: user.name,
      email: user.email,
      message: 'Single-user mode enabled',
    };
  }

  // Get the default user's ID
  async getDefaultUserId(): Promise<string> {
    const user = await this.ensureDefaultUser();
    return user.id;
  }
}
