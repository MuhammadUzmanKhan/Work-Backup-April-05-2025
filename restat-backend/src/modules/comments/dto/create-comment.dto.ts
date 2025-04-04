import { IsNotEmpty, IsUUID, IsString } from 'class-validator';

export class CreateCommentDto {
  @IsUUID()
  @IsNotEmpty()
  bidId: string;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  commentText: string;
}
