const fse = require('fs-extra')
const path = require('path')
const tools = require('./tools.js')
var _ = require('underscore')

function CustomDoc(workdir) {

  var _workdir = workdir || '.'

  var _files = []

  var _docsPath = function() {
    return path.join(_workdir,'docs')
  }
  var _filesPath = function() {
    return path.join(_docsPath(_workdir),'*.md')
  }

  var _load = function() {
    return fse.stat(_docsPath())
    .then(stats => {
      if(!stats.isDirectory()) {
        return []
      } else {
        return fse.readdir(_docsPath())
        .then(files => {
          return _.chain(files).filter(f => f.endsWith('.md')).value()
        })
      }
    })
    .catch(err => {
      if(err.code == "ENOENT") {
        return []
      }
      throw(err)
    })
    .then(data => {
      _files = data
      return _files
    })   
  }

  return {
    load: function() {
      return _load().then(()=>this)
    },
    files: function() {
      console.log("FILES",_files)
      return _files
    }
  }

}



module.exports = CustomDoc