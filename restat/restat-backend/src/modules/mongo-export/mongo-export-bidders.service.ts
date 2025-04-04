// src/services/mongo-export.service.ts
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { MongoClient, MongoClientOptions } from "mongodb";
import * as fs from "fs/promises";
import * as path from "path";
import { Users } from "src/common/models/users.model";
import { v5 as uuidv5 } from "uuid";
import { ROLES } from "src/common/constants/roles";
import { ConfigService } from "@nestjs/config";
import { AuthenticateUserDto } from "../auth/dto/authenticate.dto";
import FirebaseService from "src/common/firebase/firebase.service";

@Injectable()
export class MongoExportBiddersService {
  constructor(private readonly configService: ConfigService) { }
  private readonly mongoUrl = this.configService.get("MONGO_URL");

  async exportBiddersData() {
    const clientOptions: MongoClientOptions = {};
    const client = new MongoClient(this.mongoUrl, clientOptions);

    try {
      await client.connect();
      const collectionName = "bidders";
      const collection = client.db().collection(collectionName);
      const data = await collection.find({}).toArray();

      const fileName = `${collectionName}.json`;
      await fs.writeFile(fileName, JSON.stringify(data, null, 2));
      const currentDir = __dirname;
      // Get the main backend dir from __dirname
      const targetDir = path.resolve(currentDir, "..", "..", "..");

      // Construct the full path to the file using the absolute target directory
      const fullPathToFile = path.join(targetDir, fileName);

      // Write the file using the absolute path
      await fs.writeFile(fullPathToFile, JSON.stringify(data, null, 2));

      // Read the file using the absolute path
      const jsonData = await fs.readFile(fullPathToFile, "utf-8");
      const biddersData = JSON.parse(jsonData);
      const bulkInsertBidders = [];
      for (const bidderData of biddersData) {
        const existingBidder = await Users.findOne({
          where: { email: bidderData.email },
        });
        if (!existingBidder) {
          bulkInsertBidders.push({
            id: uuidv5(bidderData._id, uuidv5.URL),
            companyId: uuidv5(bidderData.company, uuidv5.URL),
            name: bidderData.name,
            email: bidderData.email,
            role: ROLES.BIDDER,
            createdAt: new Date(bidderData.createdAt),
            updatedAt: new Date(bidderData.updatedAt),
          });
        }
      }
      await Users.bulkCreate(bulkInsertBidders);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        "Something went wrong while retrieving the data"
      );
    } finally {
      await client.close();
    }
  }

  // authenticate the exported bidder, first of all you have to create an API endpoint and test it in postman for registering the exported bidder in firebase
  public async authenticateExportedBidder(data: AuthenticateUserDto) {
    try {
      const {
        user: {
          firebase: { sign_in_provider },
        },
        additionalInformation: { uid, email, displayName },
      } = await FirebaseService.decodeIdToken(data.idToken);

      const user = await Users.findOne({ where: { email } });
      if (!user) {
        throw new NotFoundException("Bidder does not exist!");
      }
      user.provider = sign_in_provider;
      user.uid = uid;
      user.name = displayName;
      await user.save();

      return { message: "Successfully authenticated", user };
    } catch (e) {
      console.error(e);
      throw new UnauthorizedException();
    }
  }
}
