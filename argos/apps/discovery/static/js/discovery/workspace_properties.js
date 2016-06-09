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

    $.widget( "argos.workspaceProperties" , {

        //Options to be used as defaults
        options: {
            someValue: null
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            this.$el = $(this.element);

            this.$el.addClass('workspace-properties');

            this.$dialog = this.$el;

            this.$dialog.dialog({
                autoOpen: false,
                closeOnEscape: false,
                width: 400,
                height: 500,
                title: "Properties",
                buttons: [
                    {
                        text: "Save",
                        click: function(){

                            var ws = self.ws;
                            var $form = self.$form;

                            ws.ws.name = $form.find('#workspace_name').val();
                            ws.ws.description = $form.find("#workspace_description").val();
                            ws.ws.tags = $form.find("#workspace_tags").tagsinput('items');
                            ws.ws.updated = new Date();
                            ws.ws.partitions = $form.find("#workspace_partitions").selectpicker('val');

                            console.log(ws.ws);

                            ws.update();

                            self.close();

                            //var promise = $.ajax({
                            //    url: Urls['discovery:editor_save'](),
                            //    type: 'POST',
                            //    data: data
                            //});
                            //
                            //promise.done(function(data){
                            //    $.jGrowl("Instance saved");
                            //    console.log(data);
                            //    self._trigger(":save", event, {
                            //        uri: data.uri,
                            //        label: data.label.value
                            //    });
                            //    self.close();
                            //});
                            //promise.fail(function(){
                            //    console.error("Error saving instance");
                            //});
                            //promise.always(function(){
                            //
                            //});
                        }
                    },{
                        text: "Close",
                        click: function(){
                            self.close();
                        }
                    }
                ]
            });

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

        open: function(workspace, partitions){
            var self = this;

            this.ws = workspace;

            var $form = this.$form = $('<form/>').appendTo(this.$el);

            var $g = $('<div class="form-group"><label for="workspace_name">Name</label></div>').appendTo($form);

            var $i = $('<input type="text" class="form-control" id="workspace_name">').appendTo($g);
            $i.val(workspace.ws.name != null ? workspace.ws.name : "Untitled Workspace");

            $g = $('<div class="form-group"><label for="workspace_description">Description</label></div>').appendTo($form);

            $i = $('<input type="text" class="form-control" id="workspace_description">').appendTo($g);
            $i.val(workspace.ws.description != null ? workspace.ws.description : "");

            $g = $('<div class="form-group"><label for="workspace_tags">Tags</label></div>').appendTo($form);

            $i = $('<input type="text" data-role="tagsinput" class="form-control" id="workspace_tags">').appendTo($g);
            $i.val(workspace.ws.tags.join(','));
            $i.tagsinput();
            $i.next().addClass('form-control');

            $g = $('<div class="form-group"><label for="workspace_partitions">Partitions</label></div>').appendTo($form);

            $i = $('<select multiple class="form-control" id="workspace_partitions">').appendTo($g);
            partitions.forEach(function(p){
                var $o = $(sprintf('<option value="%s">%s</option>', p.uuid, p.name)).appendTo($i);
                if(workspace.ws.partitions.indexOf(p.uuid) != -1){
                    $o.attr('selected', 'selected');
                }
            });

            $i.selectpicker();

            self.$dialog.dialog('open');
            this._trigger(":open", event, {});
        },

        close: function(){

            this.$dialog.dialog('close');

            this._trigger(":close", event, {});
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