import { API } from 'aws-amplify'
import RequestService from './RequestService'

class TailoredNotificationsService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API)
  }
}

const apiName = 'MyAPIGatewayAPI'
const path = '/cms/tailored_notification'

export default new TailoredNotificationsService(apiName, path, API)
