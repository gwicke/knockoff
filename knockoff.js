"use strict";
var TA = require('tassembly'),
	koCompiler = require('./KnockoutCompiler.js');

/**
 * Compile a Knockout template to a function
 *
 * @param {misc} template HTML string or DOM node
 * @param {object} options
 * @returns {function(model)} function that can be called with a model and
 *							  returns an HTML string
 */
function compile(template, options) {
	var templateASM = koCompiler.compile(template, options);
	if (options && options.partials) {
		// compile partials
		var partials = options.partials;
		for (var name in partials) {
			if (!Array.isArray(partials[name])) {
				partials[name] = koCompiler.compile(partials[name]);
			}
		}
	}
	if (options && options.toTAssembly) {
		return templateASM;
	} else {
		return TA.compile(templateASM, options);
	}
}


module.exports = {
	compile: compile
};

function main () {
	var template = '';
	process.stdin.on('readable', function() {
		var chunk = process.stdin.read();
		if (chunk !== null) {
			template += chunk;
		}
	});
	process.stdin.on('end', function () {
		console.log(JSON.stringify(koCompiler.compile(template)));
	});
}

if (!module.parent) {
	// run as cmdline script
	main();
}
