import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '@ontrack-tech-group/common/decorators';
import { PaginationDto } from '@ontrack-tech-group/common/dto';
import { InformationRequestService } from './information-request.service';
import { CreateInformationRequestDto } from './dto/create-information-request.dto';

@ApiTags('Information Requests')
@Controller('information-requests')
export class InformationRequestController {
  constructor(
    private readonly informationRequestService: InformationRequestService,
  ) {}

  @Post()
  @Public()
  createInformationRequest(
    @Body() createInformationRequestDto: CreateInformationRequestDto,
  ) {
    return this.informationRequestService.createInformationRequest(
      createInformationRequestDto,
    );
  }

  @Get()
  @ApiBearerAuth()
  getAllInformationRequests(@Query() params: PaginationDto) {
    return this.informationRequestService.getAllInformationRequests(
      params.page && Number(params.page),
      params.page_size && Number(params.page_size),
    );
  }

  @Get(':id')
  @ApiBearerAuth()
  getInformationRequestById(@Param('id') id: string) {
    return this.informationRequestService.getInformationRequestById(+id);
  }
}
