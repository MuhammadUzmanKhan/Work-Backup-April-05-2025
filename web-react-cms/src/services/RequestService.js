// const init = {
//   headers: {
//     'Accept-Language': localStorage.getItem('language')?.toUpperCase()
//   }

import { getErrorStringPart } from 'utils'

// }
export default class RequestService {
  constructor(apiName, path, httpService) {
    this._apiName = apiName
    this._path = path
    this._httpService = httpService
  }

  async postData({ params }) {
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
  async getDataById({ params }) {
    try {
      const response = await this._httpService.get(this._apiName, `${this._path}/${params.id}`, {
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

  async getDataListByLang({ params }) {
    try {
      const response = await this._httpService.get(this._apiName, this._path, {
        headers: {
          'Accept-Language': params?.lang || localStorage.getItem('language')?.toUpperCase()
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

  async postDataByLang({ params }) {
    try {
      return await this._httpService.post(this._apiName, this._path, {
        headers: {
          'Content-Language': params?.lang || localStorage.getItem('language')?.toUpperCase()
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

  async deleteDataById({ params }) {
    try {
      return await this._httpService.del(this._apiName, `${this._path}/${params.id}`, {})
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
