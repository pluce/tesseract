var ObjectFactory = require('./object_factory.js')
var _ = require('underscore')

ObjectFactory.registerObjectType(
  'Message',
  (baseObject) => {
    return function MessageObject(data) {
      _(this).extend(new baseObject(data))
      this.speak = () => "I'm a message object"
    }
  }
)
