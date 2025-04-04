// import { Body, Controller, Post, UseGuards } from '@nestjs/common';
// import { PortfolioService } from './portfolios.service';
// // import { Public } from 'src/common/decorators/public.meta';
// // import { BidDto } from './dto/bid.dto';
// import { ApiBearerAuth } from '@nestjs/swagger';
// import { RoleGuard } from 'src/common/guards/role.guard';
// import { ROLES } from 'src/common/constants/roles';
// import { AuthUser } from 'src/common/decorators/auth-request-user.meta';
// import { Users } from 'src/common/models/users.model';
// import { PortfolioDto } from './dto/portfolio.dto';

// @Controller('portfolios')
// export class PortfoliosController {
//     constructor(private readonly portfolioService: PortfolioService) { }

//     @ApiBearerAuth()
//     @Post('/create')
//     @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN))
//     public createPortfolio(
//         @AuthUser() user: Users,
//         @Body() portfolioDto: PortfolioDto
//     )
//     {
//         return this.portfolioService.createPortfolio(user.companyId, portfolioDto)
//     }
// }
