import { IsString, IsNumber, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateCampaignDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    type: string;

    @IsString()
    @IsNotEmpty()
    status: string;

    @IsString()
    @IsNotEmpty()
    duration: string;

    @IsNumber()
    @IsNotEmpty()
    budget: number;
}
