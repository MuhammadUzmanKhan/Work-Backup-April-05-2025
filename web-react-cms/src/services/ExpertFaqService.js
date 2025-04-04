import { API } from 'aws-amplify';
import RequestService from './RequestService';

class ExpertFaqService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API);
  }
}

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/faq/search';

export default new ExpertFaqService(apiName, path, API);
