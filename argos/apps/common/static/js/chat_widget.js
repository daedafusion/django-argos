/*!
 * jQuery UI Widget-factory plugin boilerplate (for 1.8/9+)
 * Author: @addyosmani
 * Further changes: @peolanha
 * Licensed under the MIT license
 */

var sdErrorHandler = function(context, data){
    console.error(data);
};

;(function ( $, window, document, undefined ) {

    // define your widget under a namespace of your choice
    //  with additional parameters e.g.
    // $.widget( "namespace.widgetname", (optional) - an
    // existing widget prototype to inherit from, an object
    // literal to become the widget's prototype );

    $.widget( "argos.chatWidget" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {

            var self = this;

            var $el = this.$el = $(this.element);

            var $chat = this.$chat = $('<div class="chat"/>').appendTo($el);

            this.roomUuid = null;
            this.room = null;
            this.messages = [];

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
        },

        resize: function(){
            var self = this;
            var $list = self.$chat.find('.msg-list');
            if($list[0] != undefined) {
                $list.scrollTop($list[0].scrollHeight);
            }
        },

        startChat: function(type, target, title){
            var self = this;

            if(this.type == type && this.target == target){
                return;
            }

            this.type = type;
            this.target = target;

            this.title = (title == undefined) ? sprintf("Discussion (%s)", target) : title;

            this.clear();

            // check if room exists
            swampdragon.ready(function(){
                swampdragon.callRouter('does_room_exist', 'chat-router', {type: type, target: target}, function(context, data){
                    console.log(data);
                    if(data['exists']){
                        // render chat
                        self.roomUuid = data['uuid'];

                        self._renderRoom();
                    } else {
                        // render "Start Discussion" button
                        var $start = $('<button class="btn btn-default">Start Discussion</button>').appendTo(self.$chat);
                        $start.click(function(){

                            // Create room
                            swampdragon.callRouter('create_room', 'chat-router', {type: type, target: target}, function(context, data){

                                self.roomUuid = data['uuid'];
                                self.clear();
                                self._renderRoom();
                            }, sdErrorHandler);

                        });
                    }
                }, sdErrorHandler);
            });

        },

        _renderRoom: function(){
            var self = this;

            var $header = $('<div class="room-header"/>').appendTo(this.$chat);

            $(sprintf('<h4>%s</h4>', this.title)).appendTo($header);

            var $messages = $('<div class="msg-list"/>').appendTo(this.$chat);
            var $send = $('<div class="msg-send"/>').appendTo(this.$chat);

            var $sendInput = $('<textarea type="text" placeholder="Send a message..."/>').appendTo($send);

            $sendInput.keypress(function(e){
                // TODO skip send if shift key is pressed
                if(e.keyCode == 13){
                    //submit
                    var val = $sendInput.val();

                    swampdragon.ready(function(){
                        swampdragon.callRouter('send_message', 'chat-router', {uuid: self.roomUuid, message: val}, function(context, data){
                            $sendInput.val("");
                        }, sdErrorHandler)
                    });
                }
            });

            swampdragon.ready(function(){
                swampdragon.callRouter('get_conversation', 'chat-router', {uuid: self.roomUuid}, function(context, data){
                    self.room = data.room;
                    self.messages.push.apply(self.messages, data.messages);
                    self.messages.forEach(function(e){
                        self._renderMessage(e);
                    });
                }, sdErrorHandler);
            });

            swampdragon.open(function(){
                swampdragon.subscribe('chat-router', sprintf('chat:%s', self.roomUuid), {uuid: self.roomUuid}, function(context, data){
                    console.log("subscribe success");
                }, sdErrorHandler);
            });

            swampdragon.onChannelMessage(function(channels, message){

                console.log("onMessage :: "+channels);

                if(channels.indexOf(sprintf('chat:%s', self.roomUuid )) != -1){
                    self.messages.push(message.data);
                    self._renderMessage(message.data);
                }
            });
        },

        _renderMessage: function(message){
            var self = this;
            var $m = $(sprintf('<div timestamp="%s" class="msg"/>', message.timestamp )).appendTo(self.$chat.find('.msg-list'));
            var $avatar = $('<div class="msg-avatar"/>').appendTo($m);
            var $body = $('<div class="msg-body"/>').appendTo($m);
            var $ts = $('<div class="msg-timestamp"/>').appendTo($m);

            $avatar.html(sprintf('<img src="http://api.adorable.io/avatars/32/%s.png"/>', message.username));

            var $user = $('<div class="msg-user"/>').appendTo($body);
            $user.html(message.username);
            $(sprintf('<div class="msg-msg">%s</div>', message.message)).appendTo($body);

            var format = 'lll';

            $ts.html(moment(message.timestamp).format(format));

            $m.parent().scrollTop($m.parent()[0].scrollHeight);
        },

        clear: function(){

            if(this.roomUuid != null){
                var toUnsub = this.roomUuid;
                swampdragon.ready(function(){
                    swampdragon.unsubscribe('chat-router', sprintf('chat:%s', toUnsub), {uuid: toUnsub});
                });
            }

            this.roomUuid = null;
            this.room = null;
            this.messages = [];

            this.$chat.html("");
        },

        // Destroy an instantiated plugin and clean up
        // modifications the widget has made to the DOM
        destroy: function () {

            this.clear();

            // this.element.removeStuff();
            // For UI 1.8, destroy must be invoked from the
            // base widget
            $.Widget.prototype.destroy.call(this);
            // For UI 1.9, define _destroy instead and don't
            // worry about
            // calling the base widget
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