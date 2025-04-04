import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ERRORS } from '@ontrack-tech-group/common/constants';
import { calculatePagination } from '@ontrack-tech-group/common/helpers';
import { InformationRequest } from '@ontrack-tech-group/common/models';
import { CommunicationService } from '@ontrack-tech-group/common/services';
import { CreateInformationRequestDto } from './dto/create-information-request.dto';

@Injectable()
export class InformationRequestService {
  constructor(
    private readonly configService: ConfigService,
    private readonly communicationService: CommunicationService,
  ) {}

  async createInformationRequest(
    createInformationRequestDto: CreateInformationRequestDto,
  ) {
    const informationRequest = await InformationRequest.create(
      { ...createInformationRequestDto },
      { returning: true },
    );
    if (!informationRequest)
      throw new UnprocessableEntityException(ERRORS.SOMETHING_WENT_WRONG);

    await this.communicationService.communication(
      createInformationRequestDto,
      'public-contact',
    );

    return informationRequest;
  }

  async getAllInformationRequests(page = 0, page_size: number) {
    const informationRequests = await InformationRequest.findAndCountAll({
      limit: page_size || parseInt(this.configService.get('PAGE_LIMIT')),
      offset:
        (page_size || parseInt(this.configService.get('PAGE'))) * page ||
        parseInt(this.configService.get('PAGE')) * page,
    });
    const { rows, count } = informationRequests;

    return {
      data: rows,
      pagination: calculatePagination(
        count,
        page_size || parseInt(this.configService.get('PAGE_LIMIT')),
        page || parseInt(this.configService.get('PAGE')),
      ),
    };
  }

  async getInformationRequestById(id: number) {
    const informationRequest: InformationRequest =
      await InformationRequest.findByPk(id, { raw: true });

    if (!informationRequest)
      throw new NotFoundException(ERRORS.INFORMATION_REQUEST_NOT_FOUND);

    return informationRequest;
  }
}
