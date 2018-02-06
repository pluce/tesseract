#!/usr/bin/env node

const Loader = require('./lib/loader.js')
const CLICommand = require('./lib/cli_command.js')
const Context = require('./lib/objects/context.js')

var argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('todos', 'Show remaining todos')
      .example('$0 todos', 'show todos in the files')
    .command('list', 'List objects', (yargs) => {
        yargs.option('filter', {
          describe: 'JSONPath filter',
          alias: 'f',
          type: 'string',
          nargs: 1
        })
        .example('$0 list', 'list all objects')
        .example('$0 list --filter \'@.kind=Component\'', 'list all objects matching a filter')
      })
    .command('validate', 'Validate model')
      .example('$0 validate', 'validate a model')
    .command('scenario <scenario>', 'Read and validate a scenario',(yargs) => {
        yargs.positional('source', {
          describe: 'scenario name',
          type: 'string',
          nargs: 1
        })
        .example('$0 scenario BasicUseCase', 'read a given scenario')
      })
    .describe('o',"output format")
      .alias('o','output')
      .string('o')
      .nargs('o',1)
      .default('o','human')
      .choices('o', ['human','json'])
    .describe('p', 'Path to a project or single file')
      .alias('p', 'project')
      .nargs('p', 1)
      .default('p','.')
    .demandCommand()
    .help('h')
      .alias('h', 'help')
    .epilog('made by pluce - 2018')
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