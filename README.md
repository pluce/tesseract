# Tesseract

Tesseract is a domain-specific language to model software architecture. It can describe software design blocks and relationships, helps writing down specifications and architecture documentation.

## Installation

`npm install pluce/tesseract` will install locally, add a symbolic link to the `tesseract.js` file in your $PATH to use it everywhere.

## CLI

A command-line interface is provided in order to:

- browse the model (query objects)
- generate HTML documentation (needs python+pip installed)
- check validity of the model
- read a scenario

Use `tesseract -h` to read help.

## Model Syntax

A Tesseract model is a bunch of YAML files in a folder, or just a single YAML file. Use `--project` option of the CLI to tell where is your model. Please ensure your files describing objects have `.defs.yml` suffix.

>Cannot browse folder recursively yet

Every part of the model is an `Object`. An `Object` is always described like this:

```yaml
kind: KindOfObject
name: UniqueNameOfTheObject
notes: |
  A description of the Object, can be a long text if you use YAML notation
todo: An optional TODO field, used in the 'tesseract todos' command
spec:
    # This is the specification of the object, fields will vary depending on object kind
    key: value
```

Let me describe each supported Kind at the moment.

### Component

These objects are basic building block of software. They can be anything like a code class, a worker, a microservice, an API... anything that belongs to the software you're designing.

### ExternalService

These objects are software actors outside your scope. You describes them only to have a complete overview of your environment. It can be a SaaS, an API, etc.

### Message

These objects represent messages sent asynchronously between Components or ExternalServices, typically through a message bus or ESB.

### Scenario

These objects represent a description of the system behaviour. It describes step-by-step the resolution of a use case.

### Requirement

These objects are functional or technical requirements of the system.

## Sample

Some samples are available in the `samples` directory. You may try them easily:

```shell
npm install -g serve
tesseract -p samples/slock.yml doc && serve docs
```

