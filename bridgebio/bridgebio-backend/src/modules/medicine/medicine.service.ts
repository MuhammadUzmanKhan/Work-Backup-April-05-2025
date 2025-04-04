import { Injectable, NotFoundException } from '@nestjs/common';
import { Medicines } from '@common/models/medicines.model';
import { UpdateMedicineDto } from './dto/update.dto';
import { CreateMedicineDto } from './dto/create.dto';

@Injectable()
export class MedicinesService {
    constructor() { }

    public async getMedicineById(id: string) {
        return await this.findMedicineById(id);
    }

    public async getAllMedicines() {
        return await Medicines.findAll();
    }

    public async createMedicine(createMedicineDto: CreateMedicineDto) {
        return await Medicines.create(createMedicineDto);
    }

    public async updateMedicine(id: string, updateData: UpdateMedicineDto) {
        const medicine = await this.findMedicineById(id);
        await medicine.update(updateData);
        return medicine;
    }

    public async deleteMedicine(id: string) {
        const medicine = await this.findMedicineById(id);
        await medicine.destroy();

        return { success: true };
    }

    private async findMedicineById(id: string) {
        const medicine = await Medicines.findByPk(id);

        if (!medicine) {
            throw new NotFoundException(`Medicine with ID ${id} not found`);
        }

        return medicine;
    }
}
