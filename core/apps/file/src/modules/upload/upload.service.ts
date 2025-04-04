import 'multer';

import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERRORS } from '@ontrack-tech-group/common/constants';
import { uploadImage as commonUploadImage } from '@ontrack-tech-group/common/helpers';
import { User } from '@ontrack-tech-group/common/models';

@Injectable()
export class UploadService {
  constructor(private readonly configService: ConfigService) {}

  public async uploadImage(file: Express.Multer.File, user: User) {
    if (!file) throw new BadRequestException(ERRORS.FILE_MISSING);

    return await commonUploadImage(
      file,
      this.configService,
      user['company_id'],
    );
  }
}
