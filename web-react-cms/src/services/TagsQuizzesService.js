import { API } from 'aws-amplify';
import { getErrorStringPart } from 'utils'

import RequestService from './RequestService'

const apiName = 'MyAPIGatewayAPI'
const path = '/cms/quiz_tag'

class TagsQuizzesService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API)
  }

  async getDataById({ params }) {
    try {
      const response = await this._httpService.get(this._apiName, `${this._path}/${params}`, {
        headers: {
          'Accept-Language': localStorage.getItem('language')?.toUpperCase()
        }
      })
      return response
    } catch (e) {
      throw {
        message: e.message,
        msg: e.response?.data?.errors
          ? getErrorStringPart(e.response?.data?.errors[0])
          : e.response?.data?.message || ''
      }
    }
  }
  async editDataById({ params }) {
    try {
      const response = await this._httpService.put(this._apiName, `${this._path}/${params.id}`, {
        headers: {
          'Content-Language': localStorage.getItem('language')?.toUpperCase()
        },
        body: params.params
      })
      return response
    } catch (e) {
      throw {
        message: e.message,
        msg: e.response?.data?.errors
          ? getErrorStringPart(e.response?.data?.errors[0])
          : e.response?.data?.message || ''
      }
    }
  }
  async setDataList({ params }) {
    try {
      return await this._httpService.post(this._apiName, this._path, {
        headers: {
          'Content-Language': localStorage.getItem('language')?.toUpperCase()
        },
        body: params
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

export default new TagsQuizzesService(apiName, path, API);
