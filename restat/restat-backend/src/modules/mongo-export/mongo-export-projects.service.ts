// // src/services/mongo-export.service.ts
// import { Injectable, InternalServerErrorException } from "@nestjs/common";
// import { MongoClient, MongoClientOptions } from "mongodb";
// import * as fs from "fs/promises";
// import * as path from "path";
// import { Portfolios } from "src/common/models/portfolios.model";
// import { v5 as uuidv5 } from "uuid";
// import { PORTFOLIO_TYPE } from "src/common/constants/portfolio_type";
// import { Links } from "src/common/models/links.model";
// import { Source } from "src/types/enum";
// import { TagService } from "../tags/tags.service";
// import { ConfigService } from "@nestjs/config";

// @Injectable()
// export class MongoExportProjectsService {
//   constructor(
//     private readonly tagService: TagService,
//     private readonly configService: ConfigService
//   ) { }
//   private readonly mongoUrl = this.configService.get("MONGO_URL");

//   async exportProjectsData() {
//     const clientOptions: MongoClientOptions = {};
//     const client = new MongoClient(this.mongoUrl, clientOptions);

//     try {
//       await client.connect();
//       const collectionName = "projects";
//       const collection = client.db().collection(collectionName);
//       const data = await collection.find({}).toArray();

//       const fileName = `${collectionName}.json`;
//       await fs.writeFile(fileName, JSON.stringify(data, null, 2));
//       const currentDir = __dirname;
//       const targetDir = path.resolve(currentDir, "..", "..", "..");
//       const fullPathToFile = path.join(targetDir, fileName);
//       await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
//       const jsonData = await fs.readFile(fullPathToFile, "utf-8");
//       const projectsData = JSON.parse(jsonData);
//       for (const projectData of projectsData) {
//         // There may be some duplicate names in the mapped data, that's why I am finding the projects based on the description as well
//         let portfolio = await Portfolios.findOne({
//           where: {
//             name: projectData.name,
//             description: projectData.description,
//             companyId: uuidv5(projectData.company, uuidv5.URL),
//           },
//         });
//         if (!portfolio) {
//           portfolio = await Portfolios.create({
//             id: uuidv5(projectData._id, uuidv5.URL),
//             clickupId: projectData.id,
//             name: projectData.name,
//             description: projectData.description,
//             companyId: uuidv5(projectData.company, uuidv5.URL),
//             type: PORTFOLIO_TYPE.PROJECT,
//             createdAt: new Date(projectData.createdAt),
//             updatedAt: new Date(projectData.updatedAt),
//           });
//         }
//         const bulkInsertLinks: any = [];
//         for (const custom_field of projectData.custom_fields) {
//           if (custom_field.type === "url" && custom_field.value) {
//             const linkAlreadyExists = await Links.findOne({
//               where: { url: custom_field.value },
//             });
//             if (!linkAlreadyExists) {
//               bulkInsertLinks.push({
//                 url: custom_field.value,
//                 portfolioId: portfolio.id,
//                 createdAt: new Date(projectData.createdAt),
//                 updatedAt: new Date(projectData.updatedAt),
//               });
//             }
//           }
//         }
//         await Links.bulkCreate(bulkInsertLinks);
//         const _tags: string[] = [];
//         for (const _tag of projectData.tags) {
//           _tags.push(_tag.name);
//         }
//         if (_tags.length !== 0) {
//           const { tags } = await this.tagService.createTags(
//             _tags,
//             Source.CUSTOM,
//           );
//           await portfolio.assignPortfoloTags(
//             tags,
//             projectData.createdAt,
//             projectData.updatedAt
//           );
//         }
//       }
//     } catch (err) {
//       console.error(err);
//       throw new InternalServerErrorException(
//         "Something went wrong while retrieving the data"
//       );
//     } finally {
//       await client.close();
//     }
//   }
// }
