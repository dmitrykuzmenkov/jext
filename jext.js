(function(context) {
  var templates = {};

  var methods = {
    get: function(template, data) {
      var t = templates[template](methods);
      if (data) {
        t.update(data);
      }
      return t;
    },
    release: function(template, instance) {
      instance.remove();
    }
  };

  var pool = function(pool) {
    templates = pool;

    return methods;
  };

  var render_child = function(template, node, data, pool, children) {
      render_children(template, node, data ? [data] : [], pool, children);
  };

  var render_children = function(template, node, data, pool, children) {
    data = data || [];

    for (var i = children.length - data.length; i > 0; i--) {
      pool.release(template, children.pop());
    }

    for (var i = children.length - 1; i >= 0; i--) {
      children[i].update(data[i]);
    }

    if (children.length < data.length) {
      var fragment = document.createDocumentFragment();

      for (var lb = children.length, ub = data.length; lb < ub; lb++) {
        var nested = pool.get(template);

        children.push(nested);
        fragment.appendChild(nested.dom());
        nested.update(data[lb]);
      }

      node.parentNode.insertBefore(fragment, node);
    }
  };

  var container = typeof(module) !== 'undefined' ? module.exports : (window.jext = {});

  container.pool = pool;
  container.render_children = render_children;
  container.render_child = render_child;
})(this);
