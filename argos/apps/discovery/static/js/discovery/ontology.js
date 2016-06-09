function check(callback){
    if(Ontology.ont != null) {
        callback();
    } else {
        setTimeout(check, 500, callback);
    }
}

function Ontology(){
    this.ont = null;
    this.classes = null;
}

Ontology.prototype.init = function(callback){
    var self = this;

    if(self.ont != null){
        if(callback != null){
            callback();
        }
        return;
    }

    var promise = $.ajax({
        url: Urls['discovery:ontology_description']()
    });

    promise.done(function(data){
        self.ont = data;
        self.classes = {};

        self.ont.classes.forEach(function(cls, i){

            cls.dpMap = {};
            cls.opMap = {};

            self.classes[cls.rdfType] = cls;
            cls.dataProperties.sort(function(a, b){
                return a.uri.localeCompare(b.uri);
            });
            cls.objectProperties.sort(function(a, b){
                return a.uri.localeCompare(b.uri);
            });

            cls.dataProperties.forEach(function(dp){
                cls.dpMap[dp.uri] = dp;
            });
            cls.objectProperties.forEach(function(op){
                cls.opMap[op.uri] = op;
            });

        });

        if(callback != null){
            callback();
        }
    });
};

Ontology.prototype.getClass = function(rdfType){
    return this.classes[rdfType];
};

var Ontology = new Ontology();
Ontology.init(null);