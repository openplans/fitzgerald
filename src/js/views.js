var Fitzgerald = Fitzgerald || {};

(function(F, $) {
  // F.View = Backbone.View.extend({
  //   el: '',
  //   initialize: function(){},
  //   render: function(){}
  // });

  F.AddFeedbackView = Backbone.View.extend({
    el: 'body',
    titleEl: '.dot-title',
    events: {
      'click #dot-add-feedback': 'showForm'
    },
    initialize: function(){
      var self = this;

      self.svp = StreetViewPlus({
        target: '#dot-sv',
        panoOptions: {
          position: new google.maps.LatLng(0, 0),
          visible:true,
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

      F.on('locationupdatebyview', this.render, this);
      F.on('locationupdatebyrouter', this.render, this);
      F.on('povupdatebyview', this.setPov, this);

    },
    render: function(model){
      this.currentModel = model;

      // Update the SV position
      this.setPosition(model.get('lat'), model.get('lng'));
      this.setTitle('Fourth Avenue and ' + model.get('name'));
    },
    setPosition: _.debounce(function(lat, lng) {
      var latLng = new google.maps.LatLng(lat, lng);
      this.svp.setPosition(latLng);
    }, 500),
    setPov: function(config) {
      this.svp.setPov(
        parseFloat(config.heading),
        parseFloat(config.pitch),
        parseInt(config.zoom, 10));
    },
    setTitle: function(title) {
      $(this.titleEl).html(title);
    },
    showForm: function() {
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
      var self = this;

      // Update the list if we move locations
      F.on('locationupdatebyview', this.render, this);
      F.on('locationupdatebyrouter', this.render, this);
      // Update the list if the model changes
      this.model.bind('change', this.render, this);

      this.$el.delegate('li', 'click', function(evt){
        evt.preventDefault();

        var feedbackIndex = parseInt($(this).attr('data-index'), 10);
        var feedback = self.currentModel.get('feedback')[feedbackIndex];

        self.focusOnFeedback(feedback);
      });
    },
    render: function(model){
      var self = this;
      self.currentModel = model;
      self.$el.empty();

      _.each(model.get('feedback'), function(attrs, i) {
        var color = self.colors[i % self.colors.length];
        self.$el.append('<li data-index="'+i+'" class="'+ color +'"><a href="#">' + attrs.desc + '</a></li>');
      });
    },
    focusOnFeedback: function(feedback) {
      F.trigger('povupdatebyview', feedback);
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

      config.barWidth = Math.floor((this.$el.parent().width() - ((values.length - 1) * config.barSpacing)) / values.length);

      this.$el.sparkline($.map(values, function(val, i){ return -val; }), config);
    }
  });

  F.TooltipView = Backbone.View.extend({
    el: '.dot-tooltip',
    initialize: function(){
      F.on('locationupdatebyview', this.render, this);
      F.on('locationupdatebyrouter', this.render, this);
      this.model.bind('change', this.render, this);
    },
    render: function(model){
      var percent = this.model.indexOf(model) / this.model.length;

      this.$el
        .css('left', (percent*100) + '%')
        .html('<strong>' + model.get('feedback').length + '</strong> Comments')
        .show();
    }
  });

  // The map slider view
  F.NavigatorView = Backbone.View.extend({
    el: '.dot-slider',
    initialize: function(){
      // Render thyself when the data shows up
      this.model.bind('reset', this.render, this);

      F.on('locationupdatebyrouter', this.setPosition, this);
    },
    render: function() {
      var self = this;

      // Setup slider
      self.$el.slider({
        max: self.model.length,
        slide: function(evt, ui) {
          F.trigger('locationupdatebyview', self.model.at(ui.value));
        },
        stop: function(evt, ui) {
          // Update the cursor icon
          $(ui.handle).removeClass('grabbed');
          self.router.navigate(self.model.at(ui.value).get('id').toString());
        }
      });

      // Change to the grabbed icon
      $('.ui-slider-handle', self.el).mousedown(function(){
        $(this).addClass('grabbed');
      });

      // Update location to the first intersection
      F.trigger('locationupdatebyview', self.model.at(0));

      // Setup routing
      self.router = new F.Router({
        model: self.model
      });
      Backbone.history.start();
    },
    setPosition: function(model){
      this.$el.slider('value', this.model.indexOf(model));
    }
  });

  F.AppView = Backbone.View.extend({
    initialize: function(){
      // Setup the namespace to trigger/bind events
      _.extend(F, Backbone.Events);

      // Init the collection
      this.model = new F.IntersectionCollection();

      // Init the views
      this.mapSlider = new F.NavigatorView({ model: this.model });
      this.tooltip = new F.TooltipView({ model: this.model });
      this.feedbackActivity = new F.FeedbackActivityView({ model: this.model });
      this.feedbackList = new F.FeedbackListView({ model: this.model });
      this.addFeedback = new F.AddFeedbackView({ model: this.model });

      // Fetch the intersection records
      this.model.fetch();
    }
  });

  new F.AppView();
})(Fitzgerald, jQuery);