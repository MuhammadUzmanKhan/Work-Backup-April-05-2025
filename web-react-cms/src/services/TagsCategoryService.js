import { API } from 'aws-amplify';
import { getErrorStringPart } from 'utils'

import RequestService from './RequestService'
// const init = {
//   headers: {
//     'Content-Type': 'application/json; charset=utf-8',
//     'Accept-Language': localStorage.getItem('language')?.toUpperCase()
//   }
//   // response: true
// }

const apiName = 'MyAPIGatewayAPI'
const path = '/cms/product_tag'

class TagsCategoryService extends RequestService {
  constructor(apiName, path, API) {
    super(apiName, path, API)
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
}

export default new TagsCategoryService(apiName, path, API);
