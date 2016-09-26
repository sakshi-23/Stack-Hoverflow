module=angular.module('myApp');

module.controller('gridController',gridController);


function gridController(commonService,$timeout) {
	var vm=this;
	vm.fluxCharts=[]
	vm.getfluxData=getFluxData;
	vm.graphResults=[]
	vm.removeFLux=removeFLux;
	vm.getLineData=getLineData;
	vm.getLineData();
	vm.showFluxMsg = false
	vm.showHelp=true;
	vm.helpClick=helpClick;
	var count=1;
	
	
	function helpClick(){
			vm.showHelp=false;
	}
	
	function getLineData(){
		var promise = commonService.getLine();
	    promise.then(
	       function(payload) {
	    	   vm.lineChartData=payload.result;
	    	   vm.colortags=vm.lineChartData.tags;
	    	
	       },
	       function(errorPayload) {
	       });
		
	}
	
	    function showMessage(message)	{
 			  message = message.charAt(0).toUpperCase() + message.slice(1)
				vm.msg=message
				vm.showFluxMsg = true
				$timeout(function(){ vm.showFluxMsg = false }, 2000)
			}

	    function getFluxData(data) {
	    	var promise = commonService.getFlux(data);
		    promise.then(
		       function(payload) {
		    	   if(payload.result.dots.length>0){
		    		   payload.result.name=data
			           vm.fluxCharts.push(payload.result)
						showMessage(payload.result.name + " Added")
		    		   
		    	   }
		    	   else
		    		   showMessage("Nothing Found");
		    	
		       },
		       function(errorPayload) {
		    	   showMessage("Nothing Found");
		       });
		    	
		    
				var promise = commonService.getGraph(data)
				promise.then(
					function(payload) {
						payload.result.name = data
						vm.graphResults.push(payload.result)
					},
					function(error) {
						
					}
				)
				
				var promise = commonService.getSingleLine(data)
				promise.then(
					function(payload) {
						vm.lineChanged=false;
						if(payload.result!=false)
							{
								vm.lineChartData.lines.push.apply(vm.lineChartData.lines, payload.result.lines);
								vm.lineChartData.related.push.apply(vm.lineChartData.related, payload.result.related);
								if(payload.result.tags.length>1)
									vm.lineChartData.tags.push.apply(vm.lineChartData.tags, payload.result.tags);
								 vm.colortags=vm.lineChartData.tags;
								vm.lineChanged=true;
							}
						
					},
					function(error) {
						
					}
				)
	    }


	   function removeFLux(index){
			 var name = vm.fluxCharts[index].name
		   vm.fluxCharts.splice(index, 1)
			 vm.graphResults.splice(index, 1)
			 showMessage(name + " Removed")
	   }

	vm.gridsterOpts = {
		    columns: 6, // the width of the grid, in columns
		    pushing: true, // whether to push other items out of the way on move or resize
		    floating: true, // whether to automatically float items up so they stack (you can temporarily disable if you are adding unsorted items with ng-repeat)
		    swapping: false, // whether or not to have items of the same size switch places instead of pushing down if they are the same size
		    width: 'auto', // can be an integer or 'auto'. 'auto' scales gridster to be the full width of its containing element
		    colWidth: 'auto', // can be an integer or 'auto'.  'auto' uses the pixel width of the element divided by 'columns'
		    rowHeight: 'match', // can be an integer or 'match'.  Match uses the colWidth, giving you square widgets.
		    margins: [10, 10], // the pixel distance between each widget
		    outerMargin: true, // whether margins apply to outer edges of the grid
		    isMobile: false, // stacks the grid items if true
		    mobileBreakPoint: 600, // if the screen is not wider that this, remove the grid layout and stack the items
		    mobileModeEnabled: true, // whether or not to toggle mobile mode when screen width is less than mobileBreakPoint
		    minColumns: 1, // the minimum columns the grid must have
		    minRows: 2, // the minimum height of the grid, in rows
		    maxRows: 100,
		    defaultSizeX: 2, // the default width of a gridster item, if not specifed
		    defaultSizeY: 1, // the default height of a gridster item, if not specified
		    minSizeX: 1, // minimum column width of an item
		    maxSizeX: null, // maximum column width of an item
		    minSizeY: 1, // minumum row height of an item
		    maxSizeY: null, // maximum row height of an item
		    resizable: {
		       enabled: true,
		       start: function(event, $element, widget) {}, // optional callback fired when resize is started,
		       resize: function(event, $element, widget) {}, // optional callback fired when item is resized,
		       stop: function(event, $element, widget) {} // optional callback fired when item is finished resizing
		    },
		    draggable: {
		       enabled: true, // whether dragging items is supported
		       handle: '.my-class', // optional selector for resize handle
		       start: function(event, $element, widget) {}, // optional callback fired when drag is started,
		       drag: function(event, $element, widget) {}, // optional callback fired when item is moved,
		       stop: function(event, $element, widget) {} // optional callback fired when item is finished dragging
		    }
		};


}
