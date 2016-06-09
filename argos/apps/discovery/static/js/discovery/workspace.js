
function Workspaces() {
    this.currentWorkspace = null;
}
Workspaces.prototype.current = function(){
    return this.currentWorkspace;
};

Workspaces.prototype.listWorkspaces = function(callback){

    swampdragon.ready(function(){
        swampdragon.callRouter('list_workspaces', 'workspace-router', null, function(context, data){

            callback(data);

        });
    });

};

Workspaces.prototype.loadCurrent = function(){
    this.load(null);
};

Workspaces.prototype.load = function(uuid){
    var self = this;

    swampdragon.ready(function(){

        var arg = null;

        if(uuid != null){
            arg = {
                uuid: uuid
            };
        }

        swampdragon.callRouter('load_workspace', 'workspace-router', arg, function(context, data){
            console.log(data);
            self.currentWorkspace = new Workspace();
            self.currentWorkspace.ws = data;
            if(data.graph != null) {
                self.currentWorkspace.graph = JSON.parse(data.graph.graph);
            } else {
                self.currentWorkspace.graph = {
                    links: [],
                    nodes: []
                }
            }
            self.currentWorkspace._set();
            $(document).trigger('workspace:load', {workspace: self.currentWorkspace});
        });

    });

};

Workspaces.prototype.newWorkspace = function(callback){
    var self = this;

    swampdragon.ready(function(){
        swampdragon.callRouter('new_workspace', 'workspace-router', null, function(context, data){
            self.currentWorkspace = new Workspace();
            self.currentWorkspace.ws = data;
            if(data.graph != null) {
                self.currentWorkspace.graph = JSON.parse(data.graph.graph);
            }
            self.currentWorkspace._set();
            $(document).trigger('workspace:load', {workspace: self.currentWorkspace});
            if(callback != null){
                callback();
            }
        });
    });
};

Workspaces.prototype.deleteWorkspace = function(uuid){
    swampdragon.ready(function(){
        swampdragon.callRouter('delete_workspace', 'workspace-router', {uuid: uuid}, function(context, data){

        });
    });
};


function Workspace() {
    this.ws = null;
    this.graph = null;
    this.nodes = [];
    this.links = [];
}
Workspace.prototype.update = function(){
    var self = this;

    swampdragon.ready(function(){
        swampdragon.callRouter('update', 'workspace-router', {workspace: self.ws}, function(context, data){
            $(document).trigger('workspace:update', {workspace: self});
        });
    });
};
Workspace.prototype.undo = function(){
    var self = this;

    swampdragon.ready(function() {
        swampdragon.callRouter('undo', 'workspace-router', {uuid: self.ws.uuid}, function(context, data){
            self.graph = JSON.parse(data.graph); // snapshot object returned
            $(document).trigger('workspace:load', {workspace: self});
        });
    });
};
Workspace.prototype.redo = function(){
    var self = this;

    swampdragon.ready(function() {
        swampdragon.callRouter('redo', 'workspace-router', {uuid: self.ws.uuid}, function(context, data){
            self.graph = JSON.parse(data.graph); // snapshot object returned
            $(document).trigger('workspace:load', {workspace: self});
        });
    });
};
Workspace.prototype.listCheckpoints = function(callback){
    var self = this;

    swampdragon.ready(function(){
        swampdragon.callRouter('list_checkpoints', 'workspace-router', {uuid: self.ws.uuid}, function(context, data){
            callback(data);
        });
    });
};
Workspace.prototype.newCheckpoint = function(name){
    var self = this;

    swampdragon.ready(function(){
        var arg = {
            uuid: self.ws.uuid,
            checkpoint: {
                name: name,
                graph: {
                    nodes: self.nodes,
                    links: self.links
                }
            }
        };

        swampdragon.callRouter('new_checkpoint', 'workspace-router', arg, function(context, data){
            $(document).trigger('workspace:checkpoints', {workspace: self});
        });
    });
};
Workspace.prototype.deleteCheckpoint = function(uuid){
    var self = this;

    swampdragon.ready(function(){
        swampdragon.callRouter('delete_checkpoint', 'workspace-router', {uuid: self.ws.uuid, checkpoint: uuid}, function(context, data){
            $(document).trigger('workspace:checkpoints', {workspace: self});
        });
    });
};
Workspace.prototype.loadCheckpoint = function(uuid, callback){
    var self = this;

    swampdragon.ready(function(){
        swampdragon.callRouter('load_checkpoint', 'workspace-router', {uuid: self.ws.uuid, checkpoint: uuid}, function(context, data){
            callback();
        });
    });
};
Workspace.prototype.setGraph = function(nodes, links){
    var self = this;

    this.graph.nodes = nodes;
    this.graph.links = links;

    this._set();

    swampdragon.ready(function(){
        var arg = {
            graph: { nodes: self.nodes, links: self.links },
            uuid: self.ws.uuid
        };
        swampdragon.callRouter('save', 'workspace-router', arg, function(context, data){
            console.log(data);
        });
    });

    $(document).trigger('workspace:nodeschanged', {nodes: nodes});
};

Workspace.prototype._set = function(){
    var self = this;
    // Save only that which is necessary to reconstitute the graph

    if(this.graph == null){
        this.nodes = [];
        this.links = [];
        return;
    }

    this.nodes = this.graph.nodes.map(function(e){
        return {
            anchor: e.anchor,
            icon: e.icon,
            label: e.label,
            px: e.px,
            py: e.py,
            type: e.type,
            x: e.x,
            y: e.y,
            properties: {},
            references: {},
            fixed: e.fixed != null ? e.fixed : false
        };
    });
    this.links = this.graph.links.map(function(e){
        return {
            anchor: e.anchor,
            predicate: e.predicate,
            source: e.source.anchor,
            target: e.target.anchor
        };
    });
};