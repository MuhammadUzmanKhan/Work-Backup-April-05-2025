import { Controller, Get } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Public } from 'src/common/decorators/public.meta';

@Controller('categories')
export class CategoriesController {

    constructor(private readonly catagoriesService: CategoriesService) { }

    @Public()
    @Get()
    public getAllCategories() {
        return this.catagoriesService.getAllCategories();
    }

}
