const style = require('ansi-styles');
var _ = require('underscore')

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
  }
}