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
// export class MongoExportGithubLinksService {
//   constructor(
//     private readonly tagService: TagService,
//     private readonly configService: ConfigService
//   ) { }
//   private readonly mongoUrl = this.configService.get("MONGO_URL");

//   async exportGithubLinksData() {
//     const clientOptions: MongoClientOptions = {};
//     const client = new MongoClient(this.mongoUrl, clientOptions);

//     try {
//       await client.connect();
//       const collectionName = "github-links";
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
//       const githubLinksData = JSON.parse(jsonData);
//       for (const githubLinkData of githubLinksData) {
//         // There may be some duplicate names in the mapped data, that's why I am finding the projects based on the description as well
//         // testing user was violating the portfolio_companyId foreign key
//         if (githubLinkData.name !== "Testing User") {
//           let portfolio = await Portfolios.findOne({
//             where: {
//               name: githubLinkData.name,
//               description: githubLinkData.description,
//               companyId: uuidv5(githubLinkData.company, uuidv5.URL),
//             },
//           });
//           if (!portfolio) {
//             portfolio = await Portfolios.create({
//               id: uuidv5(githubLinkData._id, uuidv5.URL),
//               clickupId: githubLinkData.id,
//               name: githubLinkData.name,
//               description: githubLinkData.description,
//               companyId: uuidv5(githubLinkData.company, uuidv5.URL),
//               type: PORTFOLIO_TYPE.LINK,
//               createdAt: new Date(githubLinkData.createdAt),
//               updatedAt: new Date(githubLinkData.updatedAt),
//             });
//           }
//           if (githubLinkData.description) {
//             await Links.create({
//               url: githubLinkData.description,
//               portfolioId: portfolio.id,
//               createdAt: githubLinkData.createdAt,
//               updatedAt: githubLinkData.updatedAt,
//             });
//           }

//           const _tags: string[] = [];
//           for (const _tag of githubLinkData.tags) {
//             _tags.push(_tag.name);
//           }
//           if (_tags.length > 0) {
//             const { tags } = await this.tagService.createTags(
//               _tags,
//               Source.CUSTOM,
//             );
//             await portfolio.assignPortfoloTags(
//               tags,
//               githubLinkData.createdAt,
//               githubLinkData.updatedAt
//             );
//           }
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
