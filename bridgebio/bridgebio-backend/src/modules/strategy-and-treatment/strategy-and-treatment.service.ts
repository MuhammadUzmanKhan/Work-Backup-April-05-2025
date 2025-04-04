import { Injectable, NotFoundException } from '@nestjs/common';
import { StrategyAndTreatment } from '@common/models/strategy-and-treatment';
import { UpdateStrategyAndTreatmentDto } from './dto/update.dto';
import { CreateStrategyAndTreatmentDto } from './dto/create.dto';
import { ResearchObjectives } from '@common/models/research-objectives.model';
@Injectable()
export class StrategyAndTreatmentService {
    constructor() { }

    public async getStrategyAndTreatmentById(id: string) {
        return await this.findStrategyAndTreatmentById(id);
    }

    public async getAllStrategyAndTreatment(medId: string) {
        return await StrategyAndTreatment.findAll({
            where: {
                published: true,
                medId
            },
            order: [["order", "ASC"]],
            attributes: [
                "icon",
                "title",
                "description"
            ],
            include: [{
                model: ResearchObjectives,
                where: { published: true },
                attributes: [
                    "icon",
                    "title",
                    "description"
                ],
                order: [["order", "ASC"]]
            }]
        });
    }

    public async createStrategyAndTreatment(createStrategyAndTreatmentDto: CreateStrategyAndTreatmentDto) {
        const { order: lastOrder } = (await StrategyAndTreatment.findOne({
            order: [["order", "DESC"]],
            where: { medId: createStrategyAndTreatmentDto.medId }
        })) || {};
        const strategyAndTreatment = await StrategyAndTreatment.create({
            icon: createStrategyAndTreatmentDto.icon,
            title: createStrategyAndTreatmentDto.title,
            description: createStrategyAndTreatmentDto.description,
            published: createStrategyAndTreatmentDto.published,
            order: (lastOrder || 0) + 1,
            medId: createStrategyAndTreatmentDto.medId
        });

        await strategyAndTreatment.createResearchObjectives(createStrategyAndTreatmentDto.researchObjectives.map((dto) => ({
            icon: dto.icon,
            title: dto.title,
            description: dto.description,
            published: dto.published
        })));

        return strategyAndTreatment;
    }

    public async updateStrategyAndTreatment(id: string, updateData: UpdateStrategyAndTreatmentDto) {
        const strategyAndTreatment = await this.findStrategyAndTreatmentById(id);
        await strategyAndTreatment.update({
            icon: updateData.icon,
            title: updateData.title,
            description: updateData.description,
            published: updateData.published
        });

        if (updateData.researchObjectives) {
            await strategyAndTreatment.deleteResearchObjective(updateData.researchObjectives);
            await strategyAndTreatment.updateResearchObjectives(updateData.researchObjectives);
        }

        return strategyAndTreatment;
    }

    public async deleteStrategyAndTreatment(id: string) {
        const strategyAndTreatment = await this.findStrategyAndTreatmentById(id);
        await strategyAndTreatment.destroy();
        return { success: true };
    }

    private async findStrategyAndTreatmentById(id: string) {
        const strategyAndTreatment = await StrategyAndTreatment.findByPk(id, {
            include: [{ model: ResearchObjectives }]
        });

        if (!strategyAndTreatment) {
            throw new NotFoundException(`Strategy And Treatment with ID ${id} not found`);
        }

        return strategyAndTreatment;
    }
}
