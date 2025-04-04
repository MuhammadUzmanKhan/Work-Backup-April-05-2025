import { API } from 'aws-amplify';
import { getErrorStringPart } from 'utils'

class ImageService {
  constructor(apiName, path, httpService) {
    this._apiName = apiName
    this._path = path
    this._httpService = httpService
  }

  async getImageUrl({ params }) {
    try {
      const formData = new FormData()
      formData.append('file', params)
      return await this._httpService.post(this._apiName, this._path, {
        body: formData
      })
    } catch (e) {
      throw {
        message: e.message,
        msg: e.response?.data?.errors
          ? getErrorStringPart(e.response?.data?.errors[0])
          : e.response?.data?.message || ''
      }
    }
  }
}

const apiName = 'MyAPIGatewayAPI';
const path = '/cms/asset';

export default new ImageService(apiName, path, API);
