const fse = require('fs-extra')
const path = require('path')
var jp = require('jsonpath')
const tools = require('./tools.js')
var _ = require('underscore')

function Metadata(workdir) {

  var _workdir = workdir || '.'

  var _meta = {}

  var _filePath = function(workdir) {
    return path.join(_workdir,'project.meta.yml')
  }

  var _load = function() {
    return tools.load_yml_file(_filePath())
    .catch(err => {
      if(err.code == "ENOENT") {
        return [{}]
      }
      throw(err)
    })
    .then(data => {
      _meta = data[0]
      return _meta
    })   
  }

  var _save = function() {
    return tools.save_yml_file(_filePath(),_meta)
    .then(() => {
      return _meta
    })
  }

  return {
    load: function() {
      return _load().then(()=>this)
    },
    get: function(key) {
      if(key) {
        return jp.query(_meta,'$.'+key)[0]
      }
      return _meta
    }
  }

}



module.exports = Metadata