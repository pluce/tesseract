const fse = require('fs-extra')
const path = require('path')
const tools = require('./tools.js')
var _ = require('underscore')

function HistoryLog(workdir) {
  _self = this
  var _workdir = workdir || '.'

  var _logData = []

  var _filePath = function(workdir) {
    return path.join(_workdir,'history.log.yml')
  }

  var _load = function() {
    return tools.load_yml_file(_filePath())
    .catch(err => {
      if(err.code == "ENOENT") {
        return []
      }
      throw(err)
    })
    .then(data => {
      _logData = data
      return _self
    })   
  }

  var _save = function() {
    return tools.save_yml_file(_filePath(),_logData)
    .then(() => {
      return _self
    })
  }

  return {
    load: function() {
      return _load().then( (l) => {
        return this
      })
    },
    log: function(date,author,fact){
      _logData.push({
        date: date.toISOString(),
        author: author,
        fact: fact
      })
      return _save()
    },
    get: function(xLast) {
      return _(_logData).last(xLast||10)
    }
  }

}



module.exports = HistoryLog