import { Controller, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { RoleGuard } from "src/common/guards/role.guard";
import { ROLES } from "src/common/constants/roles";
import { UpdateBidsScriptService } from "./update-bids-script.service";

@Controller("")
export class UpdateBidsScriptController {
  constructor(private readonly updateBidsScriptService: UpdateBidsScriptService) { }

  @ApiBearerAuth()
  @Put("/update/bids/script")
  @UseGuards(RoleGuard(ROLES.COMPANY_ADMIN, ROLES.OWNER, ROLES.BIDDER))
  public updateBids(
  ) {
    return this.updateBidsScriptService.updateBids();
  }


}
