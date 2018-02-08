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
      var src_path = path.resolve(__dirname,'..','..','vendor','mkdocs')
      fse.copy(src_path,tmp_folder,() => {
        resolve(tmp_folder)
      })
      //resolve(tmp_folder)
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
      data: _(data).omit('Requirement'),
      getReference: function(cat,obj) {
        return _(data[cat]).find(i => i.name == obj).spec
      },
      requirements: _(data['Requirement']).groupBy(i => (!!i.spec.cases)?'Use cases':'Constraints')
    }
    allFiles = _(['requirements','reference']).map( page => {
      txt = nj.render(page+'.md.njk',render_data)
      path_to_write = path.join(workdir,'docs',page+'.md')
      return fse.outputFile(path_to_write,txt)
    })
    return Promise.all(allFiles)
    .then(() => {
      return workdir
    })
  }
}

function buildPages(context) {
  return function(workdir) {
    return exec("cd "+workdir+" && mkdocs build -d ./build/ -t material")
    .then(() => { return workdir })
  }
}

function moveBuildedPages(context) {
  var wd;
  return function(workdir) {
    wd = workdir
    return fse.copy(path.join(workdir,'build'),path.join('.','docs'))
    .then(() => {
      return fse.copy(path.join(workdir,'docs'),path.join('.','wiki'))
    })
  }
}

function checkDependencies() {
  return new Promise((resolve,reject) => {
    exec('python --version')
    .catch((err) => {
      console.log('Python may be not installed: ',err.stderr)
      reject(err)
      return false
    })
    .then((result) => {
      if(!result) { return reject() }
      console.log("Python is installed.")
      return exec('pip --version')
      .catch((err) => {
        console.log('Pip may be not installed: ',err.stderr)
        reject(err)
        return false
      })
    })
    .then((result) => {
      if(!result) { return reject()}
      console.log("Pip is installed.")
      return exec('pip show mkdocs')
      .catch((err) => {
        console.log('mkdocs may be not installed:',err.stderr)
        console.log('Trying to install it.')
        return exec('pip install mkdocs')
        .catch((err) => {
          console.log('mkdocs could not be installed:',err.stderr)
          reject(err)
          return false
        })
      })
    })
    .then((result) => {
      if(!result) { return reject()}
      console.log("mkdocs is installed.")
      return exec('pip show mkdocs-material')
      .catch((err) => {
        console.log('mkdocs-material may be not installed:',err.stderr)
        console.log('Trying to install it.')
        return exec('pip install mkdocs-material')
        .catch((err) => {
          console.log('mkdocs-material could not be installed:',err.stderr)
          reject(err)
          return false
        })
      })
    })
    .then((result) => {
      if(!result) { return reject()}
      console.log("mkdocs-material is installed.")
      resolve(true)
    }).catch(reject)
  })
}


function DocGenerator(context) {
  this.generate = function() {
    tmpdir = null
    return checkDependencies()
    .then(prepareTempFolders)
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