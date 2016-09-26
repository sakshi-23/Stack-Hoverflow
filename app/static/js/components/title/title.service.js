var module=angular.module('myApp');
module.service('titleService',titleService)

function titleService($q,$http){
    this.getTitles = getTitles;
    
    function getTitles(){
    	 var deferred = $q.defer();
         $http.get('/data/get-info')
           .success(function(data) { 
              deferred.resolve({
                 titles: data});
           }).error(function(msg, code) {
              deferred.reject(msg);
              $log.error(msg, code);
           });
         return deferred.promise;
           }
    }