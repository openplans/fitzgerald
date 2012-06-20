var Fitzgerald = Fitzgerald || {};

(function(F) {
  // Setup the namespace to trigger/bind events
  _.extend(F, Backbone.Events);

  // F.View = Backbone.View.extend({
  //   el: '',
  //   initialize: function(){},
  //   render: function(){}
  // });


  F.TooltipView = Backbone.View.extend({
    el: '.dot-tooltip',
    initialize: function(){
      F.on('locationupdate', this.render, this);
    },
    render: function(index, percent){
      var self = this;

      $(self.el)
        .css('left', (percent*100) + '%')
        .html('<strong>' + self.model.at(index).get('feedback').length + '</strong> Comments');
    }
  });

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
          F.trigger('locationupdate', ui.value, ui.value/self.model.length);
        },
        stop: function(evt, ui) {
          // Update the cursor icon
          $(ui.handle).removeClass('grabbed');
        }
      });

      // Change to the grabbed icon
      $('.ui-slider-handle', self.el).mousedown(function(){
        $(this).addClass('grabbed');
      });

      // Update location to the first intersection
      F.trigger('locationupdate', 0, 0);
    }
  });

  F.AppView = Backbone.View.extend({
    el: '',
    initialize: function(){
      this.model = new F.IntersectionCollection();

      // The map slider
      this.mapSliderView = new F.NavigatorView({ model: this.model });
      this.tooltipView = new F.TooltipView({ model: this.model });

      // Fetch the intersection records
      this.model.fetch();
    },
    render: function(){

    }
  });

  new F.AppView();
})(Fitzgerald);