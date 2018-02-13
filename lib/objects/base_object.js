var _ = require('underscore')

function BaseObject(data,context) {
  _(this).extend(data)
  this.speak = () => "I'm a base object"
}

module.exports = BaseObject