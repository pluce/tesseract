var ObjectFactory = require('./object_factory.js')
var _ = require('underscore')

ObjectFactory.registerObjectType(
  'ExternalService',
  (baseObject) => {
    return function ExternalServiceObject(data) {
      _(this).extend(new baseObject(data))
      this.speak = () => "I'm an external service object"
    }
  }
)
