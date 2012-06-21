var Fitzgerald = Fitzgerald || {};

(function(F, $) {
  var collectionOptions;
  // Define the Intersection model
  F.IntersectionModel = Backbone.Model.extend({});

  // Setup the collection to support localStorage when running on localhost
  collectionOptions = F.Util.isLocalhost() ? {
    url: '/intersections/',
    model: F.IntersectionModel
  } : {
    localStorage: new Backbone.LocalStorage("fitzgerald-intersections"),
    model: F.IntersectionModel
  };
  F.IntersectionCollection = Backbone.Collection.extend(collectionOptions);
})(Fitzgerald, jQuery);