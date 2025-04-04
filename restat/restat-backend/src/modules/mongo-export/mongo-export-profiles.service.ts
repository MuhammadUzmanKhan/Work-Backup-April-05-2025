// src/services/mongo-export.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MongoClient, MongoClientOptions } from "mongodb";
import * as fs from "fs/promises";
import * as path from "path";
import { v5 as uuidv5 } from "uuid";
import { Profiles } from "src/common/models/profiles.model";
import { SOURCE } from "src/common/constants/source";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MongoExportProfilesService {
  constructor(private readonly configService: ConfigService) { }
  private readonly mongoUrl = this.configService.get("MONGO_URL");

  async exportProfilesData() {
    const clientOptions: MongoClientOptions = {};
    const client = new MongoClient(this.mongoUrl, clientOptions);

    try {
      await client.connect();
      const collectionName = "linkedin-profiles";
      const collection = client.db().collection(collectionName);
      const data = await collection.find({}).toArray();

      const fileName = `${collectionName}.json`;
      await fs.writeFile(fileName, JSON.stringify(data, null, 2));
      const currentDir = __dirname;
      const targetDir = path.resolve(currentDir, "..", "..", "..");
      const fullPathToFile = path.join(targetDir, fileName);
      await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
      const jsonData = await fs.readFile(fullPathToFile, "utf-8");
      const profilesData = JSON.parse(jsonData);
      const bulkInsertProfiles = [];
      for (const profileData of profilesData) {
        const existingProfile = await Profiles.findOne({
          where: {
            url: profileData.url,
            companyId: uuidv5(profileData.company, uuidv5.URL),
          },
        });
        if (!existingProfile) {
          //   convert id to uuid format
          bulkInsertProfiles.push({
            id: uuidv5(profileData._id, uuidv5.URL),
            companyId: uuidv5(profileData.company, uuidv5.URL),
            name: profileData.name,
            url: profileData.url,
            source: SOURCE.LINKEDIN,
          });
        }
      }
      await Profiles.bulkCreate(bulkInsertProfiles);
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
