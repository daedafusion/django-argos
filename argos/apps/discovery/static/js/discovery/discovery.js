var windowDelta = 5;

$(function(){

    var views = {};

    // TODO this screws up vertical resizing but without it the svg isn't sized property
    var workspaceHeight = $(window).height()-$(".top-bar").height()-$(".content-bar").height()-22;
    var workspaceWidth = $(window).width()-$(".left-sidebar").width()-10;
    $('.main-content').height(workspaceHeight+"px");


    var $gs = $('.grid-stack');

    var gsColumns = 12;
    var gsRows = 4;

    $gs.gridstack({
        //width: gsColumns,
        //height: gsRows,
        cell_height: workspaceHeight/gsRows,
        vertical_margin: 0,
        handle: '.gs-handle',
        draggable: {
            handle: '.gs-handle'
        }
    });

    var grid = $gs.data('gridstack');

    var initWidget = function(name){

        var $wrapper = $(sprintf('<div class="grid-stack-item"><div class="grid-stack-item-content %s"><div class="gs-handle"><span class="glyphicon glyphicon-transfer"></span></div></div></div>', name));
        var $widget = $wrapper.find(sprintf(".%s", name));

        views[name] = {
            wrapper: $wrapper,
            widget: $widget,
            visible: false
        };

        return $widget;
    };

    var $fdg = initWidget('fdg').fdgWidget();
    var $geo = initWidget('geo').geoWidget();
    var $time = initWidget('timeline').timelineWidget();
    var $chat = initWidget('chat').chatWidget();

    // Start with just fdg
    grid.add_widget(views.fdg.wrapper, 0, 0, 12, 4, true);
    views.fdg.visible = true;
    views.fdg.widget.fdgWidget('resize');

    $(window).resize(function(){
        workspaceHeight = $(window).height()-$(".top-bar").height()-$(".content-bar").height()-22;
        workspaceWidth = $(window).width()-$(".left-sidebar").width()-10;
        $('.main-content').height(workspaceHeight+"px");

        $geo.geoWidget("resize");
        $fdg.fdgWidget("resize");
        $time.timelineWidget("resize");
        $chat.chatWidget("resize");
    });

    var manageLayout = function(){
        // Right now only check fdg, but add advanced functionality later
        var data = views.fdg.wrapper.data('_gridstack_node');

        if(data == null){
            return;
        }

        // If we are full screen, shrink
        if(data.x == 0 && data.y == 0 && data.width == gsColumns && data.height == gsRows){
            grid.resize(views.fdg.wrapper, data.width/2, data.height);
        }
    };

    $(".show-geo").click(function(){
        manageLayout();

        if(views.geo.visible){
            grid.remove_widget(views.geo.wrapper, false);
            views.geo.visible = false;
            views.geo.wrapper.hide();
        } else {
            grid.add_widget(views.geo.wrapper, 0, 0, 6, 4, true);
            views.geo.visible = true;
            views.geo.wrapper.show();
            views.geo.widget.geoWidget('resize');
        }
    });

    $(".show-fdg").click(function(){
        //manageLayout();
        if(views.fdg.visible){
            grid.remove_widget(views.fdg.wrapper, false);
            views.fdg.visible = false;
            views.fdg.wrapper.hide();
        } else {
            grid.add_widget(views.fdg.wrapper, 0, 0, 6, 4, true);
            views.fdg.visible = true;
            views.fdg.wrapper.show();
            views.fdg.widget.fdgWidget('resize');
        }
    });

    $(".show-timeline").click(function(){
        manageLayout();
        if(views.timeline.visible){
            grid.remove_widget(views.timeline.wrapper, false);
            views.timeline.visible = false;
            views.timeline.wrapper.hide();
        } else {
            grid.add_widget(views.timeline.wrapper, 0, 0, 6, 4, true);
            views.timeline.visible = true;
            views.timeline.wrapper.show();
            views.timeline.widget.timelineWidget('resize');
        }
    });

    $(".show-chat").click(function(){
        manageLayout();
        if(views.chat.visible){
            grid.remove_widget(views.chat.wrapper, false);
            views.chat.visible = false;
            views.chat.wrapper.hide();
        } else {
            grid.add_widget(views.chat.wrapper, 0, 0, 6, 4, true);
            views.chat.visible = true;
            views.chat.wrapper.show();
            views.chat.widget.chatWidget('resize');
        }
    });

    ////////////////////////////////////////////////////////////////////////////////

    var captureRequest = {
        range: [],
        callback: null
    };

    var workspaces = new Workspaces();

    var $spinnerStack = $('<div/>').appendTo($('body'));

    $spinnerStack.spinnerStack();

    var $searchBar = $('.search-bar');

    $searchBar.searchBar();

    /*
            Search wiring
     */

    $searchBar.on('searchbar:results', function(event, data){
        console.log("processing search results :: " + data.nodes.length);
        $fdg.fdgWidget('add', data.nodes);
    });

    $(document).on('sparql_engine:expandnode', function(event, data){
        console.log('expanded node :: '+data.length);
        $fdg.fdgWidget('addNoMerge', data); // should be a complete description so overwrite
    });
    $(document).on('sparql_engine:describenode', function(event, data){
        console.log('described node :: '+data.length);
        $fdg.fdgWidget('fill', data);
    });

    $(document).on("sparql_engine:query_results", function(event, data){
        $fdg.fdgWidget('add', data);
    });

    /*
            Click wiring
     */

    $fdg.on('fdgwidget:node_click', function(event, data){
        var uri = data.node.anchor;
        $time.timelineWidget('seek', uri);
        $time.timelineWidget('selectNodes', [uri]);
        $geo.geoWidget('seek', uri);
        $chat.chatWidget('startChat', sprintf('http://df.com/%s/instance', USER.domain), uri, sprintf('Instance Discussion :: %s', data.node.label))
    });
    $time.on('timelinewidget:node_click', function(event, data){
        var uri = data.node.anchor;
        $fdg.fdgWidget('selectNodes', [uri]);
        $chat.chatWidget('startChat', sprintf('http://df.com/%s/instance', USER.domain), uri, sprintf('Instance Discussion :: %s', data.node.label))
    });

    $fdg.on('fdgwidget:node_dblclick', function(event, data){
        var uri = data.node.anchor;
        SparqlEngine.expandNode(uri);
    });

    $fdg.on('fdgwidget:node_rightclick', function(event, data){
        var $svg = $(data.svg);
        buildNodeContextMenu(event, $fdg, $svg, data.node, data.multiSelect, captureRequest.callback != null);
    });

    $fdg.on('fdgwidget:graph_rightclick', function(event, data){
        var $svg = $(data.svg);
        buildGraphContextMenu(event, $fdg, $svg);
    });

    $fdg.on('fdgwidget:graph_click', function(event, data){
        $chat.chatWidget('startChat', 'http://df.com/workspace', workspaces.currentWorkspace.ws.uuid, 'Workspace Discussion');
    });

    /*
            Workspace wiring
     */

    $fdg.on('fdgwidget:post_add fdgwidget:post_clear', function(event, data){
        workspaces.currentWorkspace.setGraph(data.nodes, data.links);
    });

    $(document).on('workspace:nodeschanged', function(event, data){
        $time.timelineWidget('add', data.nodes);
        $geo.geoWidget('add', data.nodes);
    });

    workspaces.loadCurrent();

    $(document).on('workspace:load', function(event, data){
        $fdg.fdgWidget('load', data.workspace.graph);

        $chat.chatWidget('startChat', 'http://df.com/workspace', data.workspace.ws.uuid, 'Workspace Discussion');

        if(data.workspace.graph != null){
            var uris = data.workspace.graph.nodes.map(function(e){
                return e.anchor;
            });
            if(uris.length > 0) {
                SparqlEngine.describeNodes(uris, function () {
                    //$time.timelineWidget('add', data.workspace.graph.nodes);
                    //$geo.geoWidget('add', data.workspace.graph.nodes);
                });
            }
        }

    });

    $(document).on('workspace:load workspace:update', function(event, data){
        $('.workspace-title').remove();
        var $title = $('<div class="workspace-title"/>').appendTo($('.content'));
        $(sprintf('<p class="workspace-name">%s</p>', data.workspace.ws.name != null ? data.workspace.ws.name : "Untitled Workspace")).appendTo($title);
        $(sprintf('<p class="workspace-update">Updated %s</p>', moment(data.workspace.ws.updated).fromNow())).appendTo($title);

        workspaces.currentWorkspace.listCheckpoints(displayCheckpoints);
    });


    /*
            Menu wiring
     */

    $('.menu_new').click(function(){
        workspaces.newWorkspace(function(){
                var promise = $.ajax({
                url: sprintf('%s?op=read', Urls['administration:partitions_list']()),
                type: 'GET'
            });

            promise.done(function(partitions){

                var $dialog = $('<div>').appendTo($('body'));

                $dialog.workspaceProperties({});

                $dialog.workspaceProperties('open', workspaces.currentWorkspace, partitions);

                $dialog.on('dialogclose', function(e){
                    $dialog.workspaceProperties('destroy').remove();
                });
            });
            promise.fail(function(){
                console.log("TODO :: Error");
            });
            promise.always(function(){
            });
        });
    });

    $('.menu_open').click(function(){

        workspaces.listWorkspaces(function(list){
            var $dialog = $('<div>').appendTo($('body'));

            $dialog.workspaceOpen({});

            $dialog.workspaceOpen('open', list);

            $dialog.on('workspaceopen:open', function(event, data){
                workspaces.load(data.uuid);
            });
            $dialog.on('workspaceopen:delete', function(event, data){
                workspaces.deleteWorkspace(data.uuid);
                $.jGrowl("Workspace deleted");
            });

            $dialog.on('dialogclose', function(e){
                $dialog.workspaceOpen('destroy').remove();
            });
        });

    });

    $('.menu_properties').click(function(){
        var promise = $.ajax({
            url: sprintf('%s?op=read', Urls['administration:partitions_list']()),
            type: 'GET'
        });

        promise.done(function(partitions){

            var $dialog = $('<div>').appendTo($('body'));

            $dialog.workspaceProperties({});

            $dialog.workspaceProperties('open', workspaces.currentWorkspace, partitions);

            $dialog.on('dialogclose', function(e){
                $dialog.workspaceProperties('destroy').remove();
            });
        });
        promise.fail(function(){
            console.log("TODO :: Error");
        });
        promise.always(function(){
        });

    });

    $('.show-manual-query').click(function(){
        var $dialog = $('<div>').appendTo($('body'));

        $dialog.queryEditor({});

        $dialog.queryEditor('open');

        $dialog.on('dialogclose', function(e){
            $dialog.queryEditor('destroy').remove();
        });
    });


    $('.menu_new_checkpoint').click(function(){
        bootbox.prompt("Checkpoint Name", function(result){

            workspaces.currentWorkspace.newCheckpoint(result != null ? result : "Unnamed Checkpoint");

        });
    });

    var displayCheckpoints = function(list){
        $('.checkpoint').remove();
        var $listStart = $('.checkpoint-list');

        list.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });

        list.forEach(function(c){
            var $li = $(sprintf('<li class="checkpoint" uuid="%s"><a href="#"><span class="text">%s</span></a></li>', c.uuid, c.name)).insertAfter($listStart);

            $li.find('a').click(function(){
                workspaces.currentWorkspace.loadCheckpoint(c.uuid, function(){
                    workspaces.loadCurrent();
                });
            });
        });
    };

    $(document).on("workspace:checkpoints", function(event, list){
        workspaces.currentWorkspace.listCheckpoints(displayCheckpoints);
    });

    $('.menu_manage_checkpoints').click(function(){
        var $sel = $('.delete-checkpoint');

        if($sel.length){
            $sel.remove();
            return;
        }

        var $del = $('<button type="button" class="delete-checkpoint btn btn-danger btn-xs"><span class="glyphicon glyphicon-remove"></span></button>').appendTo($('.checkpoint'));
        $del.click(function(){
            var $li = $(this).parent();
            var uuid = $li.attr('uuid');
            workspaces.currentWorkspace.deleteCheckpoint(uuid);
            $('.delete-checkpoint').remove();
        });
    });


    /*
            Capture wiring
     */

    $(document).on("capture:request", function(event, rdfTypeRange, callback){
        console.log("caught capture request for "+rdfTypeRange);

        captureRequest.range = rdfTypeRange;
        captureRequest.callback = callback;
    });

    $(document).on("capture:response", function(event, objects){
        console.log("caught capture response for "+objects);

        var response = objects.map(function(n){
            return {
                uri: n.node.anchor,
                label: n.node.label
            };
        });

        captureRequest.callback(response);

        captureRequest.range = [];
        captureRequest.callback = null;
    });

    $(document).bind('keypress', function(e) {
        if (e.which == 26 && e.ctrlKey && !e.shiftKey) {
            workspaces.currentWorkspace.undo();
        } else if (e.which == 26 && e.ctrlKey && e.shiftKey) {
            workspaces.currentWorkspace.redo();
        }
    });
});