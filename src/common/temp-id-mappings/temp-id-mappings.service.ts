import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TempIdMapping } from '../entities/temp-id-mapping.entity';

const TEMP_ID_PATTERN = /^temp-\d+$/;

@Injectable()
export class TempIdMappingsService {
  constructor(
    @InjectRepository(TempIdMapping)
    private readonly repo: Repository<TempIdMapping>,
  ) {}

  async saveMapping(
    tempId: string,
    serverId: string,
    entityType: string,
  ): Promise<void> {
    await this.repo.upsert(
      { tempId, serverId, entityType },
      { conflictPaths: ['tempId'] },
    );
  }

  async resolveId(tempId: string): Promise<string | null> {
    const mapping = await this.repo.findOne({ where: { tempId } });
    return mapping?.serverId ?? null;
  }

  /**
   * Recursively walk payload and replace any string matching temp-X with
   * the resolved server ID if found in mappings.
   */
  async resolvePayload(obj: unknown): Promise<unknown> {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      if (TEMP_ID_PATTERN.test(obj)) {
        const resolved = await this.resolveId(obj);
        return resolved ?? obj;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      const result = [];
      for (let i = 0; i < obj.length; i++) {
        result[i] = await this.resolvePayload(obj[i]);
      }
      return result;
    }

    if (typeof obj === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = await this.resolvePayload(value);
      }
      return result;
    }

    return obj;
  }
}
