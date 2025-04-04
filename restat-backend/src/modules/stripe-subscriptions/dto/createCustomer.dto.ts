import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";
@Injectable()
export class CreateCustomerDto {
  @ApiProperty({
    type: String,
    description:
      "Email. This is required property to create a customer.",
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description:
      "Payment Method. This is required property to create a customer.",
  })
  @IsString()
  paymentMethod: string;
}
