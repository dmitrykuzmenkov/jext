var var_regexp = /(\{\{.+?\}\})/g,
    compile_template = require('fs')
      .readFileSync(
        require.resolve('./compile.template.js'),
        {encoding: 'utf8'}
      );

var Compile = function (xml_tree, templates) {
  var lid = 0;
  function new_id() {
    return (lid++).toString(16);
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
           collector.vars[key].names[param] += '_' + Object.keys(collector.vars[key].names).length;
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

    var token, key, param;
    for (token in replacement) {
      param = var_name(token);
      key = param.split('.').shift();
      collector.vars[key].funcs.push(func_index);
    }
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
    var n_id = new_id(),
      n_name = 'n' + n_id,
      p_name = 'n' + node_id,
      text,
      a, i, l, child
    ;

    if (node_id === "0") {
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
        var p, attr, k, children_var, after_name, render_method;
        for (a = n.attributes, i = 0, l = n.attributes.length; i < l; i++) {
          switch (a[i].nodeName) {
            case 'if':
            case 'for':
              attr = a[i].nodeName;
              p = n.getAttribute(attr);
              n.removeAttribute(attr);
              k = attr + '_' + Object.keys(templates).length;
              children_var = k + '_c';
              new Compile(n, templates).build(k);

              // We need this element to insert new nodes relative to it
              after_name = 'a' + n_id;
              collector.init.push(after_name + '=document.createTextNode("")');
              collector.dom.push(p_name + '.appendChild(' + after_name + ')');

              render_method = (attr === 'if' ? 'render_child' : 'render_children');
              collect_vars(
                ['{{' + p + '}}'],
                collector,
                'jext.' + render_method + '("' + k + '",' + after_name + ',"{{' + p + '}}",pool,' + children_var + ')'
              );
              collector.children.push(children_var);
              break;
          }
        }

        if (!p) {
          collector.init.push(n_name + '=document.createElement("' + n.tagName + '")');
          if (n.attributes) {
            for (a = n.attributes, i = 0, l = n.attributes.length; i < l; i++) {
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
            for (i = 0, child = n.childNodes, l = n.childNodes.length; i < l; i++) {
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

    var param, name, def_name, parts;
    var def_code;
    for (param in collector.vars) {
      def_code = [];

      for (name in collector.vars[param].names) {
        def_name = collector.vars[param].names[name];
        parts = name.split('.');
        parts[0] = 'a';

        def_code.push(def_name + '=' + parts.join('.'));
        collector.init.push(def_name + "=''");
      }

      update_code.push(
        '"' + param + '":' +
        'function(a){' +
          def_code.join(';') + ';' +
          'f[' +
            collector.vars[param].funcs.join(']();f[') +
          ']();' +
        '}'
      );
    }

    // Collect update function definition
    var func, func_code = [];
    for (func in collector.funcs) {
      func_code.push(
        func + ':function(){' + collector.funcs[func] + '}'
      );
    }

    // Collect children variables
    collector.children.forEach(function(child) {
      collector.init.push(child + '=[]');
    });

    // Generate result
    templates[template] = compile_template.replace(
      /\{\{[a-z\_]+\}\}/g,
      function(m) {
        return {
          '{{var_code}}': collector.init.join(','),
          '{{func_code}}': func_code.join(','),
          '{{update_code}}': update_code.join(','),
          '{{dom_code}}': collector.dom.join(';')
        }[m];
      }
    );
  };
};
module.exports = Compile;
