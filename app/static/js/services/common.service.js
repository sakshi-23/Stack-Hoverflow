var module=angular.module('myApp');
module.service('commonService',commonService)

function commonService($q,$http){
    this.getFlux = getFlux;
    this.getGraph = getGraph;
	this.getLine = getLine;
	this.get_line_chart_tagpair=get_line_chart_tagpair;
	this.removeLine=removeLine;
	this.getSingleLine=getSingleLine;
	var tagCollection=[]
	var tagCollectionOriginal=[]

    function getFlux(tag){
    	 var deferred = $q.defer();
    	if(tag.split(',').length==1){
    		var path='/data/flux/'+tag
    	}
    	
    	else{
    		var path='/data/flux_multiple/'+tag
    	}
    	 
         $http.get(path)
           .success(function(data) {
              deferred.resolve({
                 result: data.results});
           }).error(function(msg, code) {
              deferred.reject(msg);
             
           });
         return deferred.promise;
    }
    
    function get_line_chart_tagpair(tag){
   	 var deferred = $q.defer();
     var path='/data/line2/'+tag   	
        $http.get(path)
          .success(function(data) {
             deferred.resolve({
                result: data});
          }).error(function(msg, code) {
             deferred.reject(msg);
            
          });
        return deferred.promise;
   }
    

    function getGraph(tag) {
      var deferred = $q.defer()
      var path = '/data/add_related_to_graph/' + tag
      $http.get(path)
        .success(function(data) {
          deferred.resolve({ result: data.results })
        })
        .error(function(msg, code) {
          deferred.reject(msg)
          
        })
      return deferred.promise
    }
    

    function getSingleLine(tag) {      
      var deferred = $q.defer()
      var splitArray=tag.split(",")
      if(splitArray.length<2){
    	  splitArray[1]="java"
      }
      var i1=tagCollection.indexOf(splitArray[0]);
      var i2=tagCollection.indexOf(splitArray[1]);
      if (i1 != -1 && i2 != -1){
    	  deferred.resolve({ result: false })
    	  return deferred.promise;   	  
      }
      else if (i1 == -1  && i2 != -1){
    	  tagCollection.push(splitArray[0]);
    	  tag=splitArray[0]
      }
      else if (i1!= -1 && i2 == -1){
    	  tagCollection.push(splitArray[1]);
    	  tag=splitArray[1]
      }
      else{
    	  tagCollection.concat(splitArray);
      }      
     
      var path = '/data/line/' + tag
      $http.get(path)
        .success(function(data) {
        	 deferred.resolve({ result: data })
        })
        .error(function(msg, code) {
          deferred.reject(msg)
          
        })
      return deferred.promise
    }

    function getLine() {
        var deferred = $q.defer()
        var path = '/data/top30'
        $http.get(path)
          .success(function(data) {
        	  tagCollection=data.tags
        	  tagCollectionOriginal=data.tags.slice(0);
            deferred.resolve({ result: data })
          })
          .error(function(msg, code) {
            deferred.reject(msg)
            
          })
        return deferred.promise
      }
    
    function removeLine(data){     
            var splitArray=data.split(",")
            if(splitArray.length<2){
          	  splitArray[1]="java"
            }
            var i1=tagCollectionOriginal.indexOf(splitArray[0]);
            var i2=tagCollectionOriginal.indexOf(splitArray[1]);
            if (i1 != -1 && i2 != -1){
	          	  return false; 	  
            }
            var i1=tagCollection.indexOf(splitArray[0]);
            var i2=tagCollection.indexOf(splitArray[1]);
            if (i1 == -1  && i2 != -1){
          	  tagCollection.splice(i1, 1)          	  
            }
            else if (i1!= -1 && i2 == -1){
              tagCollection.splice(i2, 1)    
            }
            else{
            	 tagCollection.splice(i1, 1)
            	 tagCollection.splice(i2, 1)  
            }
    	return true;
    }

}
