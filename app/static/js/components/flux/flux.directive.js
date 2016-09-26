angular
    .module('myApp')
    .directive('fluxChartGrid', fluxChartGrid);

function fluxChartGrid() {
    var directive = {
        restrict: 'EA',
        scope: {
            data: '=',
            index: "&",
            remove: "&",
            add: "&",
            colortags: "="
        },
        templateUrl: '/static/js/components/flux/flux.html',
        controller: FluxController,
        link: link
    };
    return directive;
}

function FluxController($scope) {
    $scope.sizeX = 4, $scope.sizeY = 1, $scope.col = 0;
    $scope.index += 1;
    $scope.color = d3.scale.category20();
    $scope.color.domain($scope.colortags);


}




function link(scope, element, attrs) {
    var chart = d3.select(element[0]);
    var dataset = scope.data;
    var data = dataset.dots;
    var related = dataset.related;
    //console.log(dataset);
    var menuPoint = [{
            title: 'Open post in new tab',
            action: function(elm, d, i) {
                d3.select('.d3-context-menu').style('display', 'none');
                window.open('//stackoverflow.com/questions/' + d.post_id, '_blank');
            }
        }
        /*,
        			{
        				title: '',
        				action: function(elm, d, i) {
        				}
        			}*/
    ]

    var menuLabel = [{
        title: 'Create new Flux with both tags',
        action: function(elm, d, i) {
            d3.select('.d3-context-menu').style('display', 'none');
            scope.add({
                tag: dataset.given + "," + d.tag
            });
        }
    }, {
        title: 'Create new Flux with only this tag',
        action: function(elm, d, i) {
            d3.select('.d3-context-menu').style('display', 'none');
            scope.add({
                tag: d.tag
            });
        }
    }, {
        title: 'Bookmark',
        action: function(elm, d, i) {
            d3.select('.d3-context-menu').style('display', 'none');
            d3.select(element[0].querySelector('.flux-bookmark-close')).style('visibility', 'visible');
            d3.selectAll(".dot")
                .filter(function(dot) {
                    return dot.tags.indexOf(d.tag) >= 0;
                })
                .select("circle")
                .classed("bookmarked", true);

            var l = []
            l.push(d.tag)
            d3.select(element[0].querySelector('.flux-bookmark'))
                .selectAll("li")
                .data(l, function(d) {
                    return d;
                })
                .enter()
                .append("li")
                .text(function(d) {
                    return d;
                })
                .on('contextmenu', d3.contextMenu(menuBookmark))
        }
    }]
    var menuBookmark = [{
        title: 'Remove',
        action: function(elm, d, i) {
            d3.select('.d3-context-menu').style('display', 'none');
            // todo Check not in other
            d3.selectAll(".dot")
                .filter(function(dot) {
                    return dot.tags.indexOf(d) >= 0;
                })
                .select("circle")
                .classed("bookmarked", false);

            var l = []
            l.push(d)
            d3.select(element[0].querySelector('.flux-bookmark'))
                .selectAll("li")
                .data(l, function(d) {
                    return d;
                })
                .remove()
        }
    }]
    var menuFirst = [{
        title: 'Create new Flux',
        action: function(elm, d, i) {
            d3.select('.d3-context-menu').style('display', 'none');
            scope.add({
                tag: d.tag
            });
        }
    }]

    var menuTooltip = [{
        title: 'Create new Flux',
        action: function(elm, d, i) {
            d3.select('.d3-context-menu').style('display', 'none');
            scope.add({
                tag: elm.innerHTML
            });
        }
    }, {
        title: 'Bookmark',
        action: function(elm, d, i) {
            d3.select('.d3-context-menu').style('display', 'none');
            d3.selectAll(".dot")
                .filter(function(dot) {
                    return dot.tags.indexOf(elm.innerHTML) >= 0;
                })
                .select("circle")
                .classed("bookmarked", true);

            var l = []
            l.push(elm.innerHTML)
            d3.select(element[0].querySelector('.flux-bookmark'))
                .selectAll("li")
                .data(l, function(d) {
                    return d;
                })
                .enter()
                .append("li")
                .text(function(d) {
                    return d;
                })
                .on('contextmenu', d3.contextMenu(menuBookmark))
        }
    }]

    scope.removeChart = removeChart;

    function removeChart() {
        scope.remove({
            index: scope.index
        });
    }


    // Set the dimensions of the canvas / graph
    var margin = {
            top: 30,
            right: 20,
            bottom: 60,
            left: 10
        },
        width = 880 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom;

    // Parse the date / time
    var parseDate = d3.time.format("%Y-%m").parse;

    // Set the ranges
    var x = d3.time.scale().range([0, width]);
    var y = d3.scale.linear().range([height, 0]);

    // Define the axes
    var xAxis = d3.svg.axis().scale(x)
        .orient("bottom").ticks(10);

    var yAxis = d3.svg.axis().scale(y)
        .orient("left").ticks(5);

    // Adds the svg canvas
    var svg = d3.select(element[0].querySelector('.flux-chart'))
        .append("svg")
        .attr("width", width + margin.left + margin.right + 5)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(40," + (margin.top) + ")");

    // Scale the range of the data
    x.domain([parseDate("2008-07"), parseDate("2015-08")]);
    y.domain([0, 20]);


    // Add the X Axis
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the Y Axis
    // svg.append("g")
    // 	.attr("class", "y axis")
    // 	.attr("transform", "translate(-10,0)")
    // 	.call(yAxis);

    svg.append("g")
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -20)
        .attr('x', -165)
        .attr("dy", ".71em")
        .style("text-anchor", "start")
        .text("Popular Posts")
        .attr("font-size", "12px")
        .attr("fill", "#999");

    //
    var bins = svg.selectAll(".bin")
        .data(data)
        .enter()
        .append("g")
        .attr("transform", function(d) {
            return "translate(" + x(parseDate(d.bin)) + ",0)";
        });

    var dots = bins.selectAll(".dot")
        .data(function(d) {
            return d.posts;
        }, function(d) {
            return d.post_id;
        })
        .enter()
        .append("g")
        .attr("class", "dot");
    dots.append("circle")
        .attr("r", 3)
        .attr("cx", function(d) {
            return 0;
        })
        .attr("cy", function(d, i) {
            return height - i * 10;
        })
        .attr("fill", function(d) {
            return "rgba(127,127,127," + (scoreConverter(d.score)) + ")";
        }) // -73 - 2400
        .style('cursor', 'pointer')
        .attr("stroke", function(d) {
            return "#fff";
        })
        .attr("stroke-width", 0.3)
        .on('contextmenu', d3.contextMenu(menuPoint));


    var firsts = bins.selectAll(".dot")
        .data(function(d) {
            return related;
        }, function(d) {
            return d.post_id;
        })
        .classed("first-related", true);

    firsts.select("circle")
        .attr("fill", function(d) {
            return "#fff";
        })
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("contextmenu", d3.contextMenu(menuFirst));

    // Interactions mouse over
    dots.on("mouseover", function(d) {
        d3.selectAll(".dot").select('circle').classed("tooltip-enabled", false);
        $("#tooltip-title").text(d.title);
        var th = "";
        d.tags.forEach(function(t) {
            th += "<li class='tooltip-tag'>" + t + "</li>"
        })
        $("#tooltip-tags").html(th);
        d3.selectAll(".tooltip-tag").on("contextmenu", d3.contextMenu(menuTooltip));

        $("#tooltip-tags li").hover(function(g) {
            var curtag = $(this).text();
            d3.selectAll(".dot")
                .filter(function(dot) {
                    return dot.tags.indexOf(curtag) >= 0;
                })
                .select("circle")
                .classed("related-highlighted", true);
        }, function(g) {
            d3.selectAll(".dot")
                .select("circle")
                .classed("related-highlighted", false);
        });
        d3.selectAll(".dot")
            .filter(function(dot) {
                return dot.post_id == d.post_id;
            })
            .select('circle').classed("tooltip-enabled", true);
        d3.select("#flux-tooltip")
            .style("visibility", "visible")
            .style("top", (d3.event.pageY - 10) + "px")
            .style("left", (d3.event.pageX - 3) + "px");

        d3.selectAll(".language")
            .filter(function(values) {
                if (values.name == d.tag)
                    return false;
                for (i in d.tags)
                    if (values.name == d.tags[i])
                        return false;
                return true
            })
            .classed("fade", true);

        d3.selectAll(".circles")
            .filter(function(values) {
                if (values.tags.indexOf(d.tag) >= 0 || values.tag == d.tag)
                    return false;
                for (i in d.tags)
                    if (values.tags.indexOf(d.tags[i]) >= 0 || values.tag == d.tags[i])
                        return false;
                return true
            })
            .classed("fade", true);
    });
    $(".fluxGrid").on("mouseleave", function() {
        d3.select("#flux-tooltip")
            .style("visibility", "hidden");
    });

    dots.on("mouseout", function(d) {
        d3.selectAll(".language")
            .classed("fade", false);
        d3.selectAll(".circles")
            .classed("fade", false);

    });



    dots.on("dblclick", function(d) {
        window.open('//stackoverflow.com/questions/' + d.post_id, '_blank');
    });


    function handleMouseClick(d) {
        d3.event.preventDefault();
        scope.add({
            tag: d.tag
        });
        return false;
    }



    // Put a list of related (Kind of highlight filter)
    var related_tags = d3.select(element[0].querySelector('.tags-related'))
        .selectAll("li")
        .data(related)
        .enter()
        .append("li");
    related_tags
        .text(function(d) {
            return d.tag;
        });
    related_tags
        .on('contextmenu', d3.contextMenu(menuLabel))
        .on("mouseover", handleMouseOverRelated)
        .on("mouseout", handleMouseOutRelated)
        .on("click", function(d) {

        })
        .on("dblclick", function(d) {

        });


    d3.select(element[0].querySelector('.flux-bookmark-close')).on("click", function() {
        d3.select(element[0].querySelector('.flux-bookmark-close'))
            .style("visibility", "hidden")
        d3.select(element[0].querySelector('.flux-chart'))
            .selectAll(".dot")
            .select("circle")
            .classed("bookmarked", false);

        d3.select(element[0].querySelector('.flux-bookmark'))
            .selectAll("li")
            .remove()
    })

}

function handleMouseOver(d) {
    $("#tooltip-related").text(d.tag);
    d3.select("#flux-tooltip")
        .style("visibility", "visible")
        .style("top", (d3.event.pageY - 10) + "px")
        .style("left", (d3.event.pageX + 10) + "px");

    d3.selectAll(".dot")
        .filter(function(dot) {
            return dot.tags.indexOf(d.tag) >= 0 && dot.post_id != d.post_id;
        })
        .select("circle")
        .classed("related-highlighted", true);
    return false;
}

function handleMouseOut(d) {
    $("#tooltip-related").text("");
    d3.select("#flux-tooltip")
        .style("visibility", "hidden");

    d3.selectAll(".dot")
        .select("circle")
        .filter(function(dot) {
            return !this.classList.contains("search-active")
        })
        .classed("related-highlighted", false);
    return false;
}

	function link(scope, element, attrs){
		var chart = d3.select(element[0]);
		var dataset = scope.data;
		var data = dataset.dots;
		var related = dataset.related;
		//console.log(dataset);
		var menuPoint = [
			{
				title: 'Open post in new tab',
				action: function(elm, d, i) {
					d3.select('.d3-context-menu').style('display', 'none');
					window.open( '//stackoverflow.com/questions/'+d.post_id,'_blank');
				}
			}/*,
			{
				title: '',
				action: function(elm, d, i) {
				}
			}*/
		]

var menuLabel = [
			{
				title: 'Create new Flux with both tags',
				action: function(elm, d, i) {
					d3.select('.d3-context-menu').style('display', 'none');
					scope.add({ tag: dataset.given+","+d.tag });
				}
			},
			{
				title: 'Create new Flux with only this tag',
				action: function(elm, d, i) {
				d3.select('.d3-context-menu').style('display', 'none');
				scope.add({ tag: d.tag });
				}
			},
			{
				title: 'Bookmark',
				action: function(elm, d, i) {
					d3.select('.d3-context-menu').style('display', 'none');
					d3.select(element[0].querySelector('.flux-bookmark-close')).style('visibility', 'visible');
					d3.selectAll(".dot")
						.filter(function(dot) { return dot.tags.indexOf(d.tag) >= 0; })
						.select("circle")
						.classed("bookmarked", true);

					var l = []
					l.push(d.tag)
					d3.select(element[0].querySelector('.flux-bookmark'))
						.selectAll("li")
						.data(l, function(d) { return d;})
						.enter()
						.append("li")
						.text(function(d) { return d;})
						.on('contextmenu', d3.contextMenu(menuBookmark))
				}
			}
		]
var menuBookmark = [
			{
				title: 'Remove',
				action: function(elm, d, i) {
					d3.select('.d3-context-menu').style('display', 'none');
					// todo Check not in other
					d3.selectAll(".dot")
						.filter(function(dot) { return dot.tags.indexOf(d) >= 0; })
						.select("circle")
						.classed("bookmarked", false);

					var l = []
					l.push(d)
					d3.select(element[0].querySelector('.flux-bookmark'))
						.selectAll("li")
						.data(l, function(d) { return d;})
						.remove()
				}
			}
			]
var menuFirst = [
			{
				title: 'Create new Flux',
				action: function(elm, d, i) {
					d3.select('.d3-context-menu').style('display', 'none');
					scope.add({tag:d.tag});
				}
			}
		]

var menuTooltip = [
			{
				title: 'Create new Flux',
				action: function(elm, d, i) {
					d3.select('.d3-context-menu').style('display', 'none');
					scope.add({tag:elm.innerHTML});
				}
			},
			{
				title: 'Bookmark',
				action: function(elm, d, i) {
					d3.select('.d3-context-menu').style('display', 'none');
					d3.selectAll(".dot")
						.filter(function(dot) { return dot.tags.indexOf(elm.innerHTML) >= 0; })
						.select("circle")
						.classed("bookmarked", true);

					var l = []
					l.push(elm.innerHTML)
					d3.select(element[0].querySelector('.flux-bookmark'))
						.selectAll("li")
						.data(l, function(d) { return d;})
						.enter()
						.append("li")
						.text(function(d) { return d;})
						.on('contextmenu', d3.contextMenu(menuBookmark))
				}
			}
		]

		scope.removeChart=removeChart;
		function removeChart(){
			scope.remove({index:scope.index});
		}


		// Set the dimensions of the canvas / graph
		var margin = {top: 30, right: 20, bottom: 60, left: 10},
			width = 880 - margin.left - margin.right,
			height = 250 - margin.top - margin.bottom;

		// Parse the date / time
		var parseDate = d3.time.format("%Y-%m").parse;

		// Set the ranges
		var x = d3.time.scale().range([0, width]);
		var y = d3.scale.linear().range([height, 0]);

		// Define the axes
		var xAxis = d3.svg.axis().scale(x)
			.orient("bottom").ticks(10);

		var yAxis = d3.svg.axis().scale(y)
			.orient("left").ticks(5);

		// Adds the svg canvas
		var svg = d3.select(element[0].querySelector('.flux-chart'))
			.append("svg")
				.attr("width", width + margin.left + margin.right + 10)
				.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("transform",
					  "translate(40," + margin.top + ")");

			// Scale the range of the data
			x.domain([parseDate("2008-07"), parseDate("2015-08")]);
			y.domain([0, 20]);


			// Add the X Axis
			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(xAxis);

			// Add the Y Axis
			// svg.append("g")
			// 	.attr("class", "y axis")
			// 	.attr("transform", "translate(-10,0)")
			// 	.call(yAxis);

			svg.append("g")
					.append("text")
					.attr("transform", "rotate(-90)")
					.attr("y", -20)
					.attr('x', -165)
					.attr("dy", ".71em")
					.style("text-anchor", "start")
					.text("Popular Posts")
					.attr("font-size","12px")
					.attr("fill", "#999");

			//
			var bins = svg.selectAll(".bin")
				.data(data)
				.enter()
				.append("g")
				.attr("transform", function(d) { return "translate("+x(parseDate(d.bin))+",0)"; });

			var dots = bins.selectAll(".dot")
				.data(function(d) { return d.posts; }, function(d) { return d.post_id; })
				.enter()
				.append("g")
				.attr("class", "dot");
			dots.append("circle")
				.attr("r", 3)
				.attr("cx", function(d) { return 0; })
				.attr("cy", function(d, i) { return height - i*10; })
				.attr("fill", function(d) { return "rgba(127,127,127,"+(scoreConverter(d.score))+")"; }) // -73 - 2400
				.style('cursor', 'pointer')
				.attr("stroke", function(d) { return "#fff"; })
				.attr("stroke-width", 0.3)
				.on('contextmenu', d3.contextMenu(menuPoint));


			var firsts = bins.selectAll(".dot")
				.data(function(d) { return related; }, function(d) { return d.post_id; })
				.classed("first-related", true);

			firsts.select("circle")
				.attr("fill", function(d) { return "#fff"; })
				.on("mouseover", handleMouseOver)
				.on("mouseout", handleMouseOut)
				.on("contextmenu", d3.contextMenu(menuFirst));

			// Interactions mouse over
			dots.on("mouseover", function(d) {
				d3.selectAll(".dot").select('circle').classed("tooltip-enabled", false);
				$("#tooltip-title").text(d.title);
				var th = "";
				d.tags.forEach( function(t) {
					th += "<li class='tooltip-tag'>"+t+"</li>"
				})
				$("#tooltip-tags").html(th);
				d3.selectAll(".tooltip-tag").on("contextmenu", d3.contextMenu(menuTooltip));

				$("#tooltip-tags li").hover(function(g) {
						var curtag = $(this).text();
						d3.selectAll(".dot")
							.filter(function(dot) { return dot.tags.indexOf(curtag) >= 0; })
							.select("circle")
							.classed("related-highlighted", true);
					}, function(g) {
						d3.selectAll(".dot")
							.select("circle")
							.classed("related-highlighted", false);
				});
				d3.selectAll(".dot")
					.filter(function(dot) { return dot.post_id == d.post_id; })
					.select('circle').classed("tooltip-enabled", true);
				d3.select("#flux-tooltip")
					.style("visibility", "visible")
					.style("top", (d3.event.pageY-10)+"px")
					.style("left",(d3.event.pageX-3)+"px");

				d3.selectAll(".language")
				.filter(function(values) {
					if(values.name==d.tag)
						return false;
					for (i in d.tags)
						if(values.name==d.tags[i])
						 return false;
					return true })
				.classed("fade", true);

				d3.selectAll(".circles")
				.filter(function(values) {
					if( values.tags.indexOf(d.tag) >= 0 || values.tag==d.tag)
						return false;
					for (i in d.tags)
						if(values.tags.indexOf(d.tags[i]) >= 0 || values.tag==d.tags[i])
							return false;
					return true })
				.classed("fade", true);
			});
			$(".fluxGrid").on("mouseleave", function() {
				d3.select("#flux-tooltip")
					.style("visibility", "hidden");
			});

			dots.on("mouseout", function(d) {
				d3.selectAll(".language")
				.classed("fade",false);
				d3.selectAll(".circles")
				.classed("fade",false);

			});



			dots.on("dblclick", function(d) {
				window.open( '//stackoverflow.com/questions/'+d.post_id,'_blank');
			});


			function handleMouseClick(d) {
				d3.event.preventDefault();
				scope.add({tag:d.tag});
				return false;
			}



		// Put a list of related (Kind of highlight filter)
		var related_tags = d3.select(element[0].querySelector('.tags-related'))
			.selectAll("li")
				.data(related)
				.enter()
				.append("li");
		related_tags
			.text(function(d) { return d.tag; });
		related_tags
			.on('contextmenu', d3.contextMenu(menuLabel))
			.on("mouseover", handleMouseOverRelated)
			.on("mouseout", handleMouseOutRelated)
			.on("click", function(d) {

			})
			.on("dblclick", function(d) {

			});


		d3.select(element[0].querySelector('.flux-bookmark-close')).on("click", function() {
			d3.select(element[0].querySelector('.flux-bookmark-close'))
				.style("visibility", "hidden")
			d3.select(element[0].querySelector('.flux-chart'))
						.selectAll(".dot")
						.select("circle")
						.classed("bookmarked", false);

			d3.select(element[0].querySelector('.flux-bookmark'))
						.selectAll("li")
						.remove()
		})

	}

			function handleMouseOver(d) {
				$("#tooltip-related").text(d.tag);
				d3.select("#flux-tooltip")
					.style("visibility", "visible")
					.style("top", (d3.event.pageY-10)+"px")
					.style("left",(d3.event.pageX+10)+"px");

				d3.selectAll(".dot")
					.filter(function(dot) { return dot.tags.indexOf(d.tag) >= 0 && dot.post_id != d.post_id; })
					.select("circle")
					.classed("related-highlighted", true);
				return false;
			}
			function handleMouseOut(d) {
				$("#tooltip-related").text("");
				d3.select("#flux-tooltip")
					.style("visibility", "hidden");

				d3.selectAll(".dot")
					.select("circle")
					.filter(function(dot){
						return !this.classList.contains("search-active")
						})
					.classed("related-highlighted", false);
				return false;
			}

			function handleMouseOverRelated(d) {
				d3.selectAll(".dot")
					.filter(function(dot) { return dot.tags.indexOf(d.tag) >= 0; })
					.select("circle")
					.classed("related-highlighted", true);

				var corresponding_nodes = d3.selectAll(".node")
					.filter(function(v) { return v.key == d.tag; });
				corresponding_nodes
					.select("circle")
					.classed("node-highlighted", true);
				corresponding_nodes
					.select("text")
					.classed("node-label-highlighted", true);
				return false;
			}
			function handleMouseOutRelated(d) {
				d3.selectAll(".dot")
					.select("circle")
					.filter(function(dot){
						return !this.classList.contains("search-active")
						})
					.classed("related-highlighted", false);

				d3.selectAll(".node")
					.select("circle")
					.classed("node-highlighted", false);
				d3.selectAll(".node")
					.select("text")
					.classed("node-label-highlighted", false);
				return false;
			}

			function scoreConverter(s) {
				if( s<=0 ) return 0.0;
				else if( s<=10 ) return 0.15;
				else if( s<=100 ) return 0.4;
				else return 0.8;
			}

function handleMouseOverRelated(d) {
    d3.selectAll(".dot")
        .filter(function(dot) {
            return dot.tags.indexOf(d.tag) >= 0;
        })
        .select("circle")
        .classed("related-highlighted", true);

    var corresponding_nodes = d3.selectAll(".node")
        .filter(function(v) {
            return v.key == d.tag;
        });
    corresponding_nodes
        .select("circle")
        .classed("node-highlighted", true);
    corresponding_nodes
        .select("text")
        .classed("node-label-highlighted", true);
	d3.selectAll(".language")
	.filter(function(values) {
		if(values.name==d.tag)
			return false;
		for (i in d.tags)
			if(values.name==d.tags[i])
			 return false;
		return true })
	.classed("fade", true);

	d3.selectAll(".circles")
	.filter(function(values) {
		if( values.tags.indexOf(d.tag) >= 0 || values.tag==d.tag)
			return false;
		for (i in d.tags)
			if(values.tags.indexOf(d.tags[i]) >= 0 || values.tag==d.tags[i])
				return false;
		return true })
	.classed("fade", true);
    return false;
}

function handleMouseOutRelated(d) {
    d3.selectAll(".dot")
        .select("circle")
        .filter(function(dot) {
            return !this.classList.contains("search-active")
        })
        .classed("related-highlighted", false);

    d3.selectAll(".node")
        .select("circle")
        .classed("node-highlighted", false);
    d3.selectAll(".node")
        .select("text")
        .classed("node-label-highlighted", false);

    d3.selectAll(".language")
	.classed("fade",false);
	d3.selectAll(".circles")
	.classed("fade",false);


    return false;
}

function scoreConverter(s) {
    if (s <= 0) return 0.0;
    else if (s <= 10) return 0.15;
    else if (s <= 100) return 0.4;
    else return 0.8;
}
