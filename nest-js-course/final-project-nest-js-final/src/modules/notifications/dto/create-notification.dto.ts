import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  readonly message: string;

  @IsInt()
  @Min(1)
  readonly userId: number;
}
