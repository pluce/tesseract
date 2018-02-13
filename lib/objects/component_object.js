var ObjectFactory = require('./object_factory.js')
var _ = require('underscore')

ObjectFactory.registerObjectType(
  'Component',
  (baseObject) => {
    return function ComponentObject(data) {
      _(this).extend(new baseObject(data))
      this.speak = () => "I'm a component object"
    }
  }
)
