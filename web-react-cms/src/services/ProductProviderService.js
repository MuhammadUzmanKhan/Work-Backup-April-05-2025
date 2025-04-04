import { API } from 'aws-amplify';

import RequestService from './RequestService';

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/product_provider';

export default new RequestService(apiName, path, API);
