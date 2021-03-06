import uploadcare from '../../namespace'

const {
  jQuery: $,
  templates: { tpl }
} = uploadcare

uploadcare.namespace('widget.tabs', function (ns) {
  ns.UrlTab = (function () {
    var fixUrl, urlRegexp

    class UrlTab {
      constructor (container, tabButton, dialogApi, settings, name) {
        var button, input
        this.container = container
        this.tabButton = tabButton
        this.dialogApi = dialogApi
        this.settings = settings
        this.name = name
        this.container.append(tpl('tab-url'))

        input = this.container.find('.uploadcare--input')
        input.on('change keyup input', function () {
          return button.attr('disabled', !$.trim(this.value))
        })

        button = this.container.find('.uploadcare--button[type=submit]').attr('disabled', true)

        this.container.find('.uploadcare--form').on('submit', () => {
          var url = fixUrl(input.val())

          if (url) {
            this.dialogApi.addFiles('url', [
              [
                url,
                {
                  source: 'url-tab'
                }
              ]
            ])

            input.val('').trigger('change')
          }
          return false
        })
      }

      displayed () {
        this.container.find('.uploadcare--input').focus()
      }
    };

    // starts with scheme
    urlRegexp = /^[a-z][a-z0-9+\-.]*:?\/\//

    fixUrl = function (url) {
      url = $.trim(url)
      if (urlRegexp.test(url)) {
        return url
      } else {
        return 'http://' + url
      }
    }

    return UrlTab
  }.call(this))
})
