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
// export class MongoExportCodeSnippetsService {
//   constructor(
//     private readonly tagService: TagService,
//     private readonly configService: ConfigService
//   ) { }
//   private readonly mongoUrl = this.configService.get("MONGO_URL");
//   async exportCodeSnippetsData() {
//     const clientOptions: MongoClientOptions = {};
//     const client = new MongoClient(this.mongoUrl, clientOptions);

//     try {
//       await client.connect();
//       const collectionName = "code-snippets";
//       const collection = client.db().collection(collectionName);
//       //   const data = await collection
//       //     .aggregate([{ $sample: { size: 5 } }])
//       //     .toArray();

//       const data = await collection.find({}).toArray();

//       const fileName = `${collectionName}.json`;
//       await fs.writeFile(fileName, JSON.stringify(data, null, 2));
//       const currentDir = __dirname;
//       const targetDir = path.resolve(currentDir, "..", "..", "..");
//       const fullPathToFile = path.join(targetDir, fileName);
//       await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));
//       const jsonData = await fs.readFile(fullPathToFile, "utf-8");
//       const codeSnippetsData = JSON.parse(jsonData);
//       for (const codeSnippetData of codeSnippetsData) {
//         // There may be some duplicate names in the mapped data, that's why I am finding the projects based on the description as well
//         let portfolio = await Portfolios.findOne({
//           where: {
//             name: codeSnippetData.name,
//             description: codeSnippetData.description,
//             companyId: uuidv5(codeSnippetData.company, uuidv5.URL),
//           },
//         });
//         if (!portfolio) {
//           portfolio = await Portfolios.create({
//             id: uuidv5(codeSnippetData._id, uuidv5.URL),
//             clickupId: codeSnippetData.id,
//             name: codeSnippetData.name,
//             description: codeSnippetData.description,
//             companyId: uuidv5(codeSnippetData.company, uuidv5.URL),
//             type: PORTFOLIO_TYPE.LINK,
//             createdAt: new Date(codeSnippetData.createdAt),
//             updatedAt: new Date(codeSnippetData.updatedAt),
//           });
//         }
//         if (codeSnippetData.description) {
//           await Links.create({
//             url: codeSnippetData.description,
//             portfolioId: portfolio.id,
//             createdAt: new Date(codeSnippetData.createdAt),
//             updatedAt: new Date(codeSnippetData.updatedAt),
//           });
//         }

//         const _tags: string[] = [];
//         for (const _tag of codeSnippetData.tags) {
//           _tags.push(_tag.name);
//         }
//         const { tags } = await this.tagService.createTags(
//           _tags,
//           Source.CUSTOM,
//         );
//         await portfolio.assignPortfoloTags(
//           tags,
//           codeSnippetData.createdAt,
//           codeSnippetData.updatedAt
//         );
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
