import BaseService from './BaseService'
import api from '../constants/api.js'

class SpotifyService extends BaseService {
  static authorizationUrl () {
    return this.GET(api.authorizationUrl).then(results => results.url)
  }

  static setAuthorizationCode (code) {
    return this.POST(api.setAuthorizationCode, {code})
  }

  static getPlaylist (playlistID) {
    return this.GET(api.getPlaylist, {playlistID})
  }

  static getPlaylists () {
    return this.GET(api.playlists)
  }
}

export default SpotifyService
