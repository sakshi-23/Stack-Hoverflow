angular
	.module('myApp')
	.directive('linkGraph',linkGraph)

angular.module('myApp').run(['gridsterConfig', function(gridsterConfig) {
	gridsterConfig.draggable.enabled = false;
}]);

function linkGraph() {
	var directive = {
			restrict: 'EA',
			scope: { data:'=', add:'&' },
			templateUrl: '/static/js/components/graph/link-graph.html',
			controller: graphController,
			link: graphLink,
	}
	return directive
}

function graphController($scope, commonService) {
	$scope.graphDim = { sizeX: 2, sizeY: 2, row: 2, col: 5 }
	$scope.$watchCollection('data',
			function(newValue, oldValue){
				graphUpdate($scope, newValue, oldValue)
			},
			true
		)
}

function graphLink(scope, element, attrs) {
	scope.changeSize=changeSize;
	scope.height=angular.element(element[0].querySelector('.grid ')).css("height")
	function changeSize(e){
		if(e.target.nodeName=='DIV'){
			setTimeout(function() {
				var heightNew=angular.element(element[0].querySelector('.grid ')).css("height")
				if(heightNew!=scope.height){
					console.log("hi");
					scope.height=heightNew
				}

			},500);

		}



	}

	// initialize svg canvas and force layout
	scope.width = 400
	scope.height = 400
	scope.svg = d3.select(element[0].querySelector('.link-graph'))
		.append('svg')
		.attr('width', scope.width)
		.attr('height', scope.height)
	scope.layer0 = scope.svg.append('g')
	scope.layer1 = scope.svg.append('g')
	scope.nodes = []
	scope.links = []
	scope.force = d3.layout.force()
		.size([scope.width, scope.height])
		.charge(-300)
		.linkStrength(0.15)
		.on('tick', tick)
	scope.initialized = true

}

function tick() {
	d3.selectAll('.node').attr('transform', function(d){ return 'translate(' + d.x + ',' + d.y + ')' })
	d3.selectAll('.link')
				.attr('x1', function(d){ return d.source.x })
				.attr('y1', function(d){ return d.source.y })
				.attr('x2', function(d){ return d.target.x })
				.attr('y2', function(d){ return d.target.y })
}

function graphUpdate(scope, newValue, oldValue) {
	// pinning
	var node_drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragstart(d, i) {
        scope.force.stop() // stops the force auto positioning before you start dragging
    }
    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        tick();
    }
    function dragend(d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        scope.force.resume();
    }


	if (newValue == null) return
	d3.selectAll('.node,.link').remove()

	// get nodes from the data
	var nodes = {}
	for (var s = 0; s < newValue.length; s++) {
		var subgraph = newValue[s]
		var sum = 0
		for (var n = 0; n < subgraph.nodes.length; n++) {
			var node = subgraph.nodes[n]
			if (nodes[node.label] == null) nodes[node.label] = node.count
			else nodes[node.label] += node.count
			sum += node.count
		}
		//if (nodes[subgraph.name] == null) nodes[subgraph.name] = sum
		//else nodes[subgraph.name] += sum
	}

	// put nodes into force layout format
	scope.nodes = d3.entries(nodes)
	var lookup = {}
	for (var n = 0; n < scope.nodes.length; n++) {
		if (lookup[scope.nodes[n].key] == null) lookup[scope.nodes[n].key] = n
	}

	// get links from the data
	var links = []
	for (var s = 0; s < newValue.length; s++) {
		var subgraph = newValue[s]
		for (var l = 0; l < subgraph.links.length; l++) {
			var link = subgraph.links[l]
			if(!isNaN(lookup[link.source_label]) && !isNaN(lookup[link.target_label]))
				links.push({
					'source': lookup[link.source_label],
					'target': lookup[link.target_label],
				})
		}
	}

	scope.links = links

	scope.node = scope.layer1.selectAll('.node')
		.data(scope.nodes, function(d) { return d.key })
	scope.nodeEnter = scope.node.enter()
		.append('g')
		.attr('class', 'node')
		.on('dblclick', function(d){
			d.fixed = true
			scope.add({ tag: d.key })
		})
		.call(node_drag)
	scope.nodeEnter
		.append('circle')
		.attr('r', function(d){ return Math.log(d.value) / 2 })
		.attr('fill', '#ccc')
	scope.nodeEnter
		.append('text')
		.text(function(d){ return d.key })
		.style('text-transform', 'uppercase')
		.style('letter-spacing', '1px')
		.attr('x', 5)
		.attr('y', -5)
		.attr('class', 'label')
	scope.nodeEnter.on('mouseover', function(d){
		d3.select(this).select('circle').classed('related-highlighted', true)
		d3.select(this).select('text').classed('related-highlighted', true)
		d3.selectAll(".dot")
			.filter(function(dot) { return dot.tags.indexOf(d.key) >= 0; })
			.select("circle")
			.classed("related-highlighted", true);
	})
	.on('mouseout', function(d){
		d3.select(this).select('circle').classed('related-highlighted', false)
		d3.select(this).select('text').classed('related-highlighted', false)
		d3.selectAll(".dot")
			.select("circle")
			.classed("related-highlighted", false);
	})

	scope.node.exit().remove()

	scope.link = scope.layer0.selectAll('.link')
		.data(scope.links)
		.enter()
		.append('line')
		.attr('stroke', '#fff')
		.attr('stroke-width', 2)
		.attr('opacity', 0.2)
		.attr('class', 'link')



	// update force layout and energize
	scope.force.nodes(scope.nodes).links(scope.links).start()


}
