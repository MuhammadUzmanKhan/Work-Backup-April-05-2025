import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { bidsMessages } from "src/common/constants/messages";
import { Bids } from "src/common/models/bids.model";
import { BidStatus } from "src/types/enum";

@Injectable()
export class UpdateBidsScriptService {
  public async updateBids() {
    try {
      // Update the status of bids where bidResponse is true to "Active"
      const updatedCount = await Bids.update(
        { status: BidStatus.ACTIVE },
        { where: { bidResponse: true } }
      );
      return {
        message: bidsMessages.bidUpdated,
        updatedCount
      }
    } catch (err) {
      console.error(bidsMessages.bidUpdateError, err);
      throw new InternalServerErrorException(
        bidsMessages.bidUpdateError
      )
    }
  }
}
