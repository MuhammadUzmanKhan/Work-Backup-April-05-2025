// src/services/mongo-export.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MongoClient, MongoClientOptions } from "mongodb";
import * as fs from "fs/promises";
import * as path from "path";
import { v5 as uuidv5 } from "uuid";
import { Industries } from "src/common/models/industries.model";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MongoExportIndustriesService {
  constructor(private readonly configService: ConfigService) { }
  private readonly mongoUrl = this.configService.get("MONGO_URL");

  async exportIndustriesData() {
    const clientOptions: MongoClientOptions = {};
    const client = new MongoClient(this.mongoUrl, clientOptions);

    try {
      await client.connect();
      const collectionName = "industries";
      const collection = client.db().collection(collectionName);
      const data = await collection.find({}).toArray();
      const fileName = `${collectionName}.json`;
      const currentDir = __dirname;
      const targetDir = path.resolve(currentDir, "..", "..", "..");
      const fullPathToFile = path.join(targetDir, fileName);
      await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
      const jsonData = await fs.readFile(fullPathToFile, "utf-8");
      const industriesData = JSON.parse(jsonData);
      const bulkInsertIndustries = [];
      for (const industryData of industriesData) {
        const existingIndustry = await Industries.findOne({
          where: { name: industryData.name },
        });
        if (!existingIndustry) {
          bulkInsertIndustries.push({
            id: uuidv5(industryData._id, uuidv5.URL),
            name: industryData.name,
          });
        }
      }
      await Industries.bulkCreate(bulkInsertIndustries);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        "Something went wrong while retrieving the data"
      );
    } finally {
      await client.close();
    }
  }
}
