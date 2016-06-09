
function SparqlEngine(){

}
SparqlEngine.expandNode = function(uri){
    SparqlEngine.expandNodes([uri]);
};

SparqlEngine.expandNodes = function(uris){
    SparqlEngine._describe(uris, true);
};

SparqlEngine.describeNodes = function(uris, callback){
    SparqlEngine._describe(uris, false, callback);
};

SparqlEngine._describe = function(uris, expandReferences, callback){
    var id = generateUUID();

    $(document).trigger("spinner:add", [{
        id: id,
        title: uris.length == 1 ? "Expand Node" : sprintf("Expand %d Nodes", uris.length)
    }]);

    var promise = $.ajax({
        url: Urls['discovery:describe_referenced'](),
        type: 'POST',
        data: {
            uris: JSON.stringify(uris),
            expand_references: expandReferences
        }
    });

    promise.done(function(data){
        if(expandReferences) {
            $(document).trigger("sparql_engine:expandnode", [data]);
        } else {
            $(document).trigger("sparql_engine:describenode", [data]);
        }

        if(callback != null){
            callback();
        }

    });
    promise.fail(function(){
        console.log("TODO :: ERROR");
    });
    promise.always(function(){
        $(document).trigger("spinner:remove", [{
            id: id
        }]);
    });
};

SparqlEngine.sparqlQuery = function(query){

    var id = generateUUID();

    $(document).trigger("spinner:add", [{
        id: id,
        title: "Sparql Query"
    }]);

    var promise = $.ajax({
        url: Urls['discovery:sparql_query'](),
        type: 'POST',
        data: {
            query: query
        }
    });

    promise.done(function(data){
        $(document).trigger("sparql_engine:query_results", [data]);
    });
    promise.fail(function(){
        console.log("TODO :: ERROR");
    });
    promise.always(function(){
        $(document).trigger("spinner:remove", [{
            id: id
        }]);
    });
};