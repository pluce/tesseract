const style = require('ansi-styles');
var _ = require('underscore')
const fse = require('fs-extra')
const yaml = require('js-yaml')

var nameColor = (name) => {
  arr = ['green','blue','red','yellow','magenta','cyan']
  idx = _(name).reduce((memo,c) => memo + c.charCodeAt(0),0) % arr.length
  return style[arr[idx]].open+name+style[arr[idx]].close
}

var nameMarkdown = (name) => {
  return '*['+name+'](#'+name.toLowerCase()+')*'
}

module.exports = {
  styleSelector: (style) => {
    if(style == "ansi") {
      return nameColor
    } else if (style == "markdown") {
      return nameMarkdown
    } else {
      return (i) => i
    }
  },
  should: (condition,msg) => {
    if(condition){
      return {valid: true}
    } else {
      return {valid: false, message: msg}
    }
  },
  load_yml_file: (path) => {
    return fse.readFile(path)
    .then((content) => {
      return new Promise((resolve,reject) => {
        try {
          var docs = yaml.safeLoadAll(content)
          docs = _.chain(docs).filter(i => !!i).each((doc) => {
            doc._loaded_from_file = path
          }).value()
          return resolve(docs)
        } catch (e){
          return reject(e)
        }
      })
    })
  },
  save_yml_file: (path,content) => {
    file_content = _(content)
      .map(d => _(d).omit('_loaded_from_file'))
      .map(d => yaml.dump(d))
      .join('---\n')
    return fse.outputFile(path,file_content)
  }
}