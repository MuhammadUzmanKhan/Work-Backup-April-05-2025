import { API } from 'aws-amplify'
import RequestService from './RequestService'

class PermissionsService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API)
  }
}

const apiName = 'MyAPIGatewayAPI'
const path = '/cms/permissions'

export default new PermissionsService(apiName, path, API)
