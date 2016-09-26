angular
	.module('myApp')
	.directive('sparkline',sparkline);

function sparkline(){
	var directive={
			restrict: 'EA',
			scope: { add:"&"},
			templateUrl: '/static/js/components/sparkline/sparkline.html',
			controller: sparklineController,
			
			
	};
	return directive;
}
	
	function sparklineController($scope,commonService){
		$scope.sparklineDim={ sizeX: 2, sizeY: 1, row: 0, col: 5 };
		
		$scope.addChart=addChart;
		$scope.data=["android", "jquery", "ios", "mysql", "sql", "asp.net", "objective-c", "ruby-on-rails", "iphone", "arrays",  "sql-server", "ajax", "json", "regex", "xml", "angularjs", "asp.net-mvc", "linux", "wpf","bootstrap"]
		
		$scope.onChange=onChange;
		$scope.onChangeUser=onChangeUser;
		
		function onChange(search){
			var searchTerms=search.split(',');  
			var dots=d3.selectAll(".dot")
			
			dots.select("circle")
			   .classed("related-highlighted", false)
			   .classed("search-active",false);
			
			d3.selectAll(".language")
				.classed("fade",false);
			d3.selectAll(".circles")
			.classed("fade",false);
			
			if(search.length>0){
				d3.selectAll(".language")
				.filter(function(values) { 
					for(term in searchTerms) 
					{if(values.name==searchTerms[term]) 
						return false;} 
					return true })
				.classed("fade", true);	
				
				d3.selectAll(".circles")
				.filter(function(values) { 
					for(term in searchTerms) 
					{if( values.tags.indexOf(searchTerms[term]) >= 0 || values.tag==searchTerms[term]) 
						return false;} 
					return true })
				.classed("fade", true);
				
				dots.filter(function(dot) {
					for(term in searchTerms) 
					{if( dot.tags.indexOf(searchTerms[term]) >= 0) 
						return true;} 
					return false })
					.select("circle")
					.classed("related-highlighted", true)
					.classed("search-active",true);
				

				
			}
			
			
		}
		
		function onChangeUser(searchUser){
			var dots=d3.selectAll(".dot")
			
			dots.select("circle")
			   .classed("related-highlighted", false)
			   .classed("search-active",false);
			
			dots.filter(function(dot) {
				if( dot['user_id']==searchUser) 
					return true; 
				return false })
				.select("circle")
				.classed("related-highlighted", true)
				.classed("search-active",true);			
		}
		  
	
		
		function addChart(tag){
			$scope.add({tag:tag});
		}

/*
	$( "#search-tags" ).autocomplete({
		source: "/data/search_tags",
		minLength: 2
	});
 */   
		
}

	