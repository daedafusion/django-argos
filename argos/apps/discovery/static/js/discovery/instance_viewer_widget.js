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

    $.widget( "argos.instanceViewer" , {

        //Options to be used as defaults
        options: {
            datesFrom: true
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            this.$el = $(this.element);

            this.$el.addClass('instance-viewer-dialog');

            this.$dialog = this.$el;

            this.$container = $('<div class="instance-viewer-container"/>').appendTo(this.$dialog);
            this.$header = $('<div class="instance-viewer-header"/>').appendTo(this.$container);
            this.$tabs = $('<div class="instance-viewer-tabs"/>').appendTo(this.$container);
            this.$content = $('<div class="instance-viewer-content"/>').appendTo(this.$container);

            this.$dialog.dialog({
                title: 'Properties',
                autoOpen: false,
                closeOnEscape: true,
                width: "80%",
                height: 600,
                buttons: [
                    {
                        text: "Close",
                        click: function(){
                            self.close();
                        }
                    }
                ],
                resize: function(event, ui){
                    event.preventDefault();
                    self.$propTable.fnAdjustColumnSizing();
                    self.$refTable.fnAdjustColumnSizing();
                    event.stopPropagation();
                }
            });

//            this.$e.on('dialogclose', function(event, ui){
//                self.destroy();
//            });

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
        },

        open: function(node) {
            var self = this;

            this.node = node;

            this.classDef = Ontology.getClass(node.type);

            this.$dialog.dialog('option', 'title', node.label);

            var promise = $.ajax({
                url: Urls['discovery:editor_get'](),
                type: 'POST',
                data: {
                    rdfType: node.type,
                    instanceUri: node.anchor,
                    isReified: false
                }
            });

            promise.done(function(data){

                console.log(data);

                self.editorDef = data;

                // For quick access to vocabularies only!
                self.editorDef.definition.dpMap = {};
                self.editorDef.definition.opMap = {};
                self.editorDef.definition.dataProperties.forEach(function(dp){
                    self.editorDef.definition.dpMap[dp.uri] = dp;
                });
                self.editorDef.definition.objectProperties.forEach(function(op){
                    self.editorDef.definition.opMap[op.uri] = op;
                });

                if(self.editorDef.instance == null) {
                    self.$dialog.dialog('option', 'title',
                        self._getLabel(self.editorDef.definition.labels, self.editorDef.rdfType));
                } else {
                    self.$dialog.dialog('option', 'title',
                        self.editorDef.instance.label != null ? self.editorDef.instance.label.value : self.editorDef.instance.uri
                    );
                }

                self._render();

                self.$dialog.dialog('open');

                // This is a hack to get the initial table displayed correctly because the dialog is rendered before opening
                self.$propTable.fnAdjustColumnSizing();
                self.$refTable.fnAdjustColumnSizing();
            });
            promise.fail(function(){
                console.log("TODO :: Error");
            });
            promise.always(function(){
            });


        },

        close: function() {
            this.$dialog.dialog('close');
        },

        _render: function(){
            this._renderHeader();
            this._renderTabs();
        },

        _renderHeader: function () {
            var $headerContainer = $('<div class="header-container container-fluid"/>').appendTo(this.$header);
            var $row = $('<div class="row"/>').appendTo($headerContainer);
            var $iconCol = $('<div class="col-md-3"/>').appendTo($row);
            $(sprintf('<img src="%s"/>', this.node.icon)).appendTo($iconCol);
            var $infoCol = $('<div class="col-md-6"/>').appendTo($row);
            $('<h4>Instance Information</h4>').appendTo($infoCol);
            var $well = $('<div class="well well-sm"/>').appendTo($infoCol);

            var $wellRow = $('<div class="row"/>').appendTo($well);
            $('<div class="info-label col-md-2">Resource</div>').appendTo($wellRow);
            $(sprintf('<div class="col-md-10">%s</div>', this.editorDef.instance.uri)).appendTo($wellRow);

            $wellRow = $('<div class="row"/>').appendTo($well);
            $('<div class="info-label col-md-2">Type</div>').appendTo($wellRow);
            $(sprintf('<div class="col-md-10">%s</div>', this._getLabel(this.classDef.labels, this.classDef.rdfType))).appendTo($wellRow);
        },

        _renderTabs: function() {
            var self = this;

            var $tabsUl = $('<ul class="nav nav-tabs" role="tablist"/>').appendTo(this.$tabs);

            var $viewTab = $('<li class="dropdown"><a href="#" class="dropdown-toggle" data-toggle="dropdown">View<span class="caret"></span></a></li>').appendTo($tabsUl);

            var $viewSub = $('<ul class="dropdown-menu" role="menu"><ul>').appendTo($viewTab);
            var $viewTable = $('<li><a href="#table" role="tab" data-toggle="tab">Table</a></li>').appendTo($viewSub);
            var $viewGlass = $('<li><a href="#glass" role="tab" data-toggle="tab">Glass</a></li>').appendTo($viewSub);

            $viewTable.find("a").click(function(e){
                e.preventDefault();
                $(this).tab('show');
            });
            $viewTable.on('shown.bs.tab', function(e){
                if(self.$propTable != null) {
                    self.$propTable.fnAdjustColumnSizing();
                    self.$refTable.fnAdjustColumnSizing();
                }
            });

            $viewGlass.find("a").click(function(e){
                e.preventDefault();
                $(this).tab('show');
            });

            var $historyTab = $('<li><a href="#history" role="tab">History</a></li>').appendTo($tabsUl);
            $historyTab.find("a").click(function(e){
                e.preventDefault();
                $(this).tab('show');
            });

            var $trackTab = $('<li><a href="#track" role="tab">Track</a></li>').appendTo($tabsUl);
            $trackTab.find("a").click(function(e){
                e.preventDefault();
                $(this).tab('show');
            });

            var $linksTab = $('<li><a href="#links" role="tab">Links</a></li>').appendTo($tabsUl);
            $linksTab.find("a").click(function(e){
                e.preventDefault();
                $(this).tab('show');
            });

            var $notesTab = $('<li><a href="#notes" role="tab">Notes</a></li>').appendTo($tabsUl);
            $notesTab.find("a").click(function(e){
                e.preventDefault();
                $(this).tab('show');
            });

            // TODO can't use ids...
            var $tabContent = $('<div class="tab-content"/>').appendTo(this.$content);

            var $tableContent = $('<div class="tab-pane-content"/>')
                .appendTo($('<div id="table" class="tab-pane"/>').appendTo($tabContent));
            var $glassContent = $('<div class="tab-pane-content"/>')
                .appendTo($('<div id="glass" class="tab-pane"/>').appendTo($tabContent));
            var $historyContent = $('<div class="tab-pane-content"/>')
                .appendTo($('<div id="history" class="tab-pane"/>').appendTo($tabContent));
            var $trackContent = $('<div class="tab-pane-content"/>')
                .appendTo($('<div id="track" class="tab-pane"/>').appendTo($tabContent));
            var $linksContent = $('<div class="tab-pane-content"/>')
                .appendTo($('<div id="links" class="tab-pane"/>').appendTo($tabContent));
            var $notesContent = $('<div class="tab-pane-content"/>')
                .appendTo($('<div id="notes" class="tab-pane"/>').appendTo($tabContent));

            // TODO remove
            $historyContent.html("<p>this is a test</p>");

            $viewTable.find("a").tab('show');

            this._renderPropertiesPane($('<div class="pane"/>').appendTo($tableContent));
            this._renderReferencesPane($('<div class="pane"/>').appendTo($tableContent));
        },

        _renderPropertiesPane: function($pane){
            var self = this;

            this.$propTable = $('<table/>').appendTo($pane);

            var dataSet = [];

            self.editorDef.instance.dataProperties.forEach(function(dp){
                var epoch = self.node.properties[dp.uri][dp.value.value][dp.partition].epoch;

                if(self.classDef.dpMap[dp.uri] == null){
                    console.log("Invalid data property "+dp.uri);
                    return;
                }

                var m = moment(new Date(epoch));
                dataSet.push([
                    self._getLabel(self.classDef.dpMap[dp.uri].labels, dp.uri), dp.uri, dp.value.value, self.options.datesFrom ? m.fromNow() : m.format()
                ]);
            });

            // TODO add custom toolbar to show hide uris, partitions etc
            // http://www.datatables.net/examples/advanced_init/dom_toolbar.html

            this.$propTable.dataTable({
                data: dataSet,
                columns: [
                    { title: "Property" },
                    { title: "URI" },
                    { title: "Value" },
                    //{ title: "Partition" },
                    { title: "Timestamp" }
                ],
                columnDefs: [
                    {
                        targets: [1],
                        visible: false
                    }
                ],
                //scrollCollapse: true,
                paging: false,
                info: false,
                scrollY: "100%"
            });
        },

        _renderReferencesPane: function($pane){
            var self = this;

            this.$refTable = $('<table/>').appendTo($pane);

            var dataSet = [];

            self.editorDef.instance.objectProperties.forEach(function(op){
                var epoch = self.node.references[op.uri][op.resourceUri][op.partition].epoch;

                if(self.classDef.opMap[op.uri] == null){
                    console.log("Invalid object property "+op.uri);
                    return;
                }

                var m = moment(new Date(epoch));
                dataSet.push([
                    self._getLabel(self.classDef.opMap[op.uri].labels, op.uri), op.resourceUri, op.objectLabel != null ? op.objectLabel.value : op.resourceUri, self.options.datesFrom ? m.fromNow() : m.format()
                ]);
            });

            // TODO add custom toolbar to show hide uris, partitions etc
            // http://www.datatables.net/examples/advanced_init/dom_toolbar.html

            this.$refTable.dataTable({
                data: dataSet,
                columns: [
                    { title: "Property" },
                    { title: "URI" },
                    { title: "Value" },
                    //{ title: "Partition" },
                    { title: "Timestamp" }
                ],
                columnDefs: [
                    {
                        targets: [1],
                        visible: false
                    }
                ],
                //scrollCollapse: true,
                paging: false,
                info: false,
                scrollY: "100%"
            });
        },

        _getLabel: function(labelSet, defaultValue){
            return labelSet.length > 0 ? labelSet[0].value : defaultValue;
        },

        // Destroy an instantiated plugin and clean up
        // modifications the widget has made to the DOM
        destroy: function () {

            this.$dialog.dialog('destroy').remove();
            // For UI 1.8, destroy must be invoked from the
            // base widget
            $.Widget.prototype.destroy.call(this);
            // For UI 1.9, define _destroy instead and don't
            // worry about
            // calling the base widget
        },

//        methodB: function ( event ) {
//            //_trigger dispatches callbacks the plugin user
//            // can subscribe to
//            // signature: _trigger( "callbackName" , [eventObject],
//            // [uiObject] )
//            // eg. this._trigger( "hover", e /*where e.type ==
//            // "mouseenter"*/, { hovered: $(e.target)});
//            console.log("methodB called");
//        },
//
//        methodA: function ( event ) {
//            this._trigger("dataChanged", event, {
//                key: "someValue"
//            });
//        },

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