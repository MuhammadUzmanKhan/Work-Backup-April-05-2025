import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
import { DataType } from "sequelize-typescript";
@Injectable()
export class CreateSubscriptionDto {
  @ApiProperty({
    type: String,
    description:
      "Customer Id. This is required property to create a subscription.",
  })
  @IsString()
  customerId: string;

  @ApiProperty({
    type: String,
    description:
      "Price Id. This is required property to create a subscription.",
  })
  @IsString()
  productId: string;

  @ApiProperty({
    type: DataType.INTEGER,
    description:
      "maxUsers. This is required property to create a subscription.",
  })
  @IsNumber()
  maxUsers: number;
}
