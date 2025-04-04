import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Param,
    Body,
    ParseUUIDPipe,
    Query
} from '@nestjs/common';
import { StrategyAndTreatmentService } from './strategy-and-treatment.service';
import { StrategyAndTreatment } from '@common/models/strategy-and-treatment';
import { UpdateStrategyAndTreatmentDto } from './dto/update.dto';
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
import { CreateStrategyAndTreatmentDto } from './dto/create.dto';

@ApiTags(ApiTagNames.StrategyAndTreatment)
@Controller('strategy-and-treatment')
export class StrategyAndTreatmentController {
    constructor(private readonly strategyAndTreatmentService: StrategyAndTreatmentService) { }

    @Get()
    @OktaUser()
    @ApiBearerAuth()
    @ApiOkResponse({
        description: 'List of all  strategy and treatment',
        type: [StrategyAndTreatment]
    })
    public getAllStrategyAndTreatment(@Query("medId") medId: string) {
        return this.strategyAndTreatmentService.getAllStrategyAndTreatment(medId);
    }

    @Get(':id')
    @OktaUser()
    @ApiBearerAuth()
    @ApiOkResponse({
        description: 'Details of a specific  strategy and treatment',
        type: StrategyAndTreatment
    })
    @ApiNotFoundResponse({ description: 'Strategy and treatment not found' })
    public getStrategyAndTreatmentById(@Param('id', ParseUUIDPipe) id: string) {
        return this.strategyAndTreatmentService.getStrategyAndTreatmentById(id);
    }

    @Post()
    @ApiTags(ApiTagNames.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiCreatedResponse({
        description: 'Strategy and treatment created successfully',
        type: StrategyAndTreatment
    })
    public createStrategyAndTreatment(@Body() createStrategyAndTreatmentDto: CreateStrategyAndTreatmentDto) {
        return this.strategyAndTreatmentService.createStrategyAndTreatment(createStrategyAndTreatmentDto);
    }

    @Put(':id')
    @ApiTags(ApiTagNames.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOkResponse({
        description: 'Strategy and treatment updated successfully',
        type: StrategyAndTreatment
    })
    @ApiNotFoundResponse({ description: 'Strategy and treatment not found' })
    public updateStrategyAndTreatment(@Param('id', ParseUUIDPipe) id: string, @Body() updateStrategyAndTreatmentDto: UpdateStrategyAndTreatmentDto) {
        return this.strategyAndTreatmentService.updateStrategyAndTreatment(id, updateStrategyAndTreatmentDto);
    }

    @Delete(':id')
    @ApiTags(ApiTagNames.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiNoContentResponse({ description: 'Strategy and treatment deleted successfully' })
    @ApiNotFoundResponse({ description: 'Strategy and treatment not found' })
    public deleteStrategyAndTreatment(@Param('id', ParseUUIDPipe) id: string) {
        return this.strategyAndTreatmentService.deleteStrategyAndTreatment(id);
    }
}
