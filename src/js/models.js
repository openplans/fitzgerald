var Fitzgerald = Fitzgerald || {};

(function(F, $) {
  // To help out the Wordpress PHP backend
  Backbone.emulateHTTP = true;

  var collectionOptions;
  // Define the Intersection model
  F.IntersectionModel = Backbone.Model.extend({
    // Whacky code for non-REST Wordpress support
    url: function() {
      return this.urlRoot || this.collection.url;
    }
  });

  // Setup the collection to support localStorage when running on localhost
  collectionOptions = F.Util.isLocalhost() ? {
    localStorage: new Backbone.LocalStorage("fitzgerald-intersections"),
    model: F.IntersectionModel
  } : {
    url: '/4thave/wp-admin/admin-ajax.php?action=intersections',
    model: F.IntersectionModel
  };
  F.IntersectionCollection = Backbone.Collection.extend(collectionOptions);
})(Fitzgerald, jQuery);