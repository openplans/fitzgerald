var Fitzgerald = Fitzgerald || {};

(function(F, $) {
  // To help out the Wordpress PHP backend
  Backbone.emulateHTTP = true;

  var collectionOptions;
  // Define the Location model
  F.LocationModel = Backbone.Model.extend({
    // Whacky code for non-REST Wordpress support
    url: function() {
      return this.urlRoot || this.collection.url;
    }
  });

  // Setup the collection to support localStorage when running on localhost
  collectionOptions = F.Util.isLocalhost() ? {
    localStorage: new Backbone.LocalStorage("fitzgerald-intersections"),
    model: F.LocationModel
  } : {
    url: '/4thave/wp-admin/admin-ajax.php?action=intersections',
    model: F.LocationModel
  };
  F.LocationCollection = Backbone.Collection.extend(collectionOptions);
})(Fitzgerald, jQuery);