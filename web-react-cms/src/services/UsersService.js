import { API } from 'aws-amplify';
import RequestService from './RequestService';

class UsersService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API);
  }
}

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/user';

export default new UsersService(apiName, path, API);
