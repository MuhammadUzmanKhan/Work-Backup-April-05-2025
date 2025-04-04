import { API } from 'aws-amplify';

import RequestService from './RequestService';

const apiName = 'MyAPIGatewayAPI';
const path = '/user/dashboard';

export default new RequestService(apiName, path, API);
