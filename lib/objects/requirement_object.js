var ObjectFactory = require('./object_factory.js')
var _ = require('underscore')

ObjectFactory.registerObjectType(
  'Requirement',
  (baseObject) => {
    return function RequirementObject(data) {
      _(this).extend(new baseObject(data))
      this.speak = () => "I'm a requirement object"
    }
  }
)
