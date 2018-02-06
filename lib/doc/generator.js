var tmp = require('tmp-promise')
var path = require('path')
const fse = require('fs-extra')
var _ = require('underscore')
var exec = require('child-process-promise').exec;
var nj = require('nunjucks').configure(path.resolve(__dirname,'./tpl'))

function prepareTempFolders() {
  return new Promise((resolve,reject) => {
    try {
      var tmp_folder = tmp.dirSync().name
      var src_path = path.resolve(__dirname,'..','..','vendor','slate')
      fse.copy(src_path,tmp_folder,() => {
        resolve(tmp_folder)
      })
    } catch(e) { console.log(e) }
  })
}

function generateMdSource(context) {
  return function(workdir) {
    data = context.list()
    data = _.chain(data).values().groupBy("kind").value()

    // Prepare scenarios
    _(data['Scenario']).each(i => {
      var sc = context.scenario(i.name)
      i.steps = _(sc.allSteps()).each(s => s.textLine = s.asTextLine())
      i.validation = _.chain(sc.validate().steps).flatten().filter(i => !!i.message).map(i => i.message).unique().value()
    })
    
    // Prepare references
    var refs = context.references({})
    _(data).each((v,k) => { 
      _(v).each(i => i.references = _.chain(refs[i.name]).map(i => i.origin).unique().value())
    })

    render_data = {
      data: data
    }

    txt = nj.render('index.md.njk',render_data)
    path_to_write = path.join(workdir,'source','includes','main.md')
    return fse.outputFile(path_to_write,txt)
    .then(() => {
      return workdir
    })
  }
}

function buildPages(context) {
  return function(workdir) {
    return exec("cd "+workdir+" && npm install && npm run build")
    .then(() => { return workdir })
  }
}

function moveBuildedPages(context) {
  return function(workdir) {
    return fse.copy(path.join(workdir,'build'),path.join('.','docs'))
  }
}


function DocGenerator(context) {
  this.generate = function() {
    tmpdir = null
    return prepareTempFolders()
    .then( dir => {
      tmpdir = dir
      return dir
    })
    .then(generateMdSource(context))
    .then(buildPages(context))
    .then(moveBuildedPages(context))
    .then(() => {
      fse.remove(tmpdir)
    })
    .catch((err) => {
      console.log(err)
      fse.remove(tmpdir)
    })
  }
}

module.exports = DocGenerator