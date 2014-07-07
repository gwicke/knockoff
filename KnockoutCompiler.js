/**
 * Compile Knockout templates to quicktemplate JSON
 */
"use strict";

var DOMCompiler = require('./DOMCompiler.js'),
    KnockoutExpressionParser = require('./KnockoutExpressionParser.js'),
    domino = require('domino');


var ctxMap = {
    '$data': 'm',
    '$root': 'rm',
    '$parent': 'pm',
    '$parents': 'pms',
    '$parentContext': 'pc',
    '$index': 'i',
    '$context': 'c',
    '$rawData': 'd'
};

function stringifyObject (obj) {
    if (obj.constructor === Object) {
        var res = '{',
            keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (i !== 0) {
                res += ',';
            }
            if (/^[a-z_$][a-z0-9_$]*$/.test(key)) {
                res += key + ':';
            } else {
                res += "'" + key.replace(/'/g, "\\'") + "':";
            }
            res += stringifyObject(obj[key]);
        }
        res += '}';
        return res;
    } else {
        return obj.toString();
    }
}

function stringifyChildObjects (obj) {
    for (var key in obj) {
        var child = obj[key];
        if (child && child.constructor === Object) {
            obj[key] = stringifyObject(child);
        }
    }
    return obj;
}

var parserOptions = {
    ctxMap: ctxMap,
    stringifyObject: stringifyObject
};

function handleNode(node, cb, options) {
    var dataBind = node.getAttribute('data-bind');
    if (!dataBind) {
        // let processing continue
        return {};
    }
    // XXX: keep this for client-side re-execution?
    node.removeAttribute('data-bind');
    var bindObj,
        bindOpts, ctlFn, ctlOpts,
        ret = {};

    if (node.getAttribute('data-bind-placeholder') === 'true') {
        ret.stripWrapper = true;
    }

    try {
        bindObj = KnockoutExpressionParser.parse(dataBind, parserOptions);
    } catch (e) {
        console.error('Error while compiling ' + JSON.stringify(dataBind) + ':\n' + e);
        //console.error(e.stack);
        return {};
    }

    /*
     * attr
     */
    if (bindObj.attr) {
        // remove same attributes from element
        Object.keys(bindObj.attr).forEach(function(name) {
            // XXX: don't do destructive updates on the DOM
            node.removeAttribute(name);
        });
        ret.attr = ['attr', stringifyChildObjects(bindObj.attr)];
    }

    if (bindObj.visible || bindObj['with']) {
        if (!ret.attr) {
            ret.attr = ['attr',{}];
        }
        ret.attr[1].style = {
            // Implement visible as inline style for now; consider moving to
            // class / make this configurable
            v: ret.attr[1].style || null,
            app: [
            {
                'ifnot': bindObj.visible || bindObj['with'],
                v: 'display: none !important;'
            }
            ]
        };
        // Don't set ret.content, which lets the compiler descend into it
        if (bindObj.visible) {
            return ret;
        }
    }

    /*
     * Now for the content
     */
    if (bindObj.text) {
        // replace content with text directive
        ret.content = ['text', stringifyObject(bindObj.text)];
        return ret;
    }

    // Special template functionality both inside
    // template: { foreach: dataSource }
    // or stand-alone as in foreach: { data: dataSource }
    var templateTriggers = ['foreach', 'with', 'if', 'ifnot'];
    // Descend into a template member if there is one
    bindOpts = bindObj.template || bindObj;
    ctlOpts = {};
    for (var i = 0; i <= templateTriggers.length; i++) {
        var trigger = templateTriggers[i];
        if (trigger in bindOpts) {
            ctlFn = trigger;
            ctlOpts.data = stringifyObject(bindOpts[ctlFn] || bindOpts.data);
            if (trigger === 'foreach' && bindOpts.as) {
                ctlOpts.as = bindOpts.as + '';
            }
            if (!bindOpts.name) {
                ctlOpts.tpl = new DOMCompiler().compile(node, options);
            } else {
                // Only allow statically named templates defined on the model
                ctlOpts.tpl = bindOpts.name + '';
            }
            ret.content = [ctlFn, ctlOpts];
            return ret;
        }
    }

    // Simple template without foreach / with / if / ifnot
    if (bindObj.template) {
        ctlOpts.data = stringifyObject(bindOpts.data);
        if (!bindOpts.name) {
            ctlOpts.tpl = new DOMCompiler().compile(node, options);
        } else {
            // Only allow statically named templates defined on the model
            ctlOpts.tpl = bindOpts.name + '';
        }
        ret.content = ['template', ctlOpts];
        return ret;
    }



    return ret;
}

var ELEMENT_NODE = 1,
    COMMENT_NODE = 8,
    koStartComment = /^\s*ko\s(.*)$/,
    koEndComment = /^\s*\/ko\s*$/;
function preprocessComments (node, options) {
    if (node.nodeType === ELEMENT_NODE) {
        var children = node.childNodes.slice();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.nodeType === COMMENT_NODE
                    && koStartComment.test(child.data)) {
                var dataBind = koStartComment.exec(child.data)[1];
                // look for the closing tag
                var j = i + 1,
                    endNode = children[j];
                while (endNode) {
                    if (endNode.nodeType === COMMENT_NODE
                        && koEndComment.test(endNode.data)) {
                        // Found the end node. Wrap into div.
                        var div = child.ownerDocument.createElement('div');
                        div.setAttribute('data-bind', dataBind);
                        div.setAttribute('data-bind-placeholder', 'true');
                        node.insertBefore(div, child.nextSibling);
                        // Move children into div wrapper
                        i++;
                        while (i < j) {
                            div.appendChild(children[i]);
                            i++;
                        }
                        // Skip over processed children & remove comments
                        // XXX: preserve some of those comments?
                        node.removeChild(child);
                        node.removeChild(endNode);
                        i = j - 1;
                        break;
                    } else {
                        endNode = children[++j];
                    }
                }
            } else if (child.nodeType === ELEMENT_NODE) {
                preprocessComments(child, options);
            }
        }
    }
}


/**
 * Compile a Knockout template to TAssembly JSON
 *
 * Accepts either a template string or a DOM node.
 */
function compile (nodeOrString) {
    var options = {
        handlers: {
            'element': handleNode
        }
    },
        node = nodeOrString;

    // Build a DOM if string was passed in
    if (nodeOrString.constructor === String) {
        node = domino.createDocument(nodeOrString).body;
        // Include all children, but not <body> itself
        options.innerXML = true;
    }

    preprocessComments(node, options);
    //console.log(node.outerHTML);

    return new DOMCompiler().compile(node, options);
}

module.exports = {
    compile: compile
};
