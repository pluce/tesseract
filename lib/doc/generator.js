var tmp = require('tmp-promise')
var path = require('path')
const fse = require('fs-extra')
var _ = require('underscore')
var exec = require('child-process-promise').exec;
var nj = require('nunjucks').configure(path.resolve(__dirname,'./tpl'))

function prepareTempFolders() {
  var tmp_directory = null;
  return tmp.dir()
  .then(tmp_dir => {
    tmp_directory = tmp_dir
    src_path = path.normalize(path.join(__dirname,'..','..','vendor','slate'))
    return fse.copy(src_path,tmp_dir.path)
  }).then((d) => {
    return tmp_directory
  })
}

function generateMdSource(context) {
  return function(workdir) {
    data = context.list()
    data = _.chain(data).values().groupBy("kind").value()

    // Prepare scenarios
    _(data['Scenario']).each(i => i.steps = _(context.scenario(i.name).allSteps()).each(s => s.textLine = s.asTextLine()))
    var val_result = _.chain(context.scenario("BatchPreparation").validate().steps).flatten().filter(i => !!i.message).map(i => i.message).unique().value()

    // Prepare references
    var refs = context.references({})
    _(data).each((v,k) => { 
      _(v).each(i => i.references = _.chain(refs[i.name]).map(i => i.origin).unique().value())
    })

    _(data['Scenario']).each(i => i.validation = val_result)
    
    render_data = {
      data: data
    }

    txt = nj.render('index.md.njk',render_data)
    path_to_write = path.join(workdir,'source','includes','main.md')
    console.log(txt,path_to_write)
    return fse.outputFile(path_to_write,txt)
    .then(() => {
      console.log("written")
      return workdir
    })
  }
}

function buildPages(context) {
  return function(workdir) {
    return exec("cd "+workdir+" && npm run build")
    .then(() => { return workdir })
  }
}

function moveBuildedPages(context) {
  return function(workdir) {
    console.log("copy",path.join(workdir,'build'),path.join('.','docs'))
    return fse.copy(path.join(workdir,'build'),path.join('.','docs'))
  }
}


function DocGenerator(context) {
  this.generate = function() {
    tmpdir = null
    prepareTempFolders()
    .then( dir => {
      tmpdir = dir
      return dir.path
    })
    .then(generateMdSource(context))
    .then(buildPages(context))
    // .then(generateDesc)
    .then(moveBuildedPages(context))
    .catch(console.log)
    .finally(() => fse.remove(tmpdir.path) )
  }
}

module.exports = DocGenerator