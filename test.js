"use strict";

// Simple test runner using tests.json data

var tests = require('./tests.json'),
    model = tests.model,
    ko = require('./knockoff.js'),
    ta = require('./node_modules/tassembly/tassembly.js'),
    assert = require('assert'),
    options = {
		globals: {
			echo: function(i) {
				return i;
			},
			echoJSON: function() {
				return JSON.stringify(Array.prototype.slice.apply(arguments));
			}
		},
        partials: tests.partials.knockout
    };

tests.tests.forEach(function(test) {
    // Test compilation to TAssembly
    var tpl = ko.compile(test.knockout, { toTAssembly: true, partials: options.partials });
    assert.equal(JSON.stringify(test.tassembly), JSON.stringify(tpl));

    // Test evaluation using TAssembly, implicitly testing the TAssembly
    // runtime
    var res = ta.compile(tpl, options)(model);
    assert.equal(JSON.stringify(test.result), JSON.stringify(res));
});

console.log('\nPASSED', tests.tests.length * 2, 'test cases.');
