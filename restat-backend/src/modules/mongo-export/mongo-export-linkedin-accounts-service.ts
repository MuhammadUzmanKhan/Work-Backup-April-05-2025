// src/services/mongo-export.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MongoClient, MongoClientOptions } from "mongodb";
import * as fs from "fs/promises";
import * as path from "path";
import { Users } from "src/common/models/users.model";
import { ConfigService } from "@nestjs/config";
import { LinkedinAccountInstitutionDegreeService } from "../linkedin-accounts/linkedin-contact.service";
import { v5 as uuidv5 } from "uuid";

@Injectable()
export class MongoExportLinkedinAccountsDataService {
  constructor(
    private readonly configService: ConfigService,
    private readonly linkedinAccountDataService: LinkedinAccountInstitutionDegreeService
  ) { }
  private readonly mongoUrl = this.configService.get("MONGO_URL");

  async exportLinkedinAccountsData(pageNumber: number) {
    const clientOptions: MongoClientOptions = {};
    const client = new MongoClient(this.mongoUrl, clientOptions);

    try {
      await client.connect();
      const collectionName = "linkedin-connects";
      const collection = client.db().collection(collectionName);
      const pageSize = 100;
      const skipValue = (pageNumber - 1) * pageSize;

      const data = await collection
        .find()
        .skip(skipValue)
        .limit(pageSize)
        .toArray();

      const fileName = `${collectionName}.json`;
      await fs.writeFile(fileName, JSON.stringify(data, null, 2));
      const currentDir = __dirname;
      const targetDir = path.resolve(currentDir, "..", "..", "..");
      const fullPathToFile = path.join(targetDir, fileName);
      await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
      const jsonData = await fs.readFile(fullPathToFile, "utf-8");
      const linkedinConnectsData = JSON.parse(jsonData);
      for (const linkedinConnectData of linkedinConnectsData) {
        // There may be some duplicate names in the mapped data, that's why I am finding the projects based on the description as well
        let user = await Users.findOne({
          where: {
            email: linkedinConnectData.businessDeveloper,
          },
        });
        if (user) {
          const bidProfile = uuidv5(linkedinConnectData.bidProfile, uuidv5.URL);
          const industry = uuidv5(linkedinConnectData.industry, uuidv5.URL);
          delete linkedinConnectData.bidProfile;
          delete linkedinConnectData.industry;
          const linkedinAccountData = {
            linkedinAccountDto: {
              bidProfile,
              industry,
              ...linkedinConnectData,
            },
          };
          await this.linkedinAccountDataService.syncConnectAndSyncProspect(
            user,
            linkedinAccountData
          );
        }
      }
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
