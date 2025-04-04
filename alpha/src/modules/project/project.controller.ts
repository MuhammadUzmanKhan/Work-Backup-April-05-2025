import { Body, Controller, Get, Post, Query, Put, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProjectDto, GetAllProjectsDto, UpdateProjectDto } from './dto';
import { ProjectService } from './project.service';
import { Public } from 'src/common/decorators/public.meta';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) { }

  @ApiOperation({
    summary: 'Create a Project',
  })
  @Public()
  @Post()
  createProject(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.createProject(createProjectDto);
  }

  @ApiOperation({
    summary: 'Get all Project Listing',
  })
  @Public()
  @Get()
  getAllProjectListing(@Query() getAllProjectsDto: GetAllProjectsDto) {
    return this.projectService.getAllProjectListing(getAllProjectsDto);
  }

  @ApiOperation({
    summary: 'Get all Project Listing',
  })
  @Public()
  @Get(':id')
  getAllProjectById(@Param('id') id: string) {
    return this.projectService.getAllProjectById(id);
  }

  @ApiOperation({
    summary: 'Update a Project',
  })
  @Public()
  @Put(':id')
  updateProject(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.updateProject(id, updateProjectDto);
  }
}
