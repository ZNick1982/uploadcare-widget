import uploadcare from '../namespace'

const {
  jQuery: $
} = uploadcare

uploadcare.namespace('utils.pusher', function (ns) {
  var ManagedPusher, pushers
  pushers = {}
  // This fixes Pusher's prototype. Because Pusher replaces it:
  // Pusher.prototype = {method: ...}
  // instead of extending:
  // Pusher.prototype.method = ...
  uploadcare.Pusher.prototype.constructor = uploadcare.Pusher
  ManagedPusher = class ManagedPusher extends uploadcare.Pusher {
    subscribe (name) {
      // Ensure we are connected when subscribing.
      if (this.disconnectTimeout) {
        clearTimeout(this.disconnectTimeout)
        this.disconnectTimeout = null
      }
      this.connect()
      return super.subscribe(...arguments)
    }

    unsubscribe (name) {
      super.unsubscribe(...arguments)
      // Schedule disconnect if no channels left.
      if ($.isEmptyObject(this.channels.channels)) {
        this.disconnectTimeout = setTimeout(() => {
          this.disconnectTimeout = null
          return this.disconnect()
        }, 5000)
      }
    }
  }

  ns.getPusher = function (key) {
    if (pushers[key] == null) {
      pushers[key] = new ManagedPusher(key)
    }

    // Preconnect before we actually need channel.
    pushers[key].connect()
    return pushers[key]
  }
})
