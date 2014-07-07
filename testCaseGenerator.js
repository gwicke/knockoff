"use strict";
var ko = require('./knockoff.js'),
	c = require('./KnockoutCompiler');


var model = {
		arr: [1,2,3,4,5,6,7],
		items: [
		{
			key: 'key1',
			value: 'value1'
		},
		{
			key: 'key2',
			value: 'value2'
		}
		],
			obj: {
				foo: "foo",
				bar: "bar"
			},
			name: 'Some name',
			content: 'Some sample content',
			id: 'mw1234',
			predTrue: true,
			predFalse: false,
			nullItem: null,
			someItems: [
			{ childProp: 'first child' },
			{ childProp: 'second child' }
		]
	},
	options = {
		globals: {
			echo: function(i) {
				return i;
			},
			echoJSON: function() {
				return JSON.stringify(Array.prototype.slice.apply(arguments));
			}
		},
		partials: {
			'testPartial': '<span data-bind="text:foo"></span><span data-bind="text:bar"></span>'
		}
	};

var tests = {
	partials: {
		knockout: {
			testPartial: '<span data-bind="text:foo"></span><span data-bind="text:bar"></span>'
		},
		tassembly: {
			testPartial: c.compile('<span data-bind="text:foo"></span><span data-bind="text:bar"></span>')
		}
	},
	model: model,
	tests: []
};

function test(input) {
	var tpl = ko.compile(input, options),
		testObj = {
			knockout: input,
			tassembly: c.compile(input),
			result: tpl(model)
		};
	//console.log('=========================');
	//console.log('Knockout template:');
	//console.log(input);
	//console.log('TAssembly JSON:');
	//console.log(JSON.stringify(testObj.tassembly, null, 2));
	//console.log('Rendered HTML:');
	//console.log(testObj.result);
	tests.tests.push(testObj);
}

// foreach
test('<div data-bind="attr: {title: name}, foreach: items">'
				+ '<span data-bind="attr: {title: key}, text: value"></span></div>');
test("<div data-bind='foreach: myArray'><span data-bind='text: $data'></span></div>");

// if / ifnot
test('<div data-bind="if: predTrue">Hello world</div>');
test('<div data-bind="if: predFalse">Hello world</div>');
test('<div data-bind="if: predTrue, text: name">Hello world</div>');
test('<div data-bind="if: predFalse, text: name">Hello world</div>');

test('<div data-bind="ifnot: predTrue">Hello world</div>');
test('<div data-bind="ifnot: predFalse">Hello world</div>');
test('<div data-bind="ifnot: predTrue, text: name">Hello world</div>');
test('<div data-bind="ifnot: predFalse, text: name">Hello world</div>');

// Expression literals
// constant string
test('<div data-bind="text: &quot;constant stri\'ng expression&quot;">Hello world</div>');
test('<div data-bind="text: &quot;constant \\&quot;stri\'ng expression&quot;">Hello world</div>');
test('<div data-bind="text: \'constant string\'">Hello world</div>');
test('<div data-bind=\'text: "constant \\&quot;string"\'>Hello world</div>');

test('<div data-bind="text: 12345">Some number</div>');

// constant number

test('<div data-bind="text: 2">Hello world</div>');


test('hello world<span>foo</span><div data-bind="text: content">ipsum</div>');

test('hello world<span>foo</span><div data-bind="with: obj"><span data-bind="text: foo">hopefully foo</span><span data-bind="text:bar">hopefully bar</span></div>');

test('hello world<div data-bind="template:{name:' + "'testPartial'" + ', data: obj}"></div>');

test('<div data-bind="visible:predFalse"><span data-bind="text:name"></span></div>');

test('<div data-bind="with:predFalse"><span data-bind="text:name"></span></div>');

test('<div data-bind="with:obj"><span data-bind="text:foo"></span></div>');

test('<div data-bind="attr:{id:id},foreach:items"><div data-bind="attr:{id:key},text:value"></div></div>');
// complex attr
test('<div data-bind="attr:{id:items[0].key}"></div>');

test('<div data-bind="foreach:arr"><div data-bind="text:$.echo($data)"></div></div>');

test('<div data-bind="text: $.echoJSON( { id : &quot;id&quot; } )"></div>');
test('<div data-bind="text: $.echoJSON( { id : \'a\', foo: \'foo\' } )"></div>');
test('<div data-bind="text: $.echoJSON( 1,2,3,4 )"></div>');
test('<div data-bind="text: $.echoJSON( items )"></div>');
test('<div data-bind="text: $.echoJSON( items[0] )"></div>');
test('<div data-bind="text: $.echoJSON( items[0].key )"></div>');
test('<div data-bind="text: $.echoJSON( items[0].key,items[1].key )"></div>');

/**
 * KnockoutJS tests
 */

// attrBehavior.js
test("<div data-bind='attr: {firstAttribute: myValue, \"second-attribute\": true}'></div>");
// null value
test("<input data-bind='attr: { title: nullItem }' />");
test("<input data-bind='attr: { title: name }' />");
test("<div class='oldClass' data-bind=\"attr: {'class': myprop}\"></div>");

// foreachBehaviors.js
test("<div data-bind='foreach: nullItem'><span data-bind='text: nullItem.nonExistentChildProp'></span></div>");
test("<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>");
//test("<div data-bind='foreach: [1, 2]'><span></span></div>");
test("<div data-bind='foreach: someItems'><span data-bind='text: $.echoJSON($data)'></span></div>");
test("<div data-bind='foreach: someItems'><span data-bind='text: childProp'></span></div>");
//test("<div data-bind='foreach: someitems'>a<!-- ko if:true -->b<!-- /ko --></div>");
//test("x-<!--ko foreach: someitems--><!--ko test:$data--><!--/ko--><!--/ko-->");
//test("<div data-bind='foreach: someitems'><!-- ko if:true --><span data-bind='text: $data'></span><!-- /ko --></div>");
test("<div data-bind='foreach: items'>"
		+ "<div data-bind='foreach: children'>"
		+ "(Val: <span data-bind='text: $data'></span>, Parents: <span data-bind='text: $parents.length'></span>, Rootval: <span data-bind='text: $root.rootVal'></span>)"
		+ "</div>"
		+ "</div>");
test("<div data-bind='foreach: arr'><input data-bind='value: $rawData'/></div>");
test("<div data-bind='foreach: arr'><span data-bind='text: $data'></span></div>");

// HTML comment syntax
test("<ul><!-- ko foreach: arr --><li data-bind='text: $data'></li><!-- /ko -->");
test("hi <!-- ko foreach: someItems --><span data-bind='text: childProp'></span><!-- /ko -->");


/**
 * Invalid expressions
 */
// arithmetic expressions are not allowed
test('<div data-bind="text: 2 + 2 &#x22;">Hello world</div>');

console.log(JSON.stringify(tests, null, 2));
