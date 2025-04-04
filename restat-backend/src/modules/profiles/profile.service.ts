import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ProfileDto } from "./dto/profile.dto";
import { Profiles } from "src/common/models/profiles.model";
import { SOURCE } from "src/common/constants/source";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { profileMessages } from "src/common/constants/messages";
// import { Op } from "sequelize";

@Injectable()
export class ProfileService {
  public async createProfile(
    companyId: string,
    { profileDto }: { profileDto: ProfileDto }
  ) {
    let { name, url, source } = profileDto;
    // searching on the base of just url and companyId is also sufficient but in case of an empty url, name and source are also added
    const profileExists = await Profiles.findOne({
      where: {
        url,
        companyId,
      },
    });
    if (profileExists) {
      throw new ConflictException(profileMessages.profileAlreadyExists);
    }
    try {
      const profile = await Profiles.create({
        name,
        source,
        url,
        companyId,
      });

      return {
        message: profileMessages.profileCreated,
        profile,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        profileMessages.profileCreateError,
      );
    }
  }

  public async updateProfile(
    { profileDto }: { profileDto: UpdateProfileDto }
  ) {
    let { id, name, source, url } = profileDto;
    // searching on the base of just url and companyId is also sufficient but in case of an empty url, name and source are also added
    const profileExists = await Profiles.findByPk(id);
    if (!profileExists) {
      throw new ConflictException(profileMessages.profileNotFound);
    }
    try {
      if (name) {
        profileExists.name = name;
      }
      if (source) {
        profileExists.source = source;
      }
      if (url) {
        profileExists.url = url;
      }
      await profileExists.save();
      return {
        message: profileMessages.profileUpdated,
        profileExists,
      };
    } catch (err) {
      throw new InternalServerErrorException(
        profileMessages.profileUpdateError,
      );
    }
  }

  public async getAllCompanyProfiles(companyId: string, source: SOURCE) {
    try {
      const profiles = await Profiles.findAll({
        where: { companyId, source },
      });
      return {
        message: profileMessages.profilesFetched,
        profiles,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        profileMessages.profilesFetchedError,
      );
    }
  }

  public async getCompanyProfiles(
    companyId: string,
    page: number,
    perPage: number = 20,
  ) {
    try {
      const profilesPerPage = perPage;
      const offset = (page - 1) * profilesPerPage;
      const options: any = {
        where: { companyId },
        offset,
        limit: profilesPerPage,
      };
      const profiles = await Profiles.findAll(options);
      let profilesCount = await Profiles.count({
        where: options.where,
      });

      return {
        message: profileMessages.companyProfilesFetched,
        page,
        profiles,
        profilesPerPage,
        profilesCount,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        profileMessages.companyProfilesFetchedError,
      );
    }
  }

  public async getAllProfiles(source: SOURCE) {
    try {
      const profiles = await Profiles.findAll({
        where: { source },
      });
      return {
        message: profileMessages.profilesFetched,
        profiles,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        profileMessages.profilesFetchedError,
      );
    }
  }

  public async getProfileById(id: string) {
    try {
      const profile = await Profiles.findByPk(id);
      return {
        message: profileMessages.profileByIdFetched,
        profile,
      };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException(
        profileMessages.profileByIdFetchedError,
      );
    }
  }

  public async deleteProfile(id: string) {
    const user = await Profiles.findByPk(id);
    await user.destroy();
    return {
      success: true,
      message: profileMessages.profileDeleted,
    };
  }
}
