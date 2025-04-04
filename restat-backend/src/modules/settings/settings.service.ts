import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { SettingsDto } from "./dto/settings.dto";
import { Settings } from "src/common/models/settings.model";
import { Users } from "src/common/models/users.model";
import { EXCEPTIONS } from "src/common/constants/exceptions";
import { settingsMessages } from "src/common/constants/messages";

@Injectable()
export class SettingsService {
  constructor() { }
  public async createCompanySettings(
    { settingsDto }: { settingsDto: SettingsDto },
    user: Users
  ) {
    const { sessionTimeout } = settingsDto;
    const settingsExists = await Settings.findOne({ where: { companyId: user.companyId } });
    if (!settingsExists) {
      throw new NotFoundException(EXCEPTIONS.COMPANY_NOT_FOUND)
    }
    if (sessionTimeout) {
      settingsExists.sessionTimeout = sessionTimeout;
    }
    try {
      await settingsExists.save();
      return {
        message: settingsMessages.settingsUpdated,
        settings: settingsExists,
      };
    } catch (err) {
      console.error(settingsMessages.settingsUpdateError, err);
      throw new InternalServerErrorException(
        settingsMessages.settingsUpdateError
      );
    }
  }

  public async createUserSettings(
    { settingsDto }: { settingsDto: SettingsDto },
    user: Users
  ) {
    const { autoClose, defaultTab } = settingsDto;
    const settingsExists = await Settings.findOne({ where: { userId: user.id } });
    if (settingsExists) {
      if (autoClose) {
        settingsExists.autoClose = autoClose;
      }
      if (defaultTab) {
        settingsExists.defaultTab = defaultTab;
      }
      await settingsExists.save();
      return {
        message: settingsMessages.settingsUpdated,
        settings: settingsExists,
      };
    }
    try {
      const settings = await Settings.create({
        autoClose,
        defaultTab,
        userId: user.id,
        companyId: user.companyId
      });
      return {
        message: settingsMessages.userSettingsCreated,
        settings,
      };
    } catch (err) {
      console.error(settingsMessages.userSettingsCreated, err);
      throw new InternalServerErrorException(
        settingsMessages.userSettingsCreateError
      );
    }
  }
}
