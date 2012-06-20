var Fitzgerald = Fitzgerald || {};

(function(F) {
  // F.View = Backbone.View.extend({
  //   el: '',
  //   initialize: function(){},
  //   render: function(){}
  // });

  // The map slider view
  F.NavigatorView = Backbone.View.extend({
    el: '.dot-slider',
    initialize: function(){
      // Render thyself when the data shows up
      this.model.bind('reset', this.render, this);
    },
    render: function() {
      var self = this;

      $(self.el).slider({
        max: self.model.length,
        slide: function(evt, ui) {
          $(F).trigger('updatelocation', [ui.value, ui.value/self.model.length]);
        },
        stop: function(evt, ui) {
          $(ui.handle).removeClass('grabbed');
        }
      });

      // Change to the grabbed icon
      $('.ui-slider-handle', self.el).mousedown(function(){
        $(this).addClass('grabbed');
      });
    }
  });

  F.AppView = Backbone.View.extend({
    el: '',
    initialize: function(){
      this.model = new F.IntersectionCollection();

      // The map slider
      this.mapSliderView = new F.NavigatorView({
        model: this.model
      });

      // Fetch the intersection records
      this.model.fetch();
    },
    render: function(){

    }
  });

  new F.AppView();
})(Fitzgerald);