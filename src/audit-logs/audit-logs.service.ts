import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { PaginationResult } from '../common/dto/pagination.dto';
import { GetAuditLogsDto } from './dto/get-audit-logs.dto';

export interface CreateAuditLogDto {
  userId?: string;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  changes?: Record<string, any>;
  endpoint?: string;
  method?: string;
  ipAddress?: string;
  userAgent?: string;
  statusCode?: number;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogsRepository.create(createAuditLogDto);
    return this.auditLogsRepository.save(auditLog);
  }

  async findAll(query: GetAuditLogsDto): Promise<PaginationResult<AuditLog>> {
    const {
      page = 1,
      limit = 10,
      userId,
      action,
      entity,
      startDate,
      endDate,
    } = query;

    const queryBuilder = this.auditLogsRepository
      .createQueryBuilder('audit_log')
      .leftJoinAndSelect('audit_log.user', 'user');

    if (userId) {
      queryBuilder.andWhere('audit_log.user_id = :userId', { userId });
    }

    if (action) {
      queryBuilder.andWhere('audit_log.action = :action', { action });
    }

    if (entity) {
      queryBuilder.andWhere('audit_log.entity ILIKE :entity', {
        entity: `%${entity}%`,
      });
    }

    if (startDate) {
      queryBuilder.andWhere('audit_log.timestamp >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit_log.timestamp <= :endDate', { endDate });
    }

    queryBuilder
      .orderBy('audit_log.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

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

  async findOne(id: string): Promise<AuditLog> {
    return this.auditLogsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: { entity, entityId },
      relations: ['user'],
      order: { timestamp: 'DESC' },
    });
  }

  async findByUser(userId: string, limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogsRepository.find({
      where: { userId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
