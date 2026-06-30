import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

/**
 * UsersService is responsible for user data storage and retrieval operations.
 * It interfaces directly with the PrismaService.
 * 
 * UsersService ले database मा user store गर्ने र retrieve गर्ने काम गर्छ।
 */
@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find a user by their email address
   * @param email The user's email address
   * @returns User object if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by their ID
   * @param id The user's unique database ID
   * @returns User object if found, null otherwise
   */
  async findById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Create a new user record in the database
   * @param data The UserCreateInput data containing name, email, and hashed password
   * @returns The newly created User object
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }
}
