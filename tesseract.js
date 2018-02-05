#!/usr/bin/env node

const Loader = require('./lib/loader.js')
const CLICommand = require('./lib/cli_command.js')
const Context = require('./lib/objects/context.js')

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('todos', 'Show remaining todos')
      .example('$0 todos -p ./my/project', 'show todos in the files')
    .command('list', 'List objects')
      .example('$0 list', 'list all objects')
      .example('$0 list --filter \'@.kind=Component\'', 'list all objects matching a filter')
    .describe('o',"output format")
      .alias('o','output')
      .string('o')
      .nargs('o',1)
      .default('o','human')
      .choices('o', ['human','json'])
    .describe('f', 'JSONPath filter')
      .alias('f', 'filter')
      .nargs('f',1)
      .string('f')
    .describe('p', 'Path to a project or single file')
      .alias('p', 'project')
      .nargs('p', 1)
      .default('p','.')
    .help('h')
      .alias('h', 'help')
    .epilog('made my pluce - 2018')
    .argv;

Loader(argv.p)
.then((data) => {
  var ctx = new Context(data)
  ctx.style = 'ansi'
  return CLICommand(argv._)(argv,ctx)
})
.then(r => {
  if(typeof r == "string") {
    console.log(r)
    process.exit(0)
  } else if(typeof r == "boolean") {
    process.exit(r?0:1)
  } else {
    process.exit(0)
  }
})
.catch(console.log)