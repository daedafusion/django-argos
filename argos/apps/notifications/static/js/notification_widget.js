/*!
 * jQuery UI Widget-factory plugin boilerplate (for 1.8/9+)
 * Author: @addyosmani
 * Further changes: @peolanha
 * Licensed under the MIT license
 */

;(function ( $, window, document, undefined ) {

    // define your widget under a namespace of your choice
    //  with additional parameters e.g.
    // $.widget( "namespace.widgetname", (optional) - an
    // existing widget prototype to inherit from, an object
    // literal to become the widget's prototype );

    $.widget( "argos.notif" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            var $el = this.$el = $(this.element);

            $('<span class="glyphicon glyphicon-bell"></span>').appendTo($el);

            this.$tray = null;

            this.notifications = [];

            this._first();

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
        },

        // Destroy an instantiated plugin and clean up
        // modifications the widget has made to the DOM
        destroy: function () {

            // this.element.removeStuff();
            // For UI 1.8, destroy must be invoked from the
            // base widget
            $.Widget.prototype.destroy.call(this);
            // For UI 1.9, define _destroy instead and don't
            // worry about
            // calling the base widget
        },

        _first: function(){
            var self = this;

            swampdragon.open(function(){

                swampdragon.callRouter('get_unread', 'notification-unread-route', null, function(context, data){
                    self.updateUnread(data.unread);
                });

                swampdragon.subscribe('notification-unread-route', 'notif-unread', null, function(context, data){
                    console.log("subscribe unread success");
                }, function(context, data){
                    console.log("subscribe unread failed");
                });

                swampdragon.subscribe('notification-route', 'notif', null, function(context, data){
                    console.log("subscribe success");
                }, function(context, data){
                    console.log("subscribe failed");
                });



            });

            swampdragon.ready(function(){
                swampdragon.callRouter('get_notifications', 'notification-route', {limit: 10, offset: self.notifications.length}, function(context, data){
                    console.log(data);
                    self.notifications = data;
                });
            });

            swampdragon.onChannelMessage(function(channels, message){

                console.log("onMessage :: "+channels);

                if(channels.indexOf('notif-unread') != -1){
                    self.updateUnread(message.data.unread);
                }

                if(channels.indexOf('notif') != -1){
                    self.handleNotif(message.data);
                }

            });

            this.$el.click(function(event){
                event.stopPropagation();

                if(self.$tray != null){
                    self.hideTray();
                    return;
                }

                self.showTray();
            });

            $(document).click(function(event){
                if( self.$tray != null && $(event.target).closest('.notification-tray').get(0) == null ){
                    self.hideTray();
                }
            })

        },

        updateUnread: function(num){

            this.$el.find(".badge").remove();

            if(num > 0) {
                $('<span class="badge">'+num+'</span>').appendTo(this.$el);
            }

        },

        handleNotif: function(notif){

            this.notifications.push(notif);
            $.jGrowl(notif.message);

        },

        showTray: function(){
            var self = this;

            this.$tray = $('<div class="notification-tray"/>').appendTo($("body"));
            this.$tray.position({
                my: "right top",
                at: "right bottom",
                of: self.$el,
                collision: "fit"
            });

            this.notifications.forEach(function(n){
                self._render(n);
            });
        },

        _render: function(n){

            var $n = $('<div class="notification"></div>').prependTo(this.$tray);
            $('<p class="message"/>').text(n.message).appendTo($n);
            var t = moment(new Date(n.timestamp));

            var $t = $('<div class="timestamp"/>').text(t.fromNow()).appendTo($n);

            if(n.read){
                $n.addClass('read');
            }

            $n.click(function(){

                $n.addClass('read');

                swampdragon.ready(function(){
                    swampdragon.callRouter('read_notification', 'notification-route', {uuid: n.uuid}, function(context, data){

                    });
                });

            });

        },

        hideTray: function(){
            if(this.$tray != null){
                this.$tray.remove();
                this.$tray = null;
            }
        },

        //methodB: function ( event ) {
        //    //_trigger dispatches callbacks the plugin user
        //    // can subscribe to
        //    // signature: _trigger( "callbackName" , [eventObject],
        //    // [uiObject] )
        //    // eg. this._trigger( "hover", e /*where e.type ==
        //    // "mouseenter"*/, { hovered: $(e.target)});
        //    console.log("methodB called");
        //},
        //
        //methodA: function ( event ) {
        //    this._trigger("dataChanged", event, {
        //        key: "someValue"
        //    });
        //},

        // Respond to any changes the user makes to the
        // option method
        _setOption: function ( key, value ) {
            switch (key) {
            case "someValue":
                //this.options.someValue = doSomethingWith( value );
                break;
            default:
                //this.options[ key ] = value;
                break;
            }

            // For UI 1.8, _setOption must be manually invoked
            // from the base widget
            $.Widget.prototype._setOption.apply( this, arguments );
            // For UI 1.9 the _super method can be used instead
            // this._super( "_setOption", key, value );
        }
    });

})( jQuery, window, document );