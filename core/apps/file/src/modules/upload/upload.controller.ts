import 'multer';
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  COMPANY_ID_API_HEADER,
  UPLOAD_FILE_LIMIT,
} from '@ontrack-tech-group/common/constants';
import { AuthUser } from '@ontrack-tech-group/common/decorators';
import { User } from '@ontrack-tech-group/common/models';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@ApiBearerAuth()
@ApiHeader(COMPANY_ID_API_HEADER)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({
    summary: 'To upload a file',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: UPLOAD_FILE_LIMIT },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @AuthUser() user: User,
  ) {
    return this.uploadService.uploadImage(file, user);
  }
}
