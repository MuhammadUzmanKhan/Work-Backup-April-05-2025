// src/services/mongo-export.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MongoClient, MongoClientOptions } from "mongodb";
import * as fs from "fs/promises";
import * as path from "path";
import { Workspaces } from "src/common/models/workspaces.model";
import { v5 as uuidv5 } from "uuid";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MongoExportCompaniesService {
  constructor(private readonly configService: ConfigService) { }
  private readonly mongoUrl = this.configService.get("MONGO_URL");
  async exportCompaniesData() {
    const clientOptions: MongoClientOptions = {};
    const client = new MongoClient(this.mongoUrl, clientOptions);

    try {
      await client.connect();
      const collectionName = "workspaces";
      const collection = client.db().collection(collectionName);
      const data = await collection.find({}).toArray();

      const fileName = `${collectionName}.json`;
      await fs.writeFile(fileName, JSON.stringify(data, null, 2));
      const currentDir = __dirname;
      const targetDir = path.resolve(currentDir, "..", "..", "..");
      const fullPathToFile = path.join(targetDir, fileName);
      await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
      const jsonData = await fs.readFile(fullPathToFile, "utf-8");
      const companiesData = JSON.parse(jsonData);
      const bulkInsertCompanies = [];
      for (const companyData of companiesData) {
        const existingCompnay = await Workspaces.findOne({
          where: { websiteUrl: companyData.url },
        });
        if (!existingCompnay) {
          // convert id to uuid format
          bulkInsertCompanies.push({
            id: uuidv5(companyData._id, uuidv5.URL),
            name: companyData.name,
            logoUrl: companyData.logo,
            websiteUrl: companyData.url,
            createdAt: new Date(companyData.createdAt),
            updatedAt: new Date(companyData.updatedAt)
          });
        }
      }
      await Workspaces.bulkCreate(bulkInsertCompanies);
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
