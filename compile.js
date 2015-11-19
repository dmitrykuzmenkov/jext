var var_regexp = /(\{\{.+?\}\})/g;

var Compile = function (xml_tree, templates) {
  var lid = 0;
  function new_id() {
    return lid++;
  }

  var collector = {
    vars: {},
    children: [],
    funcs: [],
    init: [],
    dom: []
  };

  function var_name(token) {
    return token.substring(2).split('}}').shift().trim();
  }

  function parse_tokens(str) {
    return str.match(var_regexp) || [];
  }

  function collect_vars(tokens, collector, update_code) {
    var replacement = {};
    tokens.forEach(function(token) {
      var param = var_name(token);
      var key = param.split('.').shift();
      if (!collector.vars[key]) {
        collector.vars[key] = {
          names: {},
          funcs: []
        };
      }

      if (!collector.vars[key].names[param]) {
        collector.vars[key].names[param] = 'v' + Object.keys(collector.vars).length;
        if (key !== param) { // Object var?
           collector.vars[key].names[param] += '_' + Object.keys(collector.vars[key].names).length
        }
      }

      replacement[token] = collector.vars[key].names[param];
    });

    var func_index = collector.funcs.push(update_code.replace(
      var_regexp,
      function (m) {
        return '"+' + replacement[m] + '+"';
      }
    ).replace('""+', '').replace('+""', '')) - 1;
    Object.keys(replacement).forEach(function(token) {
      var param = var_name(token);
      var key = param.split('.').shift();
      collector.vars[key].funcs.push(func_index);
    });
  }

  function string(str) {
    return '"' + str
      .replace(/(?:\r\n|\r|\n)/g, '')
      .replace(/^\s+|\s+$/g, '') + '"'
    ;
  }

  function trim_vars(str) {
    return str.replace(var_regexp, '');
  }

  function node(n, node_id, collector) {
    var n_id = new_id();
    var n_name = 'n' + n_id;
    var p_name = 'n' + node_id;
    var text;

    if (node_id === 0) {
      collector.init.push(p_name + '=document.createDocumentFragment()');
    }

    switch (n.nodeType) {
      case 9: // Document
        node(n.firstChild, node_id, collector);
        break;

      case 3: // Text
        text = string(n.nodeValue);

        collect_vars(parse_tokens(text), collector, n_name + '.textContent=' + text);
        collector.init.push(n_name + '=document.createTextNode(' + trim_vars(text) + ')');
        collector.dom.push(p_name + '.appendChild(' + n_name + ')');

        break;

      case 1: // Element
        var p = null;
        for (var a = n.attributes, i = 0, l = n.attributes.length; i < l; i++) {
          switch (a[i].nodeName) {
            case 'if':
            case 'for':
              p = n.getAttribute(a[i].nodeName);
              n.removeAttribute(a[i].nodeName);
              var k = a[i].nodeName + '_' + Object.keys(templates).length;
              var children_var = k + '_c';
              new Compile(n, templates).build(k);
              collect_vars(
                ['{{' + p + '}}'],
                collector,
                'jext.render_children("' + k + '",' + p_name + ',"{{' + p + '}}",pool,' + children_var + ')'
              );
              collector.children.push(children_var);
              break;
          }
        }

        if (!p) {
          collector.init.push(n_name + '=document.createElement("' + n.tagName + '")');
          if (n.attributes) {
            for (var a = n.attributes, i = 0, l = n.attributes.length; i < l; i++) {
              text = string(a[i].value);
              collect_vars(
                parse_tokens(text),
                collector,
                n_name + '.setAttribute("' + a[i].name + '",' + text + ')'
              );

              if (trim_vars(text) !== '""') {
                collector.dom.push(n_name + '.setAttribute("' + a[i].name + '",' + trim_vars(text) + ')');
              }
            }
          }
          collector.dom.push('n' + node_id + '.appendChild(' + n_name + ')');

          if (n.childNodes) {
            for (var i = 0, child = n.childNodes, l = n.childNodes.length; i < l; i++) {
              node(child[i], n_id, collector);
            }
          }
        }
        break;
    }
  }


  // Generate DOM
  this.build = function(template) {
    node(xml_tree, new_id(), collector);

    // Generate variable set functions
    var update_code = [], init_code = [];
    Object.keys(collector.vars).forEach(function(param) {
      var def_code = [];

      Object.keys(collector.vars[param].names).forEach(function(name) {
        var def_name = collector.vars[param].names[name];
        var parts = name.split('.');
        parts[0] = 'a';

        def_code.push(def_name + '=' + parts.join('.'));
        collector.init.push(def_name + "=''");
      });

      var func_code = [];
      collector.vars[param].funcs.forEach(function (func) {
        func_code.push('f[' + func + ']()');
      });

      update_code.push(
        '"' + param + '":' +
        'function(a){' +
          def_code.join(';') + ';' +
          func_code.join(';') +
        '}'
      );
    });

    // Collecto update function definition
    var func_code = [];
    Object.keys(collector.funcs).forEach(function(func) {
      func_code.push(
        func + ':function(){' + collector.funcs[func] + '}'
      );
    });

    // Collect children variables
    collector.children.forEach(function(child) {
      collector.init.push(child + '=[]');
    });

    // Generate result
    templates[template] =
      'function(pool){' +
        'var ' + collector.init.join(',') + ',' +
        'f={' + func_code.join(',') + '},' +
        'u={' + update_code.join(',') + '}' +
        ';' +
        'return {' +
          'dom:function(){' +
            collector.dom.join(';') + ';' +
            'return n0' +
          '},' +
          'set:function(k,v){u[k](v)},' +
          'update:function(a){' +
            'if(a!==undefined&&typeof(a)==="object"){' +
              'Object.keys(a).forEach(function(p){' +
                'k=p.split(".").shift();u[k](a[p])' +
              '})' +
            '}' +
          '}' +
        '}' +
      '}'
    ;

  };
};
module.exports = Compile;
