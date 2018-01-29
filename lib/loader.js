const fse = require('fs-extra')
const yaml = require('js-yaml')
const _ = require('underscore')
const pathlib = require('path')

var _load_file = function(path) {
  return fse.readFile(path).then((content) => {
    return new Promise((resolve,reject) => {
      try {
        var docs = yaml.safeLoadAll(content)
        docs.forEach((doc) => {
          doc._loaded_from_file = path
        })
        return resolve(docs)
      } catch (e){
        return reject(e)
      }
    })
  })
}

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
        return files.filter(f => f.endsWith('.yml')).map( f => pathlib.join(path, f))
      })
    } else {
      return [path]
    }
  })
  .then((paths) => {
    var allz = paths.map((p) => _load_file(p))
    return Promise.all(allz)
  })
  .then((objects) => {
    objects = _(objects).flatten(true)
    objects = _(objects).groupBy('name')
    objects = _(objects).mapObject((val,key) => {
      if(val.length > 1) {
        var defining_files = _(val.map((def) => def._loaded_from_file )).uniq()
        throw "Component "+key+" defined more than once: "+defining_files.join(',')
      }
      return val[0]
    })
    return objects
  })
}

module.exports = Loader