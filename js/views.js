var Fitzgerald = Fitzgerald || {};

(function(F) {
  // Setup the namespace to trigger/bind events
  _.extend(F, Backbone.Events);

  // F.View = Backbone.View.extend({
  //   el: '',
  //   initialize: function(){},
  //   render: function(){}
  // });

  F.AddFeedbackView = Backbone.View.extend({
    el: 'body',
    events: {
      'click #dot-add-feedback': 'showForm'
    },
    initialize: function(){
      F.on('locationupdate', this.setPosition, this);
      this.render();
    },
    render: function(){
      var self = this;

      self.svp = StreetViewPlus({
        target: '#dot-sv',
        panoOptions: {
          addressControl: false,
          panControl: false,
          clickToGo: false,
          linksControl: false,
          zoomControlOptions: {
            style: google.maps.ZoomControlStyle.SMALL
          }
        },
        onSubmit: function(evt){
          evt.preventDefault();
          var feedback = {};

          $.each($(this).serializeArray(), function(i, item) {
            feedback[item.name] = item.value;
          });

          self.save(feedback);
        },
        survey: [
          {
            "title": "Show and tell about the problems of this intersection.",
            "name": "desc",
            "id": "dot-survey-desc",
            "class": "dot-survey-item",
            "type": "textarea"
          }
        ]
      });

      self.$dialog = $('.svp-survey').dialog({
        title: 'Tell us more',

        autoOpen: false,
        modal: true,
        width:400,
        height:247,
        resizable: false,
        buttons: {
          "Save": function() {
            self.svp.submit();
            $(this).dialog("close");
          }
        }
      });
    },
    setPosition: _.debounce(function(model) {
      this.currentModel = model;
      var latLng = new google.maps.LatLng(model.get('lat'), model.get('lng'));
      this.svp.setPosition(latLng);
    }, 500),
    showForm: function() {
      console.log('showForm');
      this.svp.reset();
      this.$dialog.dialog('open');
    },
    save: function(feedback) {
      var allFeedback = this.currentModel.get('feedback');

      allFeedback.push(feedback);
      this.currentModel.save({'feedback': allFeedback}, {wait: true});
    }
  });

  F.FeedbackListView = Backbone.View.extend({
    el: '.dot-feedback',
    colors: ['yellow', 'blue', 'magenta'],
    initialize: function(){
      F.on('locationupdate', this.render, this);
      this.model.bind('change', this.render, this);
    },
    render: function(model){
      var self = this,
          $el = $(self.el),
          feedback = model.get('feedback');

      $el.empty();

      _.each(feedback, function(attrs, i) {
        var color = self.colors[i % self.colors.length];
        $el.append('<li class="'+ color +'"><a href="#">' + attrs.desc + '</a></li>');
      });
    }
  });

  F.FeedbackActivityView = Backbone.View.extend({
    el: '.dot-feedback-activity',
    initialize: function(){
      this.model.bind('reset', this.render, this);
      this.model.bind('change', this.render, this);
    },
    render: function(){
      var values = $.map(this.model.toJSON(), function(intersection, i) {
            return intersection.feedback.length;
          }),
          config = {
            type: 'bar',
            height: 20,
            barSpacing: 2,
            barColor: '#4b99da',
            negBarColor: '#4b99da',
            disableTooltips: true
          };

      config.barWidth = Math.floor(($(this.el).parent().width() - ((values.length - 1) * config.barSpacing)) / values.length);

      $(this.el).sparkline($.map(values, function(val, i){ return -val; }), config);
    }
  });

  F.TooltipView = Backbone.View.extend({
    el: '.dot-tooltip',
    initialize: function(){
      F.on('locationupdate', this.render, this);
      this.model.bind('change', this.render, this);
    },
    render: function(model, percent){
      $(this.el)
        .css('left', (percent*100) + '%')
        .html('<strong>' + model.get('feedback').length + '</strong> Comments');
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
          F.trigger('locationupdate', self.model.at(ui.value), ui.value/self.model.length);
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
      F.trigger('locationupdate', self.model.at(0), 0);
    }
  });

  F.AppView = Backbone.View.extend({
    el: '',
    initialize: function(){
      this.model = new F.IntersectionCollection();

      // Init the views
      this.mapSlider = new F.NavigatorView({ model: this.model });
      this.tooltip = new F.TooltipView({ model: this.model });
      this.feedbackActivity = new F.FeedbackActivityView({ model: this.model });
      this.feedbackList = new F.FeedbackListView({ model: this.model });
      this.addFeedback = new F.AddFeedbackView({ model: this.model });

      // Fetch the intersection records
      this.model.fetch();
    },
    render: function(){

    }
  });

  new F.AppView();
})(Fitzgerald);