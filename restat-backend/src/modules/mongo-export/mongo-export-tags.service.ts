// src/services/mongo-export.service.ts
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { MongoClient, MongoClientOptions } from "mongodb";
import * as fs from "fs/promises";
import * as path from "path";
import { v5 as uuidv5 } from "uuid";
import { Tags } from "src/common/models/tags.model";
import { Source } from "src/types/enum";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MongoExportTagsService {
  constructor(
    private readonly configService: ConfigService
  ) { }
  private readonly mongoUrl = this.configService.get("MONGO_URL");
  async exportTagsData() {
    const clientOptions: MongoClientOptions = {};
    const client = new MongoClient(this.mongoUrl, clientOptions);

    try {
      await client.connect();
      const collectionName = "tags";
      const collection = client.db().collection(collectionName);
      const data = await collection.find({}).toArray();

      const fileName = `${collectionName}.json`;
      await fs.writeFile(fileName, JSON.stringify(data, null, 2));
      const currentDir = __dirname;
      const targetDir = path.resolve(currentDir, "..", "..", "..");
      const fullPathToFile = path.join(targetDir, fileName);
      await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
      const jsonData = await fs.readFile(fullPathToFile, "utf-8");
      const tagsData = JSON.parse(jsonData);
      const bulkInsertTags = [];
      const bulkInsertTagsNames = [];
      const uniqueTagNames = new Set();
      for (const tagData of tagsData) {
        // Check if bidURL is already in the set
        if (uniqueTagNames.has(tagData.name)) {
          continue; // Skip processing duplicate bidURL, move to next iteration
        }

        // Add bidURL to the set
        uniqueTagNames.add(tagData.name);
        bulkInsertTags.push(tagData);
        bulkInsertTagsNames.push(tagData.name);
      }
      const tagsWithSource = bulkInsertTags.map((ele) => ({
        id: uuidv5(ele._id, uuidv5.URL),
        name: ele.name,
        source: Source.CUSTOM,
        createdAt: new Date(ele.createdAt),
        updatedAt: new Date(ele.updatedAt),
      }));
      // Find the tags whose names match with the names in the `tags` array
      const tagsAlreadyExits = await Tags.findAll({
        where: {
          name: bulkInsertTagsNames,
        },
        attributes: ["name", "id", "source"],
      });
      const existingTagNames = tagsAlreadyExits.map((tag) => tag.name);

      // Filter out the tags that already exist from the tags to create
      const tagsToCreate = tagsWithSource.filter(
        ({ name }) => !existingTagNames.includes(name)
      );

      // Bulk insert the tags
      await Tags.bulkCreate(tagsToCreate);
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
