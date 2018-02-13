var BaseObject = require('./base_object.js')

// If you have a new step, just add a condition and create the class
function ObjectFactory(data,context) {
  
  this.build = function() {
    var cons = ObjectFactory.registeredConstructors[data.kind]
    if(cons){
      return new cons(data,context)
    } else {
      return new BaseObject(data,context)
    }

  } 
}
ObjectFactory.registeredConstructors = {}

ObjectFactory.registerObjectType = function(kind,constructorFactory) {
  ObjectFactory.registeredConstructors[kind] = constructorFactory(BaseObject)
  return ObjectFactory.registeredConstructors[kind]
}

module.exports = ObjectFactory