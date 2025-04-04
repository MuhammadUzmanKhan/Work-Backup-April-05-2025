import { API } from 'aws-amplify';
import { getErrorStringPart } from 'utils'

// const init = {
//   headers: {
//     'Content-Type': 'application/json; charset=utf-8',
//     'Accept-Language': localStorage.getItem('language')?.toUpperCase()
//   }
//   // response: true
// }

const apiName = 'MyAPIGatewayAPI'
const path = '/cms/faq_tag'

class TagFaqService {
  constructor(apiName, path, httpService) {
    this._apiName = apiName
    this._path = path
    this._httpService = httpService
  }
  async searchProduct({ params }) {
    try {
      return await this._httpService.post(this._apiName, `${this._path}/search/`, {
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
  async getDataList({ params }) {
    try {
      const response = await this._httpService.get(this._apiName, this._path, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Accept-Language': localStorage.getItem('language')?.toUpperCase()
        },
        queryStringParameters: params
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
          'Content-Type': 'application/json; charset=utf-8',
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
  async getDataById({ params }) {
    try {
      const response = await this._httpService.get(this._apiName, `${this._path}/${params}`, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
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
  async deleteDataById({ params }) {
    try {
      return await this._httpService.del(this._apiName, `${this._path}/${params.id}`)
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

export default new TagFaqService(apiName, path, API);
