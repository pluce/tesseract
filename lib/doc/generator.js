var tmp = require('tmp-promise')
var path = require('path')
const fse = require('fs-extra')
var _ = require('underscore')
var exec = require('child-process-promise').exec;
var nj = require('nunjucks').configure(path.resolve(__dirname,'./tpl'))

function prepareTempFolders() {
  return new Promise((resolve,reject) => {
    try {
      console.log("Start generating doc")
      var tmp_folder = tmp.dirSync().name
      var src_path = path.resolve(__dirname,'..','..','vendor','mkdocs')
      fse.copy(src_path,tmp_folder,() => {
        resolve(tmp_folder)
      })
      //resolve(tmp_folder)
    } catch(e) { console.log(e) }
  })
}

function generateMdSource(model) {
  return function(workdir) {
    context = model.context

    data = prepareData(context.list('!@.spec.inside'))
//console.log(data)
    detailed_parts = _(context.list('@.spec.inside')).groupBy(i => i.spec.inside)
    detailed_components = _.chain(detailed_parts).keys().unique().value()


    detailed_data = {}

    detailed_components.forEach( c => {
      detailed_data[c] = {
        component: c,
        data: prepareData(detailed_parts[c]),
        page: c.toLowerCase()+'/'+c.toLowerCase()+'_reference.md'
      }
    })

    render_data = {
      data: _(data).omit('Requirement'),
      getReference: function(cat,obj) {
        return _(data[cat]).find(i => i.name == obj).spec
      },
      requirements: _(data['Requirement']).groupBy(i => (!!i.spec.cases)?'Use cases':'Constraints'),
      meta: function(key){
        return model.metadata.get(key)
      },
      details: detailed_data
    }

    pages_to_make = [
      { make: 'mkdocs.yml' },
      { make: 'docs/requirements.md' },
      { make: 'docs/overview.md', from: 'docs/reference.md.njk' },
      
    ]

    _(detailed_data).each((detail,k) => {
      pages_to_make.push(
        { make: 'docs/'+detail.page, from: 'docs/reference.md.njk', data: detail.data, details_of: detail.component}
      )
    })

    allFiles = _(pages_to_make).map( page => {
      var tpl = page.from || (page.make+'.njk')
      d = _(render_data).clone()
      if(page.data) {
        d.details_of = page.details_of
        d.data = page.data
      }
      txt = nj.render(tpl,d)
      path_to_write = path.join(workdir,page.make)
      return fse.outputFile(path_to_write,txt)
    })

    return Promise.all(allFiles)
    .then(() => {
      return workdir
    })
  }
}

function prepareData(d) {
  d = _.chain(d).values().groupBy("kind").value()

  // Prepare scenarios
  _(d['Scenario']).each(i => {
    var sc = context.scenario(i.name)
    i.steps = _(sc.allSteps()).each(s => s.textLine = s.asTextLine())
    i.validation = _.chain(sc.validate().steps).flatten().filter(i => !!i.message).map(i => i.message).unique().value()
  })

  // Prepare references
  var refs = context.references({})
  _(d).each((v,k) => { 
    _(v).each(i => i.references = _.chain(refs[i.name]).map(i => i.origin).unique().value())
  })
  return d
}

function buildPages(model) {
  return function(workdir) {
    context=model.context
    return exec("cd "+workdir+" && mkdocs build -d ./build/ -t material")
    .then(() => { return workdir })
  }
}

function moveBuildedPages(model) {
  var wd;
  return function(workdir) {
    context=model.context
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

function GenerateDiagrams(model) {
  var ctx = model.context

  var cmpList = ctx.list('@.kind=Component')
  var extList = ctx.list('@.kind=ExternalService')
  var boxes = _(cmpList).concat(extList)

  var refList = ctx.references()


}


function DocGenerator(model) {
  this.generate = function() {
    tmpdir = null
    return checkDependencies()
    .then(prepareTempFolders)
    .then( dir => {
      tmpdir = dir
      return dir
    })
    .then(generateMdSource(model))
    .then(buildPages(model))
    .then(moveBuildedPages(model))
    .then(() => {
      //fse.remove(tmpdir)
      console.log("Finished generating doc !")
    })
    .catch((err) => {
      console.log(err)
      fse.remove(tmpdir)
    })
  }
}

module.exports = DocGenerator