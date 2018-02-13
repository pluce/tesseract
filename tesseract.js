#!/usr/bin/env node

const CLICommand = require('./lib/cli_command.js')
const Context = require('./lib/objects/context.js')
const Model = require('./lib/model.js')

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
    .command('references', 'Get links between objects', (yargs) => {
        yargs.option('missing', {
          describe: 'Show references to non-defined objects',
          alias: 'm',
          type: 'boolean'
        })
      })
    .command('validate', 'Validate model')
      .example('$0 validate', 'validate a model')
    .command('docs', 'Generate documentation')
      .example('$0 docs', 'generate HTML and wiki documentation')
    .command('scenario <scenario>', 'Read and validate a scenario',(yargs) => {
        yargs.positional('source', {
          describe: 'scenario name',
          type: 'string',
          nargs: 1
        })
        .example('$0 scenario BasicUseCase', 'read a given scenario')
      })
    .command('log [fact]', 'Log a fact in the history log.',(yargs) => {
        yargs.option('fact', {
          describe: 'A decision explaining an architecture choice',
          type: 'string'
        })
        .example('$0 fact "No one should be able to refuse a message"', 'logs a decision')
        .option('author', {
          describe: 'a decision author',
          alias: 'a',
          type: 'string',
          nargs: 1
        })
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
    .demandCommand(1, 'You need at least one command before moving on')
    .help('h')
      .alias('h', 'help')
    .epilog('made by pluce - 2018')
    .strict()
    .argv;

Model.load(argv.p)
.then( model => {
  model.context.style = 'ansi'
  return CLICommand(argv._)(argv,model)
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