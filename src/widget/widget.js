import uploadcare from '../namespace'
import { boundMethodCheck } from '../utils/bound-method-check'

uploadcare.namespace('widget', function (ns) {
  var ref
  ref = ns.Widget = class Widget extends ns.BaseWidget {
    constructor () {
      super(...arguments)
      this.__handleDirectSelection = this.__handleDirectSelection.bind(this)
    }

    __currentFile () {
      return this.currentObject
    }

    __handleDirectSelection (type, data) {
      var file
      boundMethodCheck(this, ref)
      file = uploadcare.fileFrom(type, data[0], this.settings)
      if (this.settings.systemDialog || !this.settings.previewStep) {
        return this.__setObject(file)
      } else {
        return this.__openDialog('preview').addFiles([file])
      }
    }
  }

  ns.Widget._name = 'SingleWidget'
})
