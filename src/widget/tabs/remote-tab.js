import uploadcare from '../../namespace'

const {
  utils,
  tabsCss,
  jQuery: $,
  files
} = uploadcare

uploadcare.namespace('widget.tabs', function (ns) {
  ns.RemoteTab = class RemoteTab {
    constructor (container, tabButton, dialogApi, settings, name1) {
      this.__createIframe = this.__createIframe.bind(this)
      this.container = container
      this.tabButton = tabButton
      this.dialogApi = dialogApi
      this.settings = settings
      this.name = name1
      this.dialogApi.progress((name) => {
        if (name === this.name) {
          this.__createIframe()
          this.container.find('.uploadcare--tab__iframe').focus()
        }

        return this.__sendMessage({
          type: 'visibility-changed',
          visible: name === this.name
        })
      })
    }

    remoteUrl () {
      return `${this.settings.socialBase}/window3/${this.name}?` + $.param({
        lang: this.settings.locale,
        public_key: this.settings.publicKey,
        widget_version: uploadcare.version,
        images_only: this.settings.imagesOnly,
        pass_window_open: this.settings.passWindowOpen
      })
    }

    __sendMessage (messageObj) {
      var ref, ref1
      return (ref = this.iframe) != null ? (ref1 = ref[0].contentWindow) != null ? ref1.postMessage(JSON.stringify(messageObj), '*') : undefined : undefined
    }

    __createIframe () {
      var iframe
      if (this.iframe) {
        return
      }

      this.iframe = $('<iframe>', {
        src: this.remoteUrl(),
        marginheight: 0,
        marginwidth: 0,
        frameborder: 0,
        allowTransparency: 'true'
      }).addClass('uploadcare--tab__iframe').appendTo(this.container).on('load', () => {
        var i, j, len, len1, ref, ref1, style, url
        this.iframe.css('opacity', '1')
        ref = tabsCss.urls
        for (i = 0, len = ref.length; i < len; i++) {
          url = ref[i]
          this.__sendMessage({
            type: 'embed-css',
            url: url
          })
        }

        ref1 = tabsCss.styles
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          style = ref1[j]
          this.__sendMessage({
            type: 'embed-css',
            style: style
          })
        }
      })

      this.container.addClass('uploadcare--tab_remote')

      iframe = this.iframe[0].contentWindow

      utils.registerMessage('file-selected', iframe, (message) => {
        var file, sourceInfo, url
        url = (() => {
          var i, key, len, ref, type
          if (message.alternatives) {
            ref = this.settings.preferredTypes
            for (i = 0, len = ref.length; i < len; i++) {
              type = ref[i]
              type = utils.globRegexp(type)
              for (key in message.alternatives) {
                if (type.test(key)) {
                  return message.alternatives[key]
                }
              }
            }
          }
          return message.url
        })()

        sourceInfo = $.extend({
          source: this.name
        }, message.info || {})

        file = new files.UrlFile(url, this.settings, sourceInfo)

        if (message.filename) {
          file.setName(message.filename)
        }

        if (message.is_image != null) {
          file.setIsImage(message.is_image)
        }

        return this.dialogApi.addFiles([file.promise()])
      })

      utils.registerMessage('open-new-window', iframe, (message) => {
        var interval, popup, resolve
        if (this.settings.debugUploads) {
          utils.debug('Open new window message.', this.name)
        }
        popup = window.open(message.url, '_blank')
        if (!popup) {
          utils.warn("Can't open new window. Possible blocked.", this.name)
          return
        }
        resolve = () => {
          if (this.settings.debugUploads) {
            utils.debug('Window is closed.', this.name)
          }
          return this.__sendMessage({
            type: 'navigate',
            fragment: ''
          })
        }
        // Detect is window supports "closed".
        // In browsers we have only "closed" property.
        // In Cordova addEventListener('exit') does work.
        if ('closed' in popup) {
          interval = setInterval(() => {
            if (popup.closed) {
              clearInterval(interval)
              return resolve()
            }
          }, 100)

          return interval
        } else {
          return popup.addEventListener('exit', resolve)
        }
      })

      return this.dialogApi.done(() => {
        utils.unregisterMessage('file-selected', iframe)
        return utils.unregisterMessage('open-new-window', iframe)
      })
    }
  }
})
