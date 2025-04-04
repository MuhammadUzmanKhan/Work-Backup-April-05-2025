import { API } from 'aws-amplify';

import RequestService from './RequestService';

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/product_tag';

export default new RequestService(apiName, path, API);
