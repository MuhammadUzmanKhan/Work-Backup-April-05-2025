import { S3 } from 'aws-sdk';
import archiver from 'archiver';
import { Response } from 'express';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { modifyFileNames } from '@ontrack-tech-group/common/helpers';
import { Region } from '@ontrack-tech-group/common/models';

@Injectable()
export class DownloadAttachmentsService {
  constructor(private readonly configService: ConfigService) {}

  private getS3(region: string): S3 {
    return new S3({
      accessKeyId: this.configService.get('ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('SECRET_ACCESS_KEY'),
      region,
      httpOptions: { timeout: 300000 },
    });
  }

  private extractBucketRegionAndFilePath(
    url: string,
    regions: Region[],
  ): { region: string; bucket: string; filePath: string } {
    // this check simple s3 bucket url and get bucket url along with bucket name and region
    const s3UrlMatch = url.match(/(https:\/\/.+?\.s3\..+?\.amazonaws\.com)/);

    // this check cdn url
    const cdnRegionMatch = url.match(/cdn\.([^.]+)\.ontrack.co/);

    // default bucket region and name
    let region = this.configService.get('S3_BUCKET_REGION');
    let bucket = this.configService.get('AWS_BUCKET_NAME');
    let filePath: string;

    if (s3UrlMatch) {
      // get name and region of bucket from simple s3 url
      const bucketAndRegion = s3UrlMatch[1].match(
        /^https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com/,
      );

      if (bucketAndRegion) {
        bucket = bucketAndRegion[1];
        region = bucketAndRegion[2];
      }

      // handles special characters and get file path after bucket url
      filePath = decodeURIComponent(
        url.replace(`${s3UrlMatch[1]}/`, '').replace(/\+/g, ' '),
      );
    } else if (cdnRegionMatch) {
      region = cdnRegionMatch[1];

      // get bucket name by matching aws region from table region
      bucket = regions.find((b) => b['aws_region'] === region)?.['bucket_name'];

      // handles special characters and get file path after cdn url
      filePath = decodeURIComponent(
        url
          .replace(`https://cdn.${region}.ontrack.co/`, '')
          .replace(/\+/g, ' '),
      );
    }

    return { region, bucket, filePath };
  }

  async downloadAttachments(res: Response, urls: string[]) {
    const fileNames = [];

    const regions = await Region.findAll({
      where: { parent_id: null },
      attributes: ['bucket_name', 'aws_region'],
      raw: true,
    });

    const archive = archiver('zip', { zlib: { level: 0 } });
    res.attachment('attachments.zip');
    archive.pipe(res);

    const s3Files = await Promise.all(
      urls.map(async (url) => {
        const { region, bucket, filePath } =
          this.extractBucketRegionAndFilePath(url, regions);

        fileNames.push(filePath.split('/').pop());

        // get s3 instance as it could not be initiate one time as region might be changed in multiple urls
        const s3 = this.getS3(region);

        const response = await s3
          .getObject({ Bucket: bucket, Key: filePath })
          .promise();

        return response.Body as Buffer;
      }),
    );

    const modifiedFileNames = modifyFileNames(fileNames);

    s3Files.forEach((file, index) => {
      archive.append(file as Buffer, { name: modifiedFileNames[index] });
    });

    await archive.finalize();

    return res;
  }
}
