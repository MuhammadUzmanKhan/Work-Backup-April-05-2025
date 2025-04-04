import { PartialType } from "@nestjs/swagger";
import { CreateMedicineDto } from "./create.dto";

export class UpdateMedicineDto extends PartialType(CreateMedicineDto) { }