const style = require('ansi-styles');
var _ = require('underscore')

module.exports = {
  nameColor: (name) => {
    arr = ['green','blue','red','yellow','magenta','cyan']
    idx = _(name).reduce((memo,c) => memo + c.charCodeAt(0),0) % arr.length
    return style[arr[idx]].open+name+style[arr[idx]].close
  },
  should: (condition,msg) => {
    if(condition){
      return {valid: true}
    } else {
      return {valid: false, message: msg}
    }
  }
}