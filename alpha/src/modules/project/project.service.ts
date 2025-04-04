import { Injectable } from '@nestjs/common';
import {
  FrameWork,
  Library,
  Project,
  ProjectFrameWork,
  ProjectLibrary,
} from 'src/common/models';
import { CreateProjectDto, GetAllProjectsDto, UpdateProjectDto } from './dto';
import { allProjectsWhere } from './helpers';

@Injectable()
export class ProjectService {
  async createProject(createProjectDto: CreateProjectDto) {
    const { frame_work_ids, project_library_ids } = createProjectDto;
    const project = await Project.create({
      ...createProjectDto,
    });

    for (const frame_work_id of frame_work_ids) {
      await ProjectFrameWork.create({
        project_id: project.id,
        frame_work_id,
      });
    }

    for (const library_id of project_library_ids) {
      await ProjectLibrary.create({
        project_id: project.id,
        library_id,
      });
    }

    return project;
  }

  async getAllProjectListing(getAllProjectsDto?: GetAllProjectsDto) {
    const projects = await Project.findAll({
      where: getAllProjectsDto && allProjectsWhere(getAllProjectsDto),
      include: [
        {
          model: ProjectFrameWork,
          attributes: ['id'],
          required: true,
          include: [
            {
              model: FrameWork,
              attributes: ['name'],
            },
          ],
        },
        {
          model: ProjectLibrary,
          attributes: ['id'],
          required: true,
          include: [
            {
              model: Library,
              attributes: ['name'],
            },
          ],
        },
      ],
    });

    return projects;
  }

  async getAllProjectById(id: string) {
    const projects = await Project.findByPk(id, {
      include: [
        {
          model: ProjectFrameWork,
          attributes: ['id'],
          required: true,
          include: [
            {
              model: FrameWork,
              attributes: ['name'],
            },
          ],
        },
        {
          model: ProjectLibrary,
          attributes: ['id'],
          required: true,
          include: [
            {
              model: Library,
              attributes: ['name'],
            },
          ],
        },
      ],
    });

    return projects;
  }

  async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
    await Project.update(
      {
        ...updateProjectDto,
      },
      { where: { id } },
    );

    return await this.getAllProjectById(id);
  }
}
