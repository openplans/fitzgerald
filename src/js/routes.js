var Fitzgerald = Fitzgerald || {};

(function(F) {

  F.Router = Backbone.Router.extend({
    initialize: function(options) {
      this.model = options.model;
    },

    routes: {
      ':id': 'goToIntersection'
    },

    goToIntersection: function(id) {
      var model = this.model.get(id);

      if (model) {
        F.trigger('locationupdatebyrouter', model);
      }
    }
  });
})(Fitzgerald);
