import uploadcare from '../namespace'
import { boundMethodCheck } from '../utils/bound-method-check'

const {
  jQuery: $,
  utils
} = uploadcare

uploadcare.namespace('files', function (ns) {
  var ref = ns.InputFile = (function () {
    class InputFile extends ns.BaseFile {
      constructor (__input) {
        super(...arguments)
        this.__cleanUp = this.__cleanUp.bind(this)
        this.__input = __input
        this.fileId = utils.uuid()
        this.fileName = $(this.__input).val().split('\\').pop()
        this.__notifyApi()
      }

      __startUpload () {
        var df, formParam, iframeId, targetUrl
        df = $.Deferred()
        targetUrl = `${this.settings.urlBase}/iframe/`
        iframeId = `uploadcare--iframe-${this.fileId}`
        this.__iframe = $('<iframe>').attr({
          id: iframeId,
          name: iframeId
        }).css('display', 'none').appendTo('body').on('load', df.resolve).on('error', df.reject)
        formParam = function (name, value) {
          return $('<input/>', {
            type: 'hidden',
            name: name,
            value: value
          })
        }
        $(this.__input).attr('name', 'file')
        this.__iframeForm = $('<form>').attr({
          method: 'POST',
          action: targetUrl,
          enctype: 'multipart/form-data',
          target: iframeId
        }).append(formParam('UPLOADCARE_PUB_KEY', this.settings.publicKey)).append(formParam('UPLOADCARE_SIGNATURE', this.settings.secureSignature)).append(formParam('UPLOADCARE_EXPIRE', this.settings.secureExpire)).append(formParam('UPLOADCARE_FILE_ID', this.fileId)).append(formParam('UPLOADCARE_STORE', this.settings.doNotStore ? '' : 'auto')).append(formParam('UPLOADCARE_SOURCE', this.sourceInfo.source)).append(this.__input).css('display', 'none').appendTo('body').submit()
        return df.always(this.__cleanUp)
      }

      __cleanUp () {
        var ref1, ref2
        boundMethodCheck(this, ref)
        if ((ref1 = this.__iframe) != null) {
          ref1.off('load error').remove()
        }
        if ((ref2 = this.__iframeForm) != null) {
          ref2.remove()
        }
        this.__iframe = null
        this.__iframeForm = null

        return this.__iframeForm
      }
    };

    InputFile.prototype.sourceName = 'local-compat'

    return InputFile
  }.call(this))
})
