module=angular.module('myApp');
module.controller('titleController',titleController);
	

function titleController(titleService) {
    var vm = this;
    vm.name = "Top 5 Posts";
    var promise = titleService.getTitles();
    promise.then(
       function(payload) { 
           vm.titles = payload.titles;
       },
       function(errorPayload) {
           $log.error('failure loading posts', errorPayload);
       });
}