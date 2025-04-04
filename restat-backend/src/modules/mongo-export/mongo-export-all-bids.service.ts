import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MongoExportBidsService } from "./mongo-export-bids.service";

@Injectable()
export class MongoExportAllBidsService {
  constructor(private readonly mongoExportBidsService: MongoExportBidsService) {}

  async exportAllBids() {
    const numberOfCalls = 400;
    const delayBetweenCalls = 3000; // milliseconds

    try {
      for (let i = 0; i < numberOfCalls; i++) {
        // Call the API endpoint
        await this.mongoExportBidsService.exportBidsData(i + 1);

        // Add delay between calls to prevent overwhelming the server
        await this.delay(delayBetweenCalls);
      console.info("Migration successful for page : ", i)
      }
      console.info("Export completed successfully.");
    } catch (error) {
      console.error("Error occurred during export:", error);
      throw new InternalServerErrorException("Export failed");
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
