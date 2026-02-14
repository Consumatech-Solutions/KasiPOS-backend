import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parcel, ParcelStatus } from './entities/parcel.entity';
import { CreateParcelDto } from './dto/create-parcel.dto';
import { UpdateParcelDto } from './dto/update-parcel.dto';
import { GetParcelsDto } from './dto/get-parcels.dto';
import { ReceiveParcelDto } from './dto/receive-parcel.dto';
import { CollectParcelDto } from './dto/collect-parcel.dto';
import { PaginationResult } from '../common/dto/pagination.dto';

@Injectable()
export class ParcelsService {
  constructor(
    @InjectRepository(Parcel)
    private parcelsRepository: Repository<Parcel>,
  ) {}

  private generateCode(length: number, prefix: string = ''): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + result;
  }

  async create(dto: CreateParcelDto, storeId: string): Promise<Parcel> {
    const parcel = this.parcelsRepository.create({
      storeId,
      deliveryNumber: dto.deliveryNumber,
      customerName: dto.customerName,
      status: ParcelStatus.INCOMING,
    });

    return this.parcelsRepository.save(parcel);
  }

  async findAll(
    query: GetParcelsDto,
    storeId: string,
  ): Promise<PaginationResult<Parcel>> {
    const { page = 1, limit = 10, status, search } = query;

    const queryBuilder = this.parcelsRepository
      .createQueryBuilder('parcel')
      .where('parcel.storeId = :storeId', { storeId })
      .orderBy('parcel.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('parcel.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(parcel.deliveryNumber ILike :search OR parcel.collectionCode ILike :search)',
        { search: `%${search}%` },
      );
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

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

  async findOne(id: string, storeId: string): Promise<Parcel> {
    const parcel = await this.parcelsRepository.findOne({
      where: { id, storeId },
    });

    if (!parcel) {
      throw new NotFoundException(`Parcel not found: ${id}`);
    }

    return parcel;
  }

  async findByCollectionCode(
    collectionCode: string,
    storeId: string,
  ): Promise<Parcel> {
    const parcel = await this.parcelsRepository.findOne({
      where: { collectionCode, storeId },
    });

    if (!parcel) {
      throw new NotFoundException(
        `Parcel not found with collection code: ${collectionCode}`,
      );
    }

    return parcel;
  }

  async receive(
    id: string,
    dto: ReceiveParcelDto,
    storeId: string,
  ): Promise<Parcel> {
    const parcel = await this.findOne(id, storeId);

    if (parcel.status !== ParcelStatus.INCOMING) {
      throw new BadRequestException('Parcel is not in Incoming status');
    }

    const collectionCode = this.generateCode(5, 'KP-');

    parcel.status = ParcelStatus.RECEIVED;
    parcel.receiptCode = dto.receiptCode;
    parcel.collectionCode = collectionCode;
    parcel.dateReceived = new Date();

    return this.parcelsRepository.save(parcel);
  }

  async collect(
    id: string,
    dto: CollectParcelDto,
    storeId: string,
  ): Promise<Parcel> {
    const parcel = await this.findOne(id, storeId);

    if (parcel.status !== ParcelStatus.RECEIVED) {
      throw new BadRequestException('Parcel is not in Received status');
    }

    if (parcel.collectionCode !== dto.collectionCode) {
      throw new BadRequestException('Collection code does not match');
    }

    parcel.status = ParcelStatus.COLLECTED;
    parcel.collectingPersonName = dto.collectingPersonName;
    parcel.collectingPersonPhone = dto.collectingPersonPhone;
    parcel.collectingPersonId = dto.collectingPersonId;
    parcel.dateCollected = new Date();

    return this.parcelsRepository.save(parcel);
  }

  async update(
    id: string,
    dto: UpdateParcelDto,
    storeId: string,
  ): Promise<Parcel> {
    const parcel = await this.findOne(id, storeId);

    // Only allow editing deliveryNumber and customerName for incoming parcels
    if (parcel.status !== ParcelStatus.INCOMING) {
      if (dto.deliveryNumber !== undefined || dto.customerName !== undefined) {
        throw new BadRequestException(
          'Cannot edit delivery number or customer name for non-incoming parcels',
        );
      }
    }

    if (dto.deliveryNumber !== undefined) {
      parcel.deliveryNumber = dto.deliveryNumber;
    }
    if (dto.customerName !== undefined) {
      parcel.customerName = dto.customerName;
    }
    if (dto.status !== undefined) {
      parcel.status = dto.status as ParcelStatus;
    }
    if (dto.collectionCode !== undefined) {
      parcel.collectionCode = dto.collectionCode;
    }
    if (dto.receiptCode !== undefined) {
      parcel.receiptCode = dto.receiptCode;
    }
    if (dto.dateReceived !== undefined) {
      parcel.dateReceived = new Date(dto.dateReceived);
    }
    if (dto.dateCollected !== undefined) {
      parcel.dateCollected = new Date(dto.dateCollected);
    }
    if (dto.collectingPersonName !== undefined) {
      parcel.collectingPersonName = dto.collectingPersonName;
    }
    if (dto.collectingPersonPhone !== undefined) {
      parcel.collectingPersonPhone = dto.collectingPersonPhone;
    }
    if (dto.collectingPersonId !== undefined) {
      parcel.collectingPersonId = dto.collectingPersonId;
    }

    return this.parcelsRepository.save(parcel);
  }

  async remove(id: string, storeId: string): Promise<void> {
    const parcel = await this.findOne(id, storeId);

    // Only allow deletion of incoming parcels
    if (parcel.status !== ParcelStatus.INCOMING) {
      throw new BadRequestException(
        'Cannot delete parcels that are not in Incoming status',
      );
    }

    await this.parcelsRepository.remove(parcel);
  }
}
