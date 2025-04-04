import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    ParseUUIDPipe
} from '@nestjs/common';
import { MedicinesService } from './medicine.service';
import { Medicines } from '@common/models/medicines.model';
import { UpdateMedicineDto } from './dto/update.dto';
import {
    ApiTags,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiCreatedResponse,
    ApiNoContentResponse,
    ApiBearerAuth
} from '@nestjs/swagger';
import { ApiTagNames } from '@common/constants';
import { OktaUser } from '@common/decorators/okta.decorator';
import { CreateMedicineDto } from './dto/create.dto';

@ApiTags(ApiTagNames.MEDICINES)
@Controller('medicines')
export class MedicinesController {
    constructor(private readonly medicinesService: MedicinesService) { }

    @Get()
    @OktaUser()
    @ApiBearerAuth()
    @ApiOkResponse({
        description: 'List of all medicines',
        type: [Medicines]
    })
    public getAllMedicines() {
        return this.medicinesService.getAllMedicines();
    }

    @Get(':id')
    @OktaUser()
    @ApiBearerAuth()
    @ApiOkResponse({
        description: 'Details of a specific medicine',
        type: Medicines
    })
    @ApiNotFoundResponse({ description: 'Medicine not found' })
    public getMedicineById(@Param('id', ParseUUIDPipe) id: string) {
        return this.medicinesService.getMedicineById(id);
    }

    @Post()
    @ApiTags(ApiTagNames.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiCreatedResponse({
        description: 'Medicine created successfully',
        type: Medicines
    })
    public createMedicine(@Body() createMedicineDto: CreateMedicineDto) {
        return this.medicinesService.createMedicine(createMedicineDto);
    }

    @Put(':id')
    @ApiTags(ApiTagNames.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOkResponse({
        description: 'Medicine updated successfully',
        type: Medicines
    })
    @ApiNotFoundResponse({ description: 'Medicine not found' })
    public updateMedicine(@Param('id', ParseUUIDPipe) id: string, @Body() updateMedicineDto: UpdateMedicineDto) {
        return this.medicinesService.updateMedicine(id, updateMedicineDto);
    }

    @Delete(':id')
    @ApiTags(ApiTagNames.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiNoContentResponse({ description: 'Medicine deleted successfully' })
    @ApiNotFoundResponse({ description: 'Medicine not found' })
    public deleteMedicine(@Param('id', ParseUUIDPipe) id: string) {
        return this.medicinesService.deleteMedicine(id);
    }
}
