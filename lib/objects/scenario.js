var jp = require('jsonpath')
var _ = require('underscore')
var nj = require('nunjucks')
const styleSelector = require('../tools.js').styleSelector
const should = require('../tools.js').should

var component_fields = [
  'done_by',
  'produced_by',
  'consumed_by'
]

function Scenario(data,context) {
  this.name = data.name
  this.context = context
  this.steps = data.spec.steps
  this._components = null

  this.components = function() {
    if(this._components == null) {
      var cmpnts = []
      component_fields.forEach(f => {
        cmpnts.push(jp.query(this.steps,'$..'+f))
      })
      this._components = _(_(cmpnts).flatten()).unique()
    }
    return this._components
  }

  this.forEachStep = function(cb) {
    _(this.steps).each((s,idx) => {
      var sstep = new ScenarioStepFactory(s,this.context).build()
      cb(sstep,idx)
    })
  }

  this.allSteps = function() {
    return _(this.steps).map((s) => {
      return new ScenarioStepFactory(s,this.context).build()
    })
  }

  this.validate = function(){
    this.validationResult = { valid: true, steps: [] }
    this.forEachStep((step,i) => {
      this.validationResult.steps.push(step.validate())
    })
    this.validationResult.valid = _(this.validationResult.steps).every(step_results => _(step_results).every(r => r.valid))
    return this.validationResult
  }
}

function ScenarioStep(step,ctx) {
  this.context = ctx
  _(this).extend(step)

  this.asTextLine = function() {
    var tpln = this._textLineTemplate || 'Undefined step'
    var obj = step
    obj.style = styleSelector(ctx.style)
    return nj.renderString(tpln,obj)
  }
}

// If you have a new step, just add a condition and create the class
function ScenarioStepFactory(step,ctx) {
  this.isAction = () => step.action !== undefined
  this.isConsumedMessage = () => (step.message !== undefined) && (step.consumed_by !== undefined)
  this.isProducedMessage = () => (step.message !== undefined) && (step.produced_by !== undefined)
  this.isCalledAPI = () => (step.api !== undefined) && (step.called_by !== undefined)
  this.isStartAfter = () => step.after !== undefined
  
  this.build = function() {
    if(this.isAction()) {
      return new DoesActionStep(step,ctx)
    } else if(this.isConsumedMessage()) {
      return new ConsumesMessageStep(step,ctx)
    } else if(this.isProducedMessage()) {
      return new ProducesMessageStep(step,ctx)
    } else if(this.isCalledAPI()) {
      return new CallsAPIStep(step,ctx)
    } else if(this.isStartAfter()){
      return new StartAfterStep(step,ctx)
    }
  } 
}

function StartAfterStep(step,ctx){
  _(this).extend(new ScenarioStep(step,ctx))
  this._textLineTemplate = 'Starts after scenario {{style(after)}} ends',
  this.validate = () => {
    return  [ should(!!ctx.exists("Scenario",step.after),`Scenario ${step.after} doesn't exist`) ]
  }
}

function DoesActionStep(step,ctx){
  _(this).extend(new ScenarioStep(step,ctx))
  this._textLineTemplate = '{{style(done_by)}} {{action}}',
  this.validate = () => {
    return  [ should(!!ctx.exists("Component",step.done_by),`Component ${step.done_by} doesn't exist`) ]
  }
}

function ConsumesMessageStep(step,ctx){
  _(this).extend(new ScenarioStep(step,ctx))
  this._textLineTemplate = '{{style(consumed_by)}} consumes {{style(message)}}'
  this.validate = () => {
    return [  should(!!ctx.exists("Component",step.consumed_by),`Component ${step.consumed_by} doesn't exist`),
              should(!!ctx.exists("Message",step.message),`Message ${step.message} doesn't exist`),
              should(!!ctx.exists("Component",step.consumed_by,'consumes[?(@.message == "'+step.message+'")]'),`${step.consumed_by} doesn't consume ${step.message}`)
            ]
  }
}

function ProducesMessageStep(step,ctx){
  _(this).extend(new ScenarioStep(step,ctx))
  this._textLineTemplate = '{{style(produced_by)}} produces {{style(message)}}'
  this.validate = () => {
    return [  should(!!ctx.exists("Component",step.produced_by),`Component ${step.produced_by} doesn't exist`),
              should(!!ctx.exists("Message",step.message),`Message ${step.message} doesn't exist`),
              should(!!ctx.exists("Component",step.produced_by,'produces[?(@.message == "'+step.message+'")]'),`${step.produced_by} doesn't produce ${step.message}`)
            ]
  }
}

function CallsAPIStep(step,ctx){
  _(this).extend(new ScenarioStep(step,ctx))
  this._textLineTemplate = '{{style(called_by)}} calls {{style(api)}}{% if to %} to{% for i in to %}{% for a,p in i %} {{a}} {{p}}{% endfor %}{% if not loop.last %},{% endif %}{% endfor %}{% endif %}'
  this.validate = () => {
    return [  should(!!ctx.exists("Component",step.called_by),`Component ${step.called_by} doesn't exist`),
              should(!!ctx.exists("ExternalService",step.api),`ExternalService ${step.api} doesn't exist`)
           ]
  }
}

module.exports = Scenario