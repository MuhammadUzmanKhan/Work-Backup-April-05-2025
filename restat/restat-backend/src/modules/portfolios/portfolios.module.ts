import { Module } from '@nestjs/common';
import { PortfoliosController } from './portfolios.controller';
import { PortfolioService } from './portfolios.service';
import { LinkService } from '../links/links.service';
import { TagService } from '../tags/tags.service';
import { PortfolioLinksTagsService } from './portfolios-tags-links.service';

@Module({
    controllers: [PortfoliosController],
    providers: [PortfolioService, LinkService, TagService, PortfolioLinksTagsService]
})
export class PortfoliosModule { }
