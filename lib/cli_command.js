var jp = require('jsonpath')
var _ = require('underscore')
var columnify = require('columnify')

var cmd_todos = function(params,data) {
  var todos = jp.query(data,'$..[?(@.todo)]') 
  console.log("Marked TODOs:")
  console.log("--------")
  todos.forEach((t) => {
    console.log("About "+t.kind+" '"+t.name+"': "+t.todo)
    console.log("\tDefined in: "+t._loaded_from_file)
    console.log("--------")
  })
  return ""
}

var cmd_list = function(params,data) {
  var query = params.filter? ('$..[?('+params.filter+')]'):'$.*'
  var result = jp.query(data,query)
  if(params.output == "json") {
    return JSON.stringify(result)
  }
  var groups = _(result).groupBy('kind')
  console.log("--------")
  _(groups).each((list,grp) => {
    console.log('+ '+grp)
    console.log("--------")
    console.log(columnify(list,{
      columns: ['name', '_loaded_from_file'],
      showHeaders: false
    }))
    console.log("--------")
  })
  return ""
}

var CLICommand = function(commands) {
  switch(commands[0]){
    case 'todos':
      return cmd_todos
    case 'list':
      return cmd_list
  }
}

module.exports = CLICommand