'use strict'

const SpotifyService = require('../../server/services/spotify-service')
const spotify = new SpotifyService()

module.exports = function (Hook) {

  Hook.authorizationUrl = function (cb) {
    cb(null, spotify.getAuthorizationUrl())
  }

  Hook.setAuthorizationCode = function (code, cb) {
    spotify.setAuthorizationCode(code).then(results => {
      console.log(results)
      cb(null, results)
    })
  }

  Hook.playlists = function (cb) {
    spotify.getPlaylists().then(results => {
      cb(null, results)
    })
  }

  Hook.getPlaylist = function (playlistID, cb) {
    console.log("Trying to get playlist ", playlistID)
    spotify.getPlaylist(playlistID).then(results => {
      cb(null, results)
    })['catch'](function(error){console.log('caught', error)});
  }

  Hook.remoteMethod('authorizationUrl', {
    returns: {arg: 'url', type: 'string'},
    http: {path: '/authorization-url', verb: 'get'}
  })

  Hook.remoteMethod('setAuthorizationCode', {
    accepts: [{arg: 'code', type: 'string'}],
    returns: {arg: 'results', type: 'object'},
    http: {path: '/set-authorization-code', verb: 'post'}
  })

  Hook.remoteMethod('playlists', {
    returns: {arg: 'results', type: 'object'},
    http: {path: '/playlists', verb: 'get'}
  })

  Hook.remoteMethod('getPlaylist', {
    accepts: [{arg: 'playlistID', type: 'string'}],
    returns: {arg: 'results', type: 'object'},
    http: {path: '/get-playlist', verb: 'get'}
  })
}
