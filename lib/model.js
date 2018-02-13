var pathlib = require('path')
var Loader = require('./loader.js')
var HistoryLog = require('./historylog.js')
var Metadata = require('./metadata.js')
var Context = require('./objects/context.js')

var Model = function(path,context) {

  this.path = (pathlib.extname(path) === '')?path:pathlib.dirname(path)
  this.original_path = path
  this.context = context

  this.reloadHistoryLog = function(){
    return new HistoryLog(this.path).load()
    .then( historyLog => {
      this.historyLog = historyLog
      return this.historyLog
    })
  }

  this.reloadMetadata = function(){
    new Metadata(this.path).load()
    .then( metadata => {
      this.metadata = metadata
      return this.metadata
    })
  }

  this._preloadAll = function() {
    return Promise.all([this.reloadMetadata(),this.reloadHistoryLog()])
  }
}

Model.load = function(path) {
  return Loader(path)
  .then((data) => {
    var ctx = new Context(data)
    return new Model(path,ctx)
  })
  .then( model => {
    return model._preloadAll()
    .then( (a) => {
      return model
    })
  })
  .catch( err => {
    console.log("ERROR LOADING MODEL: ",err)
  })
}

module.exports = Model