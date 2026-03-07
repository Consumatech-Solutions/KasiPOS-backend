import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TempIdMapping } from '../entities/temp-id-mapping.entity';
import { TempIdMappingsService } from './temp-id-mappings.service';
import { TempIdResolveInterceptor } from '../interceptors/temp-id-resolve.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([TempIdMapping])],
  providers: [TempIdMappingsService, TempIdResolveInterceptor],
  exports: [TempIdMappingsService, TempIdResolveInterceptor],
})
export class TempIdMappingsModule {}
