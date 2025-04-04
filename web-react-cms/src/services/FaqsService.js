import { API } from 'aws-amplify';
import RequestService from './RequestService';

class FaqsService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API);
  }
}

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/faq';

export default new FaqsService(apiName, path, API);
