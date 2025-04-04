import { Injectable } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

@Injectable()
export class updatePaymentMethodDto {
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
      "Payment Method Id. This is required property to create a subscription.",
  })
  @IsString()
  paymentMethodId: string;

}
