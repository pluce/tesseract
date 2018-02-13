var jp = require('jsonpath')
var _ = require('underscore')
var ObjectFactory = require('./object_factory.js')

var reference_fields = [
  'consumes.*.message',
  'consumes.*.from.*.service',
  'produces.*.message',
  'produces.*.to.*.service',
  'holds.*.data',
  'accesses.*.api',
  'accesses.*.service',
  'produces.*.message'
]

function Context(data) {
  this._data = data
  this._query = function(query) {
    return this.instanciate(jp.query(this._data,query).sort((a,b) => a.name > b.name))
  }

  // This function tests if an object exists and return it or null or a subpart
  // kind is the kind of object
  // name is the ehh guess what! the name
  // query is optional and returns the matching subobject
  this.exists = function(kind,name,query) {
    var q = '$[?(@.kind == "'+kind+'" && @.name == "'+name+'")]'
    if(query) {
      q += '.spec.'+query
    }
    var result = this._query(q)

    //result = this.instanciate(result)

    return (result.length == 0)?null:result
  }

  // Functions to get an extended object
  //////////////////////////////////////
  this.scenario = function(name){
    return this.exists("Scenario",name)[0]
  }


  // Functions to get lists of objects
  //////////////////////////////////////
  this.todos = function() {
    return this._query('$..[?(@.todo)]')
  }

  this.list = function(filter) {
    var query = filter? ('$..[?('+filter+')]'):'$.*'
    return this._query(query)
  }

  this.references = function(options) {
    var refs_path = []
    _(reference_fields).each((field) => {
      refs_path.push(jp.nodes(this._data,'$.*.spec.'+field))
    })
    refs_path = _(refs_path).flatten()
    refs_path = _(refs_path).map(i => { 
      return { value: i.value, origin: i.path[1], path: jp.stringify(i.path.slice(2))}
    })
    refs_path = _(refs_path).groupBy('value')
    if(options.missing) {
      defined = _(this._data).keys()
      refs_path = _(refs_path).omit(defined)
    }
    return refs_path
  }

  this.instanciate = function(objOrArray){
    if(objOrArray.constructor === Array) {
      return _(objOrArray).map(i => this.instanciate(i))
    } else if(objOrArray.kind) {
      return new ObjectFactory(objOrArray,this).build()
    } else {
      return objOrArray
    }
  }
}

module.exports = Context