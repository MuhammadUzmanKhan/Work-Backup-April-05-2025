import { API } from 'aws-amplify'
import RequestService from './RequestService'

class NotificationsService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API)
  }
}

const apiName = 'MyAPIGatewayAPI'
const path = '/cms/pushNotification'

export default new NotificationsService(apiName, path, API)
