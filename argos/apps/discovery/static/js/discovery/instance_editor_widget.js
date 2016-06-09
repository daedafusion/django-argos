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

    $.widget( "argos.instanceEditor" , {

        //Options to be used as defaults
        options: {
            showUris: false,
            showComments: false
        },

        //Setup widget (eg. element creation, apply theming
        // , bind events etc.)
        _create: function () {
            var self = this;

            // _create will automatically run the first time
            // this widget is called. Put the initial widget
            // setup code here, then you can access the element
            // on which the widget was called via this.element.
            // The options defined above can be accessed
            // via this.options this.element.addStuff();
            this.$el = $(this.element);

            this.$el.addClass('instance-editor');

            this.$dialog = this.$el;

            this.$dialog.dialog({
                autoOpen: false,
                closeOnEscape: false,
                width: "75%",
                height: 650,
                buttons: [
                    //{
                    //    showText: false,
                    //    text: "Settings",
                    //    icons: {
                    //        primary: "ui-icon-gear"
                    //    },
                    //    click: function(){
                    //        self.toggleUris();
                    //    }
                    //},
                    {
                        text: "Save",
                        click: function(){

                            if(self.$el.find('.partition-notset').length){
                                $.jGrowl("Properties/Relationships present with no partition");
                                return;
                            }

                            // Commit pending edits
                            self.$el.find('.property').each(function(){
                                self._makePropertyNormal($(this));
                            });

                            // Assemble instance
                            if(self.editorDef.instance != null){
                                self.editorDef.instance.dataProperties = [];
                                self.editorDef.instance.objectProperties = [];
                            } else {
                                self.editorDef.instance = {
                                    rdfType: self.editorDef.rdfType,
                                    reification: self.reification,
                                    dataProperties: [],
                                    objectProperties: []
                                };
                            }

                            self.$el.find('.property').each(function(){
                                var $prop = $(this);
                                var data = $prop.data('propertyData');

                                if($prop.hasClass('data-property')){
                                    self.editorDef.instance.dataProperties.push(data);
                                } else {
                                    self.editorDef.instance.objectProperties.push(data);
                                }
                            });

                            var data = {
                                instance: JSON.stringify(self.editorDef.instance),
                                target: self.currentPartition
                            };

                            if(self.reification){
                                data.reification = JSON.stringify(self.reification)
                            }

                            var promise = $.ajax({
                                url: Urls['discovery:editor_save'](),
                                type: 'POST',
                                data: data
                            });

                            promise.done(function(data){
                                $.jGrowl("Instance saved");
                                console.log(data);
                                self._trigger(":save", event, {
                                    uri: data.uri,
                                    label: data.label.value
                                });
                                self.close();
                            });
                            promise.fail(function(){
                                console.error("Error saving instance");
                            });
                            promise.always(function(){

                            });
                        }
                    },{
                        text: "Close",
                        click: function(){
                            self.close();
                        }
                    }
                ]
            });
        },

        // Destroy an instantiated plugin and clean up
        // modifications the widget has made to the DOM
        destroy: function () {

            this.$dialog.dialog('destroy').remove();
            // this.element.removeStuff();
            // For UI 1.8, destroy must be invoked from the
            // base widget
            $.Widget.prototype.destroy.call(this);
            // For UI 1.9, define _destroy instead and don't
            // worry about
            // calling the base widget
        },

        close: function(){

            this.$dialog.dialog('close');

            this._trigger(":close", event, {});
        },

        /**
         * reification should be an object if reified {subject: '', predicate: '', object: ''}
         */
        open: function(rdfType, instanceUri, reification){

            reification = typeof reification !== 'undefined' ? reification : null;

            var self = this;

            self.rdfType = rdfType;
            self.instanceUri = instanceUri;
            self.reification = reification;

            var promise = $.ajax({
                url: Urls['discovery:editor_get'](),
                type: 'POST',
                data: {
                    rdfType: rdfType,
                    instanceUri: instanceUri,
                    isReified: self.reification != null
                }
            });

            promise.done(function(data){

                console.log(data);

                self.editorDef = data;

                if(self.reification != null && self.editorDef.instance.reification != null){
                    self.editorDef.instance.reification = self.reification;
                }

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

                self._renderHeader();
                self._renderProperties();

                self.$dialog.dialog('open');

                self._renderSettings();
                self._renderPartitionSelect();
            });
            promise.fail(function(){
                console.log("TODO :: Error");
            });
            promise.always(function(){
            });

            this._trigger(":open", event, {});
        },

        _renderSettings: function(){
            var self = this;

            var $settings = $('<div class="btn-group dropup settings-btn"/>').appendTo(self.$dialog.parent().find('.ui-dialog-buttonpane'));

            $('<button data-toggle="dropdown" class="btn dropdown-toggle"><i class="fa fa-gears"/></button>').appendTo($settings);
            var $settingsMenu = $('<ul class="dropdown-menu dropdown-menu-right"></ul>').appendTo($settings);

            var $toggleUris = $(sprintf('<li><a href="#">Show URIs</a></li>')).appendTo($settingsMenu);

            $toggleUris.click(function(){
                self.toggleUris();
                if(self.options.showUris){
                    $('<span class="glyphicon glyphicon-ok"/>').prependTo($(this));
                } else {
                    $(this).find('span').remove();
                }
            });

            var $toggleComments = $(sprintf('<li><a href="#">Show Descriptions</a></li>')).appendTo($settingsMenu);

            $toggleComments.click(function(){
                self.toggleComments();
                if(self.options.showComments){
                    $('<span class="glyphicon glyphicon-ok"/>').prependTo($(this));
                } else {
                    $(this).find('span').remove();
                }
            });
        },

        _renderPartitionSelect: function(){
            var self = this;

            var promise = $.ajax({
                url: sprintf('%s?op=write', Urls['administration:partitions_list']()),
                type: 'GET'
            });

            promise.done(function(data){

                self.partitions = data;

                var $partitionSelect = self.$partitionSelect = $('<select class="instance-editor-partition-select"/>').appendTo(self.$dialog.parent().find('.ui-dialog-buttonpane'));

                $(sprintf('<option value="">Partition...</option>')).appendTo($partitionSelect);
                self.partitions.forEach(function(p){
                    $(sprintf('<option value="%s">%s</option>', p.uuid, p.name)).appendTo($partitionSelect);
                });

                $partitionSelect.selectpicker();

                $partitionSelect.change(function(){
                    self.selectPartition($(this).val());
                });
            });
            promise.fail(function(){
                console.log("TODO :: Error");
            });
            promise.always(function(){
            });
        },

        selectPartition: function(partition){
            var self = this;

            self.currentPartition = partition == "" ? null : partition;

            // Commit pending edits
            self.$el.find('.partition-selected, .partition-notset').each(function(){
                self._makePropertyNormal($(this));
            });

            self.$el.find('.property').each(function(){
                var $p = $(this);
                var p = $p.data('propertyData');

                // If this is a new property with unset partition, set it before going on
                if(p.partition == null && self.currentPartition != null){
                    $p.removeClass('partition-notset');
                    p.partition = self.currentPartition;
                }

                if(self.currentPartition == null){
                    if($p.hasClass('partition-selected')){
                        self._makePropertyNormal($p);
                    }
                    $p.removeClass('partition-selected');
                    $p.removeClass('partition-deselected');
                } else if (p.partition == self.currentPartition) {
                    $p.addClass('partition-selected');
                    $p.removeClass('partition-deselected');
                    self._makePropertyEditable($p);
                } else {
                    if($p.hasClass('partition-selected')){
                        self._makePropertyNormal($p);
                    }
                    $p.addClass('partition-deselected');
                    $p.removeClass('partition-selected');
                }
            });
        },

        _makePropertyEditable: function($prop){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);

            if($prop.hasClass('data-property')) {

                var dp = $prop.data('propertyData');

                if(self.editorDef.definition.dpMap[dp.uri].vocabularies.length > 0){

                    var $propertyDiv = $prop.find('div.property-value');
                    var value = dp.value.value;
                    var vocab = dp.value.type;

                    // render vocab select
                    var $vocabsSelect = $('<select class="vocabs"/>').appendTo($propertyDiv);

                    self.editorDef.definition.dpMap[dp.uri].vocabularies.forEach(function(v){
                        var $v = $(sprintf('<option value="%s">%s</option>', v.uri, v.name)).appendTo($vocabsSelect);

                        if(v.uri == vocab){
                            $v.attr('selected', 'selected');
                        }

                    });

                    $propertyDiv.html("");

                    $vocabsSelect.appendTo($propertyDiv);
                    //$vocabsSelect.selectpicker();

                    $vocabsSelect.change(function(){

                        var selectedVocab = $(this).val();

                        $propertyDiv.find('.vocab-entries').remove();

                        self.editorDef.definition.dpMap[dp.uri].vocabularies.forEach(function(v){
                            if(v.uri == selectedVocab){

                                var $vocabEntries = $('<select class="vocab-entries"/>').appendTo($propertyDiv);

                                v.entries.forEach(function(e){
                                    var $e = $(sprintf('<option value="%s">%s</option>', e.value, e.value)).appendTo($vocabEntries);
                                    if(e.value == value){
                                        $e.attr('selected', 'selected');
                                    }
                                });

                                //$vocabEntries.selectpicker();

                            }
                        });

                    });

                    $vocabsSelect.trigger('change');

                } else {
                    // Turn .property-value into input (add bindings based on type)
                    var $propertyDiv = $prop.find('div.property-value');

                    var value = $propertyDiv.text();

                    var $input = $('<input predicate=""/>');

                    $input.val(value);

                    $propertyDiv.html($input);
                }
            } else {

                var op  = $prop.data('propertyData');

                if(op.resourceUri == null) {
                    // New Button
                    var $newOP = $('<div class="btn-group new-object-btn"/>').appendTo($prop);

                    $('<button data-toggle="dropdown" class="btn dropdown-toggle">New <span class="caret"/></button>').appendTo($newOP);
                    var $newOpMenu = $('<ul class="dropdown-menu dropdown-menu-right"></ul>').appendTo($newOP);

                    cls.opMap[op.uri].range.forEach(function(r){

                        if(Ontology.getClass(r).isAbstract){

                            // Find classes who have r as parent
                            var subclasses = [];

                            Ontology.ont.classes.forEach(function(cls, i) {
                                if(cls.parents.indexOf(r) != -1){
                                    var $row = $(sprintf('<li><a href="#">%s</a></li>', self._getLabel(cls.labels, cls.rdfType))).appendTo($newOpMenu);

                                    $row.click(function(){

                                        self.$dialog.hide();

                                        var $editor = $('<div/>').appendTo($('body'));
                                        $editor.instanceEditor();
                                        $editor.instanceEditor('open', cls.rdfType, null);

                                        $editor.on('instanceeditor:close', function(){
                                            self.$dialog.show();
                                            $editor.instanceEditor('destroy').remove();
                                        });
                                        $editor.on('instanceeditor:save', function(event, data){
                                            SparqlEngine.expandNode(data.uri);

                                            self.$dialog.show();
                                            op.rdfType = cls.rdfType;
                                            op.resourceUri = data.uri;
                                            op.objectLabel = {
                                                type: null,
                                                lang: null,
                                                value: data.label
                                            };

                                            $prop.remove();

                                            self._renderOP(op).appendTo(self.$opColumn).addClass('property-changed');

                                            self.sort();
                                        });
                                    });
                                }
                            });

                        } else {
                            var $row = $(sprintf('<li><a href="#">%s</a></li>', self._getLabel(Ontology.getClass(r).labels, r))).appendTo($newOpMenu);

                            $row.click(function(){

                                self.$dialog.hide();

                                var $editor = $('<div/>').appendTo($('body'));
                                $editor.instanceEditor();
                                $editor.instanceEditor('open', r, null);

                                $editor.on('instanceeditor:close', function(){
                                    self.$dialog.show();
                                    $editor.instanceEditor('destroy').remove();
                                });
                                $editor.on('instanceeditor:save', function(event, data){
                                    SparqlEngine.expandNode(data.uri);

                                    self.$dialog.show();
                                    op.rdfType = r;
                                    op.resourceUri = data.uri;
                                    op.objectLabel = {
                                        type: null,
                                        lang: null,
                                        value: data.label
                                    };

                                    $prop.remove();

                                    self._renderOP(op).appendTo(self.$opColumn).addClass('property-changed');

                                    self.sort();
                                });
                            });
                        }


                    });


                    // Capture Button
                    var $captureOP = $('<button class="btn btn-default">Capture</button>').appendTo($prop);

                    $captureOP.click(function(){

                        self.$dialog.hide();

                        // Send message to fdg to enable capture mode
                        //$(document).trigger("spinner:remove", [{
                        //    id: id
                        //}]);

                        var callback = function(objects){
                            self.$dialog.show();

                            for(var i=0; i < objects.length; i++){
                                if(i == 0){
                                    op.resourceUri = objects[i].uri;
                                    op.objectLabel = {
                                        lang: null,
                                        type: null,
                                        value: objects[i].label
                                    };

                                    $prop.remove();
                                    self._renderOP(op).appendTo(self.$opColumn).addClass('property-changed');
                                }
                            }

                            self.sort();

                        };

                        $(document).trigger("capture:request", [cls.opMap[op.uri].range, callback]);
                    });

                }
            }

            var $delOP = $('<button class="btn btn-danger btn-xs delete-property-btn"><span class="glyphicon glyphicon-remove"/></button>').appendTo($prop);

            $delOP.click(function(){
                $prop.remove();
            });
        },

        _makePropertyNormal: function($prop){
            var self = this;

            var changed = false;

            if($prop.hasClass('data-property')) {
                var dp = $prop.data('propertyData');

                // Copy value into dp
                if(self.editorDef.definition.dpMap[dp.uri].vocabularies.length > 0) {
                    // save vocab value
                    var vocab = $prop.find('div.property-value .vocabs').val();
                    var value = $prop.find('div.property-value .vocab-entries').val();

                    // Check if value changed
                    if(dp.value.type != vocab || dp.value.value != value) {
                        changed = true;
                        dp.value.value = value;
                        dp.value.type = vocab;
                    }

                } else {
                    var value = $prop.find('div.property-value input').val();

                    if(dp.value.value != value) {
                        changed = true;
                        dp.value.value = value;
                    }
                }

                var $dp = self._renderDP(dp);

                if(changed){
                    $dp.addClass('property-changed');
                }

                $dp.insertAfter($prop);
            } else {
                var op = $prop.data('propertyData');
                var $op = self._renderOP(op);

                $op.insertAfter($prop);
            }
            $prop.remove();
        },

        _renderHeader: function(){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);

            var $header = $('<div class="editor-header"/>').appendTo(this.$dialog);

            if(self.editorDef.definition.hasOwnProperty('icon')){
                $(sprintf('<img class="icon" src="%s" width="64" height="64"/>', self.editorDef.definition.icon)).appendTo($header);
            }

            $(sprintf('<p class="comments">%s</p>', cls.comments.map(function(e){return e.value;}).join(" "))).appendTo($header);

            var p = cls.parents.filter(function(e){
                return e != "http://www.w3.org/2002/07/owl#Thing";
            }).map(function(e){
                var c = Ontology.getClass(e);
                if(c !== undefined) {
                    return Ontology.getClass(e).labels.map(function(e){return e.value;}).join(" ");
                }
            });

            if(p.length > 0) {
                $(sprintf('<h4>Parents</h4><p>%s</p>', p.join(" || "))).appendTo($header);
            }
        },

        _renderProperties: function(){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);

            var $propColumns = this.$propColumns = $('<div class="prop-columns container-fluid"/>').appendTo(this.$dialog);
            $('<div class="row"><div class="data-header column-header col-md-6"><h4>Data Properties</h4></div><div class="object-header column-header col-md-6"><h4>Relationships</h4></div>').appendTo($propColumns);

            var $addDp = $('<div class="btn-group add-property-btn"/>').appendTo($propColumns.find('.data-header'));

            $('<button data-toggle="dropdown" class="btn dropdown-toggle"><i class="fa fa-plus"/></button>').appendTo($addDp);
            var $dpMenu = $('<ul class="dropdown-menu dropdown-menu-right"></ul>').appendTo($addDp);

            cls.dataProperties.forEach(function(dp){
                var $row = $(sprintf('<li><a href="#">%s</a></li>', self._getLabel(dp.labels, dp.uri))).appendTo($dpMenu);
                $row.click(function(){
                    //if(self.currentPartition == null){
                    //    $.jGrowl("Select partition to add property");
                    //    return;
                    //}
                    self.addDataProperty(dp.uri);
                });
            });

            var $addOp = $('<div class="btn-group add-property-btn"/>').appendTo($propColumns.find('.object-header'));

            $('<button data-toggle="dropdown" class="btn dropdown-toggle"><i class="fa fa-plus"/></button>').appendTo($addOp);
            var $opMenu = $('<ul class="dropdown-menu dropdown-menu-right"></ul>').appendTo($addOp);

            cls.objectProperties.forEach(function(op){
                var $row = $(sprintf('<li><a href="#">%s</a></li>', self._getLabel(op.labels, op.uri))).appendTo($opMenu);
                $row.click(function(){
                    //if(self.currentPartition == null){
                    //    $.jGrowl("Select partition to add relationship");
                    //    return;
                    //}
                    self.addObjectProperty(op.uri);
                });
            });

            var $columnContentRow = $('<div class="row"/>').appendTo($propColumns);
            var $dpColumn = this.$dpColumn = $('<div class="col-md-6"/>').appendTo($columnContentRow);
            var $opColumn = this.$opColumn = $('<div class="col-md-6"/>').appendTo($columnContentRow);

            this._renderDPs();
            this._renderOPs();
            this.sort();
        },

        addDataProperty: function(uri){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);

            // matches elements in self.editorDef.instance.dataProperties
            var dp = {
                label: null,
                partition: self.currentPartition,
                uri: uri,
                value: {
                    lang: null,
                    type: null,
                    value: ""
                }
            };

            // TODO server side we use antlr to parse the template strings... only support simplified set here?
            if(cls.dpMap[uri].auto != null){
                if(cls.dpMap[uri].auto == "${@uuid()}"){
                    dp.value.value = generateUUID();
                }
            }

            var $dp = self._renderDP(dp).appendTo(self.$dpColumn);

            if(self.currentPartition == null) {
                $dp.addClass('partition-notset');
            } else {
                $dp.addClass('partition-selected');
            }
            self._makePropertyEditable($dp);

            self.sort();

            return $dp;
        },

        addObjectProperty: function(uri){
            var self = this;

            // matches elements in self.editorDef.instance.objectProperties
            var op = {
                label: null,
                objectLabel: {
                    lang: null,
                    type: null,
                    value: ""
                },
                partition: self.currentPartition,
                uri: uri,
                rdfType: null,
                resourceUri: null
            };

            var $op = self._renderOP(op).appendTo(self.$opColumn);

            if(self.currentPartition == null) {
                $op.addClass('partition-notset');
            } else {
                $op.addClass('partition-selected');
            }
            self._makePropertyEditable($op);

            self.sort();

            return $op;
        },

        _renderDPs: function(){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);

            if(this.editorDef.instance != null) {
                this.editorDef.instance.dataProperties.forEach(function (dp) {

                    self._renderDP(dp).appendTo(self.$dpColumn);

                });
            } else {
                // New instance, so create required fields
                this.editorDef.definition.dataProperties.forEach(function(dp){

                    if(dp.cardinality.hasOwnProperty('min')){
                        self.addDataProperty(dp.uri);
                    }

                });
            }

        },

        _renderDP: function(dp){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);
            var $dp = $('<div class="property data-property"/>');

            $dp.data('propertyData', dp);

            var label;

            if(self.options.showUris){
                label = sprintf('%s <span class="property-uri">%s</span>', self._getLabel(cls.dpMap[dp.uri].labels), dp.uri);
            } else {
                label = self._getLabel(cls.dpMap[dp.uri].labels);
            }

            $(sprintf('<p class="property-label">%s</p>', label)).appendTo($dp);

            if(self.options.showComments){
                $(sprintf('<p class="comments">%s</p>', cls.dpMap[dp.uri].comments.map(function(e){return e.value;}).join(" "))).appendTo($dp);
            }

            var $dpValue = $('<div class="property-value"/>').appendTo($dp);

            $dpValue.text(dp.value.value);

            if(cls.dpMap[dp.uri].reification != null) {

                var $rei = $('<button class="btn btn-xs reification-btn"><span class="glyphicon glyphicon-info-sign"/></button>').appendTo($dp);

                // Disable button if not a real instance yet
                if (self.editorDef.instance == null) {
                    $rei.attr('disabled', 'disabled');
                }

                $rei.click(function () {
                    self.$dialog.hide();

                    var $editor = $('<div/>').appendTo($('body'));
                    $editor.instanceEditor();
                    $editor.instanceEditor('open', cls.dpMap[dp.uri].reification, dp.reification, {
                        subject: self.instanceUri,
                        predicate: dp.uri,
                        object: dp.value.value
                    });

                    $editor.on('instanceeditor:close', function () {
                        self.$dialog.show();
                        $editor.instanceEditor('destroy').remove();
                    });
                    $editor.on('instanceeditor:save', function (event, data) {

                        self.$dialog.show();

                    });
                });
            }

            return $dp;
        },

        _renderOPs: function(){
            var self = this;

            if(this.editorDef.instance != null) {
                this.editorDef.instance.objectProperties.forEach(function (op) {

                    self._renderOP(op).appendTo(self.$opColumn);

                });
            } else {
                // New instance, so create required fields
                this.editorDef.definition.objectProperties.forEach(function(op){

                    if(op.cardinality.hasOwnProperty('min')){
                        self.addObjectProperty(op.uri);
                    }

                });
            }
        },

        _renderOP: function(op){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);
            var $op = $('<div class="property object-property"/>');

            $op.data('propertyData', op);

            var label;

            if(self.options.showUris){
                label = sprintf('%s <span class="property-uri">%s</span>', self._getLabel(cls.opMap[op.uri].labels), op.uri);
            } else {
                label = self._getLabel(cls.opMap[op.uri].labels);
            }

            $(sprintf('<p class="property-label">%s</p>', label)).appendTo($op);

            if(self.options.showComments){
                $(sprintf('<p class="comments">%s</p>', cls.opMap[op.uri].comments.map(function(e){return e.value;}).join(" "))).appendTo(op);
            }

            var $opValue = $('<div class="property-value"/>').appendTo($op);

            $opValue.text(op.objectLabel.value);

            if(cls.opMap[op.uri].reification != null) {

                var $rei = $('<button class="btn btn-xs reification-btn"><span class="glyphicon glyphicon-info-sign"/></button>').appendTo($op);

                // Disable button if not a real instance yet
                if (self.editorDef.instance == null || op.resourceUri == null) {
                    $rei.attr('disabled', 'disabled');
                }

                $rei.click(function () {
                    self.$dialog.hide();

                    var $editor = $('<div/>').appendTo($('body'));
                    $editor.instanceEditor();
                    $editor.instanceEditor('open', cls.opMap[op.uri].reification, op.reification, {
                        subject: self.instanceUri,
                        predicate: op.uri,
                        object: op.resourceUri
                    });

                    $editor.on('instanceeditor:close', function () {
                        self.$dialog.show();
                        $editor.instanceEditor('destroy').remove();
                    });
                    $editor.on('instanceeditor:save', function (event, data) {

                        self.$dialog.show();

                    });
                });
            }

            return $op;
        },

        toggleComments: function(){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);

            self.options.showComments = !self.options.showComments;

            self.$el.find('.data-property').each(function(){
                var $dp = $(this);
                var dp = $dp.data('propertyData');

                if(self.options.showComments){
                    $(sprintf('<p class="comments">%s</p>', cls.dpMap[dp.uri].comments.map(function(e){return e.value;}).join(" "))).insertAfter($dp.find('.property-label'));
                } else {
                    $dp.find('.comments').remove();
                }
            });

            self.$el.find('.object-property').each(function(){
                var $op = $(this);
                var op = $op.data('propertyData');

                if(self.options.showComments){
                    $(sprintf('<p class="comments">%s</p>', cls.opMap[op.uri].comments.map(function(e){return e.value;}).join(" "))).insertAfter($op.find('.property-label'));
                } else {
                    $op.find('.comments').remove();
                }
            });
        },

        toggleUris: function(){
            var self = this;

            var cls = Ontology.getClass(self.editorDef.rdfType);

            self.options.showUris = !self.options.showUris;

            if(self.options.showUris && this.editorDef.instance != null){
                self.$dialog.dialog('option', 'title',
                        sprintf("%s (%s)", self.editorDef.instance.label.value, self.editorDef.instanceUri));
            } else if(this.editorDef.instance != null) {
                self.$dialog.dialog('option', 'title',
                        self.editorDef.instance.label.value);
            }

            self.$el.find('.data-property').each(function(){
                var $dp = $(this);
                var dp = $dp.data('propertyData');
                var label;

                if(self.options.showUris){
                    label = sprintf('%s <span class="property-uri">%s</span>', self._getLabel(cls.dpMap[dp.uri].labels), dp.uri);
                } else {
                    label = self._getLabel(cls.dpMap[dp.uri].labels);
                }

                $dp.find('.property-label').html(label);
            });

            self.$el.find('.object-property').each(function(){
                var $op = $(this);
                var op = $op.data('propertyData');

                var label, value;

                if(self.options.showUris){
                    label = sprintf('%s <span class="property-uri">%s</span>', self._getLabel(cls.opMap[op.uri].labels), op.uri);
                    value = sprintf('%s <span class="resource-uri">%s</span>', op.objectLabel.value, op.resourceUri);
                } else {
                    label = self._getLabel(cls.opMap[op.uri].labels);
                    value = op.objectLabel.value;
                }

                $op.find('.property-label').html(label);
                $op.find('.property-value').html(value);
            });

        },

        sort: function(){
            var self = this;

            var $elements = self.$dpColumn.children('div.property');

            $elements.sort(function(a, b){
                var al = $(a).find('.property-label').text();
                var bl = $(b).find('.property-label').text();

                return al.localeCompare(bl);
            });

            $elements.detach().appendTo(self.$dpColumn);

            $elements = self.$opColumn.children('div.property');

            $elements.sort(function(a, b){
                var al = $(a).find('.property-label').text();
                var bl = $(b).find('.property-label').text();

                return al.localeCompare(bl);
            });

            $elements.detach().appendTo(self.$opColumn);

        },

        _getLabel: function(labelSet, defaultValue){
            return labelSet.length > 0 ? labelSet[0].value : defaultValue;
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