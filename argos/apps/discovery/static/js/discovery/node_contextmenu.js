$(function(){
    $.contextMenu.types.relationship = function(item, opt, root){
        // this == item.$node
        $(sprintf('<span class="context-menu-entry-title">%s</span><span class="context-menu-entry-count">(%s)</span>',
            item.name, item.count
        )).appendTo(this);
    };
});

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

function buildGraphContextMenu(event, $fdg, $svg){

    var items = {};

    items.new = {
        name: "New Instance...",
        callback: function(key, opt){

            var $picker = $('<div/>').appendTo($('body'));
            $picker.typePicker();
            $picker.typePicker('open', function(picked){
                var rdf_type = picked;

                var $editor = $('<div/>').appendTo($('body'));
                $editor.instanceEditor();
                $editor.instanceEditor('open', rdf_type);

                $editor.on('instanceeditor:close', function(){
                    $editor.instanceEditor('destroy').remove();
                });
                $editor.on('instanceeditor:save', function(event, data){
                    SparqlEngine.expandNode(data.uri);
                });
            });
            $picker.on('typepicker:close', function(){
                $picker.typePicker('destroy').remove();
            });


        }
    };

    $.contextMenu({
        selector: "#"+$svg.attr('id'),
        items: items
    });

    $svg.contextMenu({x: event.x, y: event.y});
}

function buildNodeContextMenu(event, $fdg, $svg, node, multiSelect, capture){

    $svg.css('cursor', 'wait');

    function buildItems(data){
        var items = {};

        if(capture){
            items.capture = {
                name: "Capture",
                callback: function(key, opt){
                    var nodes = $fdg.fdgWidget('getSelectedNodes');

                    $(document).trigger("capture:response", [nodes]);
                }
            };
        }

        items.expand = {
            name: "Expand",
            callback: function(key, opt){
                // TODO make this a trigger?
                if(multiSelect){
                    var nodes = $fdg.fdgWidget('getSelectedNodes');

                    SparqlEngine.expandNodes(nodes.map(function(e){ return e.node.anchor; }))

                } else {
                    SparqlEngine.expandNode(node.anchor);
                }
            }
        };

        items.hide = {
            name: "Hide",
            callback: function(key, opt){
                if(multiSelect){
                    $fdg.fdgWidget('hideSelected');
                } else {
                    $fdg.fdgWidget('hide', node.anchor);
                }
            }
        };

        items.invert = {
            name: "Invert Selection",
            callback: function(key, opt){
                $fdg.fdgWidget('invertSelected');
            }
        };

        if(!multiSelect) {

            items.edit = {
                name: "Edit",
                callback: function (key, opt) {
                    var $editor = $('<div/>').appendTo($('body'));
                    $editor.instanceEditor();
                    $editor.instanceEditor('open', node.type, node.anchor);

                    $editor.on('instanceeditor:close', function(){
                        $editor.instanceEditor('destroy').remove();
                    });
                    $editor.on('instanceeditor:save', function(event, data){
                        SparqlEngine.expandNode(data.uri);
                    });
                }
            };

            items.details = {
                name: "View",
                callback: function (key, opt) {
                    var $dialog = $('<div>').appendTo($('body'));
                    $dialog.instanceViewer({

                    });

                    $dialog.instanceViewer('open', node);

                    $dialog.on("dialogclose", function(e){
                        $dialog.instanceViewer('destroy').remove();
                    });
                }
            };

            items.sep1 = "----------";
            items.in = {
                type: "html",
                html: "<span class='menu-section-heading'>Incoming References</span>"
            };

            data.incoming.forEach(function (e) {
                items[e.predicate] = {
                    type: 'relationship',
                    name: e.label,
                    count: e.count,
                    callback: function (key, opt) {
                        var p = $.ajax({
                            url: Urls['discovery:follow_reference'](),
                            type: 'POST',
                            data: {
                                uri: node.anchor,
                                predicate: e.predicate,
                                direction: 'incoming'
                            }
                        });

                        p.done(function (data) {
                            $fdg.fdgWidget('add', data);
                            $.contextMenu('destroy', "#" + $svg.attr('id'));
                        });

                        p.fail(function () {
                            console.log("TODO :: ERROR");
                        });
                    }
                };
            });

            items.sep2 = "----------";
            items.out = {
                type: "html",
                html: "<span class='menu-section-heading'>Outgoing References</span>"
            };

            data.outgoing.forEach(function (e) {
                items[e.predicate] = {
                    type: 'relationship',
                    name: e.label,
                    count: e.count,
                    callback: function (key, opt) {
                        var p = $.ajax({
                            url: Urls['discovery:follow_reference'](),
                            type: 'POST',
                            data: {
                                uri: node.anchor,
                                predicate: e.predicate,
                                direction: 'outgoing'
                            }
                        });

                        p.done(function (data) {
                            $fdg.fdgWidget('add', data);
                            $.contextMenu('destroy', "#" + $svg.attr('id'));
                        });

                        p.fail(function () {
                            console.log("TODO :: ERROR");
                        });
                    }
                }
            });
        }

        $svg.css('cursor', 'auto');

        $.contextMenu({
            selector: "#"+$svg.attr('id'),
            items: items
        });

        $svg.contextMenu({x: event.x, y: event.y});
    }

    if(!multiSelect) {

        var id = generateUUID();

        $(document).trigger("spinner:add", [{
            id: id,
            title: sprintf("Computing Context (%s)", node.label)
        }]);

        var p = $.ajax({
            url: Urls['discovery:node_contextmenu'](),
            type: 'POST',
            data: {
                uri: node.anchor
            }
        });

        p.done(function (data) {

            buildItems(data);

        });

        p.fail(function (e) {
            $svg.css('cursor', 'auto');
            console.log("TODO :: ERROR");
        });

        p.always(function(){
            $(document).trigger("spinner:remove", [{
                id: id
            }]);
        });
    } else {
        buildItems(null);
    }

}