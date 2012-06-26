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
          clickToGo: false,
          scrollwheel: false,
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
            "title": "Show us where this intersection can be improved!",
            "name": "desc",
            "id": "dot-survey-desc",
            "class": "dot-survey-item",
            "type": "textarea"
          }
        ]
      });

      self.$dialog = $('.svp-survey').dialog({
        title: 'Add a Comment',
        autoOpen: false,
        modal: true,
        width:400,
        height:247,
        resizable: false,
        buttons: [
          {
            id: 'dialog-save',
            text: "Save",
            click: function() {
              self.svp.submit();
              $(this).dialog("close");
            }
          }
        ]
      });

      self.initCharCounter();

      F.on('locationupdatebyslider', this.onLocationUpdate, this);
      F.on('locationupdatebyrouter', this.onLocationUpdate, this);
      F.on('locationupdatebybargraph', this.onLocationUpdate, this);
      F.on('povupdatebyview', this.setPov, this);
    },
    onLocationUpdate: function(model) {
      this.locationModel = model;
      this.render();
    },
    render: function(){
      // Update the SV position
      this.setPosition(this.locationModel.get('lat'), this.locationModel.get('lng'));
      this.setPov({ heading: 0, pitch: 0, zoom: 1 });
      this.setTitle('Fourth Avenue and ' + this.locationModel.get('name'));
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
      var self = this;
          feedback.intersection_id = self.locationModel.get('id');

      new F.FeedbackModel().save(feedback, {
        success: function (model, response) {
          var allFeedback = self.locationModel.get('feedback').slice();
          allFeedback.push(feedback);
          self.locationModel.set({'feedback': allFeedback});
        }
      });
    },
    initCharCounter: function() {
      var self = this,
          $saveBtn = $('#dialog-save');

      self.$textarea = $('#dot-survey-desc');
      self.$counter = $('<div class="dot-counter">counter</div>').insertAfter(self.$textarea);

      function charsLeft() {
        var chars = self.$textarea.val().length;
        return self.options.maxChars - chars;
      }

      function onChange() {
        var available = charsLeft();
        // Update counter
        self.$counter.html(available);

        if (available >= 0) {
          // Enable
          $saveBtn.removeAttr('disabled');
        } else {
          // Disable
          $saveBtn.attr('disabled', 'disabled');
        }
      }

      self.$textarea.keyup(onChange);
      self.$textarea.change(onChange);

      onChange();
    }
  });

  F.FeedbackListView = Backbone.View.extend({
    el: '.dot-feedback',
    colors: ['yellow', 'blue', 'magenta'],
    initialize: function(){
      var self = this;

      // Update the list if we move locations
      F.on('locationupdatebyslider', this.onLocationUpdate, this);
      F.on('locationupdatebyrouter', this.onLocationUpdate, this);
      F.on('locationupdatebybargraph', this.onLocationUpdate, this);
      // Update the list if the model changes
      this.collection.bind('change', this.render, this);

      this.$el.delegate('li', 'click', function(evt){
        evt.preventDefault();

        var feedbackIndex = parseInt($(this).attr('data-index'), 10);
        var feedback = self.locationModel.get('feedback')[feedbackIndex];

        self.focusOnFeedback(feedback);
      });
    },
    onLocationUpdate: function(model) {
      this.locationModel = model;
      this.render();
    },
    render: function(){
      var self = this;
      self.$el.empty();

      _.each(self.locationModel.get('feedback'), function(attrs, i) {
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
      this.collection.bind('reset', this.render, this);
      this.collection.bind('change', this.render, this);
    },
    render: function(){
      var self = this,
          values = $.map(self.collection.toJSON(), function(location, i) {
            return location.feedback.length;
          }),
          config = {
            type: 'bar',
            height: 20,
            barSpacing: 2,
            barColor: '#4b99da',
            negBarColor: '#4b99da',
            disableTooltips: true
          };

      config.barWidth = Math.floor((self.$el.parent().width() - ((values.length - 1) * config.barSpacing)) / values.length);
      self.$el.sparkline(values, config);
      self.$el.bind('sparklineClick', function(evt) {
        var sparkline = evt.sparklines[0],
            region = sparkline.getCurrentRegionFields()[0];
        F.trigger('locationupdatebybargraph', self.collection.at(region.offset));
      });
    }
  });

  F.YouarehereTooltipView = Backbone.View.extend({
    el: '.dot-tooltip-youarehere',
    initialize: function(){
      F.on('locationupdatebyslider', this.hide, this);
      F.on('locationupdatebyrouter', this.onLocationUpdate, this);
      F.on('locationupdatebybargraph', this.hide, this);
    },
    onLocationUpdate: function(model) {
      this.locationModel = model;
      this.render();
    },
    render: function(){
      var percent = this.collection.indexOf(this.locationModel) / this.collection.length;
      this.$el.css('left', (percent*100) + '%').show();
    },
    hide: function() {
      this.$el.hide();
    }
  });

  F.TooltipView = Backbone.View.extend({
    el: '.dot-tooltip-comments',
    initialize: function(){
      F.on('locationupdatebyslider', this.onLocationUpdate, this);
      F.on('locationupdatebyrouter', this.onLocationUpdate, this);
      F.on('locationupdatebybargraph', this.onLocationUpdate, this);
      this.collection.bind('change', this.render, this);
    },
    onLocationUpdate: function(model) {
      this.locationModel = model;
      this.render();
    },
    render: function(){
      var percent = this.collection.indexOf(this.locationModel) / this.collection.length;

      this.$el
        .css('left', (percent*100) + '%')
        .html('<strong>' + this.locationModel.get('feedback').length + '</strong> Comments')
        .show();
    }
  });

  // The map slider view
  F.NavigatorView = Backbone.View.extend({
    el: '.dot-slider',
    initialize: function(){
      // Render thyself when the data shows up
      this.collection.bind('reset', this.render, this);

      F.on('locationupdatebyrouter', this.onLocationUpdate, this);
      F.on('locationupdatebybargraph', this.onLocationUpdate, this);
    },
    onLocationUpdate: function(model) {
      this.locationModel = model;
      this.setPosition();

      if (this.router) {
        this.router.navigate(this.locationModel.get('id').toString());
      }
    },
    render: function() {
      var self = this,
          max = self.collection.length-1;

      // Setup slider
      self.$el.slider({
        max: max,
        slide: function(evt, ui) {
          F.trigger('locationupdatebyslider', self.collection.at(ui.value));
        },
        stop: function(evt, ui) {
          // Update the cursor icon
          $(ui.handle).removeClass('grabbed');
          self.router.navigate(self.collection.at(ui.value).get('id').toString());
        }
      });

      // Change to the grabbed icon
      $('.ui-slider-handle', self.el).mousedown(function(){
        $(this).addClass('grabbed');
      });

      // Update to the first location
      F.trigger('locationupdatebyrouter', self.collection.at(Math.round(max / 2)));

      // Setup routing
      self.router = new F.Router({
        collection: self.collection
      });
      Backbone.history.start();
    },
    setPosition: function(){
      this.$el.slider('value', this.collection.indexOf(this.locationModel));
    }
  });

  F.AppView = Backbone.View.extend({
    initialize: function(){
      // Setup the namespace to trigger/bind events
      _.extend(F, Backbone.Events);

      // Init the collection
      this.collection = new F.LocationCollection();

      // Init the views
      this.mapSlider = new F.NavigatorView({ collection: this.collection });
      this.tooltip = new F.TooltipView({ collection: this.collection });
      this.youarehere = new F.YouarehereTooltipView({ collection: this.collection });
      this.feedbackActivity = new F.FeedbackActivityView({ collection: this.collection });
      this.feedbackList = new F.FeedbackListView({ collection: this.collection });
      this.addFeedback = new F.AddFeedbackView({
        collection: this.collection,
        maxChars: 200
      });

      // Fetch the location records
      this.collection.fetch();
    }
  });

  new F.AppView();
})(Fitzgerald, jQuery);