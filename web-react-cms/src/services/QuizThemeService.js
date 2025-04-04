import { API } from 'aws-amplify'
import RequestService from './RequestService'

class QuizThemeService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API)
  }
}

const apiName = 'MyAPIGatewayAPI'
const path = '/cms/quiz_theme'

export default new QuizThemeService(apiName, path, API)
