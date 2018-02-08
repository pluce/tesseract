const fse = require('fs-extra')
const _ = require('underscore')
const pathlib = require('path')
const tools = require('./tools.js')

var Loader = function(path) {
  return fse.pathExists(path)
  .then((exists) => {
    if(!exists) {
      throw "Path doesn't exist or is not accessible: "+path
    } else {
      return fse.stat(path)
    }
  })
  .then((stat) => {
    if(stat.isDirectory()) {
      return fse.readdir(path).then((files) => {
        return files.filter(f => f.endsWith('.defs.yml')).map( f => pathlib.join(path, f))
      })
    } else {
      return [path]
    }
  })
  .then((paths) => {
    var allz = paths.map((p) => tools.load_yml_file(p))
    return Promise.all(allz)
  })
  .then((objects) => {
    objects = _(objects).flatten(true)
    objects = _(objects).groupBy('name')
    objects = _(objects).mapObject((val,key) => {
      if(val.length > 1) {
        var defining_files = _(val.map((def) => def._loaded_from_file )).uniq()
        throw "Object "+key+" defined more than once: "+defining_files.join(',')
      }
      return val[0]
    })
    return objects
  })
}

module.exports = Loader