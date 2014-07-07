KnockOff
========

[KnockoutJS](http://knockoutjs.com/) to [TAssembly](https://github.com/gwicke/tassembly) compiler.

- Compiles a basic subset of KnockoutJS functionality to TAssembly, a
  simple JSON-based intermediate template representation.
- Builds a HTML5 DOM internally, ensures proper nesting.
- TAssembly performs context-sensitive escaping of all user-provided data.
- The overall solution is the fastest JS templating library [in our
  micro-benchmarks](https://github.com/gwicke/TemplatePerf/blob/master/results.txt),
  but yet provides the security benefits of much more expensive DOM templating
  libraries.


## Usage

Simple example:
```javascript
var ko = require('knockoff');

var template = ko.compile('<div data-bind="attr:{id:id}, text: body"></div>'),
    model = {
	id: "myId",
	body: "some text"
    };

console.log( template( model ) );
```

Compile to [TAssembly](https://github.com/gwicke/tassembly) for later execution:
```javascript
var ko = require('knockoff');

var tassemblyTemplate = ko.compile(
	'<div data-bind="attr:{id:id}, text: body"></div>',
	{ toTAssembly: true }
    );
// ["<div",["attr",{"id":"m.id"}],">",["text","m.body"],"</div>"]
console.log( JSON.stringify( tassemblyTemplate) );
```

Compile all the way to a function, and pass in [TAssembly compilation
options](https://github.com/gwicke/tassembly/blob/master/README.md#usage):
```javascript
var ko = require('knockoff');

var options = {
    // Define globals accessible as $.* in any scope
    globals: {
        echo: function(x) {
            return x;
        }
    },
    // Define partial templates.
    // This one uses the global echo function defined above.
    partials: {
        userTpl: '<span data-bind="text: $.echo(name)"></span>'
    }
};

// Our simple template using KnockOut syntax, and referencing the partial
var templateString = '<div data-bind="template: { name: \'userTpl\', data: user }"></div>';

// Now compile the template & options into a function.
// Uses TAssembly internally, use toTAssembly option for TAssembly output.
var templateFn = ko.compile(templateString, options);

// A simple model object
var model = {
    user: { name: "Foo" }
};

// Now execute the template with the model.
// Prints: <div><span>Foo</span></div>
console.log( templateFn( model ) );
```

Partials are expected to be in KnockOff syntax, and will be compiled to
TAssembly automatically.


KnockOff spec
=============

KnockOff supports a subset of [KnockOut](http://knockoutjs.com/documentation/introduction.html) functionality. The biggest differences are:

- No reactivity. KnockOff aims for speed and one-shot operation.

- Limited expression syntax. KnockOut supports arbitrary JS, while we restrict
  ourselves to literals (including objects), model access and function calls.
  The usual KnockOut model accessors are supported. In addition, a global
  ```$``` object is defined, which can be populated with the ```globals```
  compile time option.


### text
Emit text content. HTML-sensitive chars are escaped. Options is a single
expression:
```html
<div data=bind="text: textContent"></div>
```
See also [the KnockOut docs for ```text```](http://knockoutjs.com/documentation/text-binding.html).

### foreach
Iterate over an array. The view model '$data' in each iteration is each member of the
array.
```html
<ul data-bind="foreach: links">
    <li data-bind="text: $data"></li>
</ul>
```

If each array element is an object, its members will be directly accessible
in the loop's view model:

```html
<ul data-bind="foreach: people">
    <li><a data-bind="attr: { href: homepageURL }, text: name"></a></li>
</ul>
```
You can pass in the name of a partial instead of the inline template.

```$index```, ```$parent``` and other context properties work just like [in
KnockOut](http://knockoutjs.com/documentation/foreach-binding.html).

See also [the KnockOut docs for ```foreach```](http://knockoutjs.com/documentation/foreach-binding.html).

### template
Calls a template (inline or name of a partial) with a given model.
```html
<div data-bind="template: { name: 'person-template', data: buyer }"></div>
```
See also [the KnockOut docs for ```template```](http://knockoutjs.com/documentation/template-binding.html).

### with
The with binding creates a new binding context, so that descendant elements
are bound in the context of a specified object. It evaluates a nested block
```iff``` the model object is truish.
```html
<div data-bind="with: person">
    <span data-bind="text: firstName"></span>
    <span data-bind="text: lastName"></span>
</div>
```
See also [the KnockOut docs for ```with```](http://knockoutjs.com/documentation/with-binding.html).

### if
Evaluates a block or template if an expression is true.
```html
<div data-bind="if: displayMessage">Here is a message. Astonishing.</div>
```
See also [the KnockOut docs for ```if```](http://knockoutjs.com/documentation/if-binding.html).

### ifnot
Evaluates a block or template if an expression is false.
```html
<div data-bind="ifnot: displayMessage">No message to display.</div>
```
See also [the KnockOut docs for ```ifnot```](http://knockoutjs.com/documentation/ifnot-binding.html).

### attr
Emit one or more HTML attributes. Automatic context-sensitive escaping is
applied to href, src and style attributes. 

```html
<a data-bind="attr: { href: url, title: details }">
    Report
</a>
```
See also [the KnockOut docs for ```attr```](http://knockoutjs.com/documentation/attr-binding.html).

### visible
Hides a block using CSS if the condition is falsy.

```html
<div data-bind="visible: shouldShowMessage">
    You will see this message only when "shouldShowMessage" holds a true value.
</div>
```

Currently this uses ```display: none !important;``` inline, but we could also
add a class instead. Let us know which you prefer.

See also [the KnockOut docs for ```visible```](http://knockoutjs.com/documentation/visible-binding.html).

### Virtual elements / container-less syntax
You can use Knockout's comment syntax to apply *control flow bindings* (`if`,
`ifnot`, `foreach`, `with`) to arbitrary content outside of elements:

```html
<ul>
    <li>This item always appears</li>
    <!-- ko if: someExpressionGoesHere -->
        <li>I want to make this item present/absent dynamically</li>
    <!-- /ko -->
</ul>
```
See also [the KnockOut docs for
```if```](http://knockoutjs.com/documentation/if-binding.html) and other
control flow bindings.

Model access and expressions
----------------------------
KnockOff supports a restricted set of simple JS expressions. These are a
subset of KnockOut's arbitrary JS. A KnockOff expression will normally also be
a valid KnockOut expression.

* Literals: 
  * Number ```2``` or ```3.4```
  * Quoted string ```'Some string literal'```
  * Object ```{foo: 'bar', baz: someVar}```
* Variable access with dot notation: ```foo.bar```
* Array references: ```users[user]```
* Function calls: ```$.i18n('username', {foo: bar} )```; nesting and multiple
  parameters supported

Expressions have access to a handful of variables defined in the current
context:
* ```$data``` - current view model
* ```$root``` - root (topmost) view model
* ```$parent``` - parent view model
* ```$parents``` - array of parent view models
* ```$parentContext``` - parent context object
* ```$index``` - current iteration index in foreach
* ```$``` - globals defined at compile time; typically used for helper functions
  which should not be part of the model (i18n etc). This is an extension over
  KnockOut, which can be replicated there using [expression
  rewriting](http://knockoutjs.com/documentation/binding-preprocessing.html).
