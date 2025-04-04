import { Controller, Get } from '@nestjs/common';
import { ThemesService } from './themes.service';
import { Public } from 'src/common/decorators/public.meta';

@Controller('themes')
export class ThemesController {
  constructor(private readonly themesService: ThemesService) { }

  @Public()
  @Get()
  public getAllThemes() {
    return this.themesService.getAllThemes();
  }
}
