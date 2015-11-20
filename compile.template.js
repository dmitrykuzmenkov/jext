function(pool) {
  var {{var_code}},
    f = {
      {{func_code}}
    },
    u = {
      {{update_code}}
    }
  ;

  return {
    dom: function() {
      {{dom_code}};
      return n0;
    },

    set: function(k, v) {
      u[k](v);
    },

    update: function(a) {
      if (a !== undefined && typeof(a) === "object") {
        var k;
        for (k in a) {
          this.set(k, a[k]);
        }
      }
    },

    remove: function() {
      n1.parentNode.removeChild(n1);
    }
  };
}
