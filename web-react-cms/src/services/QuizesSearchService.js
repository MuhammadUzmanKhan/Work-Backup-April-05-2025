import { API } from 'aws-amplify';
import RequestService from './RequestService';

class QuizesSearchService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API);
  }
}

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/question/search';

export default new QuizesSearchService(apiName, path, API);
