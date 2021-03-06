import uploadcare from '../namespace'
import { boundMethodCheck } from '../utils/bound-method-check'

const {
  jQuery: $,
  utils
} = uploadcare

const { pusher } = uploadcare.utils

uploadcare.namespace('files', function (ns) {
  var PollWatcher, PusherWatcher, ref
  ref = ns.UrlFile = (function () {
    class UrlFile extends ns.BaseFile {
      constructor (__url) {
        var filename
        super(...arguments)
        this.__listenWatcher = this.__listenWatcher.bind(this)
        this.__url = __url
        filename = utils.splitUrlRegex.exec(this.__url)[3].split('/').pop()
        if (filename) {
          try {
            this.fileName = decodeURIComponent(filename)
          } catch (error) {
            this.fileName = filename
          }
        }
        this.__notifyApi()
      }

      setName (fileName) {
        this.fileName = fileName
        this.__realFileName = fileName
        return this.__notifyApi()
      }

      setIsImage (isImage) {
        this.isImage = isImage
        return this.__notifyApi()
      }

      __startUpload () {
        var data, df, pollWatcher, pusherWatcher
        df = $.Deferred()
        pusherWatcher = new PusherWatcher(this.settings)
        pollWatcher = new PollWatcher(this.settings)
        data = {
          pub_key: this.settings.publicKey,
          signature: this.settings.secureSignature,
          expire: this.settings.secureExpire,
          source_url: this.__url,
          filename: this.__realFileName || '',
          source: this.sourceInfo.source,
          store: this.settings.doNotStore ? '' : 'auto',
          jsonerrors: 1
        }

        utils.defer(() => {
          if (this.apiDeferred.state() !== 'pending') {
            return
          }
          return utils.jsonp(`${this.settings.urlBase}/from_url/`, 'GET', data, {
            headers: {
              'X-UC-User-Agent': this.settings._userAgent
            }
          }).fail((reason) => {
            if (this.settings.debugUploads) {
              utils.debug("Can't start upload from URL.", reason, data)
            }
            return df.reject()
          }).done((data) => {
            var logger
            if (this.apiDeferred.state() !== 'pending') {
              return
            }
            if (this.settings.debugUploads) {
              utils.debug('Start watchers.', data.token)
              logger = setInterval(() => {
                return utils.debug('Still watching.', data.token)
              }, 5000)
              df.done(() => {
                return utils.debug('Stop watchers.', data.token)
              }).always(() => {
                return clearInterval(logger)
              })
            }
            this.__listenWatcher(df, $([pusherWatcher, pollWatcher]))
            df.always(() => {
              $([pusherWatcher, pollWatcher]).off(this.allEvents)
              pusherWatcher.stopWatching()
              return pollWatcher.stopWatching()
            })
            // turn off pollWatcher if we receive any message from pusher
            $(pusherWatcher).one(this.allEvents, () => {
              if (!pollWatcher.interval) {
                return
              }
              if (this.settings.debugUploads) {
                utils.debug('Start using pusher.', data.token)
              }
              return pollWatcher.stopWatching()
            })
            pusherWatcher.watch(data.token)
            return pollWatcher.watch(data.token)
          })
        })
        return df
      }

      __listenWatcher (df, watcher) {
        boundMethodCheck(this, ref)
        return watcher.on('progress', (e, data) => {
          this.fileSize = data.total
          return df.notify(data.done / data.total)
        }).on('success', (e, data) => {
          $(e.target).trigger('progress', data)
          this.fileId = data.uuid
          this.__handleFileData(data)
          return df.resolve()
        }).on('error fail', df.reject)
      }
    };

    UrlFile.prototype.sourceName = 'url'

    UrlFile.prototype.allEvents = 'progress success error fail'

    return UrlFile
  }.call(this))
  PusherWatcher = class PusherWatcher {
    constructor (settings) {
      this.settings = settings
      try {
        this.pusher = pusher.getPusher(this.settings.pusherKey)
      } catch (error) {
        this.pusher = null
      }
    }

    watch (token) {
      var channel
      this.token = token
      if (!this.pusher) {
        return
      }
      channel = this.pusher.subscribe(`task-status-${this.token}`)
      return channel.bind_all((ev, data) => {
        return $(this).trigger(ev, data)
      })
    }

    stopWatching () {
      if (!this.pusher) {
        return
      }
      return this.pusher.unsubscribe(`task-status-${this.token}`)
    }
  }

  PollWatcher = class PollWatcher {
    constructor (settings) {
      this.settings = settings
      this.poolUrl = `${this.settings.urlBase}/from_url/status/`
    }

    watch (token) {
      this.token = token
      var bind = () => {
        this.interval = setTimeout(() => {
          this.__updateStatus().done(() => {
            if (this.interval) { // Do not schedule next request if watcher stopped.
              bind()
            }
          })
        }, 333)

        return this.interval
      }

      return bind()
    }

    stopWatching () {
      if (this.interval) {
        clearTimeout(this.interval)
      }
      this.interval = null

      return this.interval
    }

    __updateStatus () {
      return utils.jsonp(this.poolUrl, 'GET', { token: this.token }, {
        headers: {
          'X-UC-User-Agent': this.settings._userAgent
        }
      }).fail((reason) => {
        return $(this).trigger('error')
      }).done((data) => {
        return $(this).trigger(data.status, data)
      })
    }
  }
})
