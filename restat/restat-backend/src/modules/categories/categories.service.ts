import { Injectable } from '@nestjs/common';
import { Categories } from 'src/common/models/categories.model';

@Injectable()
export class CategoriesService {
    public async getAllCategories() {
        return await Categories.findAll();
    }

    public async createPresetCategories() {
        const presetCategories = [
            { name: "Accounting Consulting" },
            { name: "Design Creative" },
            { name: "Translation" },
            { name: "Admin Support" },
            { name: "Sales Marketing" },
            { name: "Customer Service" },
            { name: "Engineering Architecture" },
            { name: "Legal" },
            { name: "Data Science Analytics" },
            { name: "IT Networking" },
            { name: "Writing" },
            { name: "Other Domains" },
        ]

        const categories = await Categories.findAll({ attributes: ["name"] });
        const categoriesToCreate = presetCategories.filter((({ name }) => !categories.find(t => t.name === name)));
        await Categories.bulkCreate(categoriesToCreate);
    }
}
