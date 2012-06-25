var Fitzgerald = Fitzgerald || {};

(function(F, $) {
  // To help out the Wordpress PHP backend
  Backbone.emulateHTTP = true;

  var collectionOptions, feedbackOptions;
  // Define the Location model
  F.LocationModel = Backbone.Model.extend({});

  // Setup the collection to support localStorage when running on localhost
  collectionOptions = F.Util.isLocalhost() ? {
    localStorage: new Backbone.LocalStorage("fitzgerald-intersections"),
    model: F.LocationModel
  } : {
    url: '/4thave/wp-admin/admin-ajax.php?action=intersections',
    model: F.LocationModel
  };
  F.LocationCollection = Backbone.Collection.extend(collectionOptions);


  // Setup the feedback model to support localStorage when running on localhost
  feedbackOptions = F.Util.isLocalhost() ? {
    localStorage: new Backbone.LocalStorage("fitzgerald-feedback")
  } : {
    urlRoot: '/4thave/wp-admin/admin-ajax.php?action=feedback',
    // Whacky code for non-REST Wordpress support
    url: function() {
      return this.urlRoot || this.collection.url;
    }
  };
  // Define the Feeedback model
  F.FeedbackModel = Backbone.Model.extend(feedbackOptions);
})(Fitzgerald, jQuery);