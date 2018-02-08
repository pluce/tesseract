const fse = require('fs-extra')
const path = require('path')
const tools = require('./tools.js')
var _ = require('underscore')

function HistoryLog(workdir) {

  var _workdir = workdir || '.'

  var _logData = []

  var _filePath = function(workdir) {
    return path.join(_workdir,'history.log.yml')
  }

  var _load = function() {
    return tools.load_yml_file(_filePath())
    .catch(err => {
      if(err.code == "ENOENT") {
        return _save()
      }
      throw(err)
    })
    .then(data => {
      _logData = data
      return _logData
    })   
  }

  var _save = function() {
    return tools.save_yml_file(_filePath(),_logData)
    .then(() => {
      return _logData
    })
  }

  return {
    log: function(date,author,fact){
      return _load()
      .then(() => {
        _logData.push({
          date: date.toISOString(),
          author: author,
          fact: fact
        })
      })
      .then(_save)
    },
    get: function(xLast) {
      return _load().then(logs => {
        return _(logs).last(xLast||10)
      })
    }
  }

}



module.exports = HistoryLog