// // src/services/mongo-export.service.ts
// import { Injectable, InternalServerErrorException } from "@nestjs/common";
// import { MongoClient, MongoClientOptions } from "mongodb";
// import * as fs from "fs/promises";
// import * as path from "path";
// import { Portfolios } from "src/common/models/portfolios.model";
// import { v5 as uuidv5 } from "uuid";
// import { PORTFOLIO_TYPE } from "src/common/constants/portfolio_type";
// import { Source } from "src/types/enum";
// import { TagService } from "../tags/tags.service";
// import { ConfigService } from "@nestjs/config";

// @Injectable()
// export class MongoExportTemplatesService {
//   constructor(
//     private readonly tagService: TagService,
//     private readonly configService: ConfigService
//   ) { }
//   private readonly mongoUrl = this.configService.get("MONGO_URL");
//   async exportTemplatesData() {
//     const clientOptions: MongoClientOptions = {};
//     const client = new MongoClient(this.mongoUrl, clientOptions);
//     await client.connect();
//     const collectionName = "templates";
//     const collection = client.db().collection(collectionName);

//     const data = await collection.find({}).toArray();

//     const fileName = `${collectionName}.json`;
//     await fs.writeFile(fileName, JSON.stringify(data, null, 2));
//     const currentDir = __dirname;
//     const targetDir = path.resolve(currentDir, "..", "..", "..");
//     const fullPathToFile = path.join(targetDir, fileName);
//     await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
//     const jsonData = await fs.readFile(fullPathToFile, "utf-8");
//     const templatesData = JSON.parse(jsonData);
//     for (const templateData of templatesData) {
//       // There may be some duplicate names in the mapped data, that's why I am finding the projects based on the description as well
//       try {
//         let portfolio = await Portfolios.findOne({
//           where: {
//             name: templateData.name,
//             description: templateData.description,
//             companyId: uuidv5(templateData.company, uuidv5.URL),
//           },
//         });
//         if (!portfolio) {
//           portfolio = await Portfolios.create({
//             id: uuidv5(templateData._id, uuidv5.URL),
//             clickupId: templateData.id,
//             name: templateData.name,
//             description: templateData.description,
//             companyId: uuidv5(templateData.company, uuidv5.URL),
//             type: PORTFOLIO_TYPE.TEMPLATE,
//             createdAt: new Date(templateData.createdAt),
//             updatedAt: new Date(templateData.updatedAt),
//           });
//         }

//         const _tags: string[] = [];
//         for (const _tag of templateData.tags) {
//           _tags.push(_tag.name);
//         }
//         const { tags } = await this.tagService.createTags(
//           _tags,
//           Source.CUSTOM,
//         );
//         await portfolio.assignPortfoloTags(
//           tags,
//           templateData.createdAt,
//           templateData.updatedAt
//         );
//       } catch (err: any) {
//         console.error(err);
//         if (err.parent && err.parent.constraint !== "portfolios_companyId_fkey")
//           throw new InternalServerErrorException(
//             "Something went wrong while retrieving the data"
//           );
//       }
//     }
//     await client.close();
//   }
// }
