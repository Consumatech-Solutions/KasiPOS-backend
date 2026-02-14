import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationResult } from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'phone',
        'name',
        'role',
        'storeId',
        'isActive',
        'createdAt',
        'updatedAt',
        'passwordHash',
      ],
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { phone },
      select: [
        'id',
        'email',
        'phone',
        'name',
        'role',
        'storeId',
        'isActive',
        'createdAt',
        'updatedAt',
        'passwordHash',
      ],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create(createUserDto);
    return this.usersRepository.save(user);
  }

  /** Create a user with an initial plain password (e.g. store admin). Entity will hash it on save. */
  async createWithPassword(
    dto: Omit<CreateUserDto, 'email'> & { email: string; password: string },
  ): Promise<User> {
    const { password, ...rest } = dto;
    const user = this.usersRepository.create({ ...rest, passwordHash: password } as any);
    const saved = await this.usersRepository.save(user);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If password is provided, set it as passwordHash (will be hashed by entity hook)
    if (updateUserDto.password) {
      (user as any).passwordHash = updateUserDto.password;
      delete (updateUserDto as any).password;
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    storeId?: string,
  ): Promise<PaginationResult<User>> {
    const [data, total] = await this.usersRepository.findAndCount({
      where: {
        ...(storeId ? { storeId } : {}),
        isActive: true,
      },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isActive = false;
    await this.usersRepository.save(user);
  }
}
