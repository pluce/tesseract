var _ = require('underscore')
var columnify = require('columnify')
var DocGenerator = require('./doc/generator.js')

var hhead = function(title) {
  console.log("#".repeat(80))
  console.log("# "+title)
  console.log("#".repeat(80))
}
var hsubhead = function(subhead) {
  console.log("+ "+subhead)
  console.log("+".repeat(80))
}
var hhbar = function() {
  console.log("-".repeat(80))
}
var hfoot = function() {
  console.log("#".repeat(80))
}
var hlist = function(array) {
  var first = true
  _(array).each(v => {
    if(!first) { hhbar(); }
    first=false
    console.log(v)
  })
}

var cmd_todos = function(params,ctx) {
  var todos = ctx.todos()
  if(params.output == "json") {
    return JSON.stringify(todos)
  }
  hhead("Marked TODOs")
  hlist(todos.map((t) => {
    return "About "+t.kind+" '"+t.name+"': "+t.todo+"\n"+
           "\tDefined in: "+t._loaded_from_file
  }))
  hfoot()
  return ""
}

var cmd_references = function(params,ctx) {
  var refs = ctx.references(params)
  if(params.output == "json") {
    return JSON.stringify(refs)
  }
  if(params.missing){
    hhead("Referenced objects not defined")
  } else {
    hhead("Referenced objects")
  }
  var list = _(refs).mapObject((list,grp) => {
    return grp + "\n" + 
    "referenced by: \n" +
    columnify(list,{
      columns: ['origin', 'path'],
      showHeaders: false
    })
  })
  hlist(list)
  hfoot()
  return ""
}

var cmd_list = function(params,ctx) {
  var result = ctx.list(params.filter)
  if(params.output == "json") {
    return JSON.stringify(result)
  }
  var groups = _(result).groupBy('kind')
  hhead("Defined objects")
  if(params.filter) {
    hsubhead("Filters: "+params.filter)
  }
  var list = _(groups).mapObject((list,grp) => {
    return grp+"\n"+
    "+".repeat(grp.length)+
    "\n"+columnify(list,{
      columns: ['name', '_loaded_from_file'],
      showHeaders: false
    })
  })
  hlist(list)
  hfoot()
  return ""
}

var cmd_scenario = function(params, ctx) {
  var sc = ctx.scenario(params.scenario)
  var valids = sc.validate()
  hhead("Scenario: "+sc.name)
  if(!valids.valid) {
    hsubhead("This scenario contains errors.")
  }
  var list = []
  sc.forEachStep((step,idx) => {
    var content = "#"+(idx+1)+"\t"+step.asTextLine()
    var errs = _(valids.steps[idx]).filter((i)=>!i.valid)
    if(errs.length > 0){
      content += "\n\tValidation error: "+_(errs).map(e => e.message).join(', ')
    }
    list.push(content)
  })
  hlist(list)
  hfoot()
  return ""
}

var cmd_doc = function(params, ctx) {
  ctx.style = 'markdown'
  return new DocGenerator(ctx).generate().then(() => "")
}

var cmd_validate = function(params, ctx) {
  var is_valid = true
  hhead("Validating model")

  // Check if every reference is defined
  var refs = ctx.references({ missing: true })
  var refs_count = _(refs).keys().length
  if(refs_count > 0) {
    is_valid = false
    hsubhead("Checking references: "+refs_count+" objects not defined")
      var list = _(refs).mapObject((list,grp) => {
      return grp + "\n" + 
      "referenced by: \n" +
      columnify(list,{
        columns: ['origin', 'path'],
        showHeaders: false
      })
    })
    hlist(list)
    hfoot()
  } else {
    hsubhead("Checking references: OK")
  }

  // Check if all components are valid
  var clist = _.chain(ctx.list())
    .filter(i => i.kind == "Scenario")
    .map(s => ctx.scenario(s.name))
    .each( s => s.validate())
    .filter(s => !s.validationResult.valid)
    .value()
  
  var list = []
  if(clist.length > 0) {
    is_valid = false
    hsubhead("Checking scenarios: "+clist.length+" scenarios are invalid")   

    clist.forEach(sc => {
      var sublist = []
      sublist.push("# Scenario: "+sc.name)
      sc.forEachStep((step,idx) => {
        var content = "\t#"+(idx+1)+"\t"+step.asTextLine()
        var errs = _(sc.validationResult.steps[idx]).filter((i)=>!i.valid)
        if(errs.length > 0){
          content += "\n\t\tValidation error: "+_(errs).map(e => e.message).join(', ')
        }
        sublist.push(content)
      })
      list.push(sublist.join("\n"))
    })
    hlist(list)
  } else {
    hsubhead("Checking scenarios: OK")
  }
    
  hfoot()

  return is_valid
}

var CLICommand = function(commands) {
  switch(commands[0]){
    case 'todos':
      return cmd_todos
    case 'list':
      return cmd_list
    case 'references':
      return cmd_references
    case 'scenario':
      return cmd_scenario
    case 'doc':
      return cmd_doc
    case 'validate':
      return cmd_validate
  }
}

module.exports = CLICommand