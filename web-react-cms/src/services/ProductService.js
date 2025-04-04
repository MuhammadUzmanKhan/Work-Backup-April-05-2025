import { API } from 'aws-amplify';

import RequestService from './RequestService';
import { getErrorStringPart } from 'utils'

const apiName = 'MyAPIGatewayAPI'
const path = '/cms/product'

// const init = {
//   headers: {
//     'Accept-Language': localStorage.getItem('language')?.toUpperCase()
//   }
// }
class ProductService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API)
  }

  async getCategoryProducts({ params }) {
    try {
      return await this._httpService.get(this._apiName, `${this._path}?${params.queryParams}`, {
        headers: {
          'Accept-Language': localStorage.getItem('language')?.toUpperCase()
        }
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
}

export default new ProductService(apiName, path, API);
