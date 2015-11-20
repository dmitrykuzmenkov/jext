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

    update: function(a) {
      if (a !== undefined && typeof(a) === "object") {
        var k;
        for (k in a) {
          if (u[k] === undefined) {
            console.warn('No such var: {{' + k + '}}');
          } else u[k](a[k]);
        }
      }
    },

    remove: function() {
      n1.parentNode.removeChild(n1);
    }
  };
}
