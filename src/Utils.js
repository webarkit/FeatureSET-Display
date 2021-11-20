import axios from 'axios'

export default class Utils {
  static async fetchRemoteData (url) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' })
      return new Uint8Array(response.data)
    } catch (error) {
      throw error
    }
  }

  static async fetchRemoteDataCallback (url, callback) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' })
      .then((response) => {
        data = new Uint8Array(response.data)
        console.log(data);
        callback(response)
      })
      return response
    } catch (error) {
      throw error
    }
  }

  static string2Uint8Data (string) {
    const data = new Uint8Array(string.length)
    for (let i = 0; i < data.length; i++) {
      data[i] = string.charCodeAt(i) & 0xff
    }
    return data
  }
}