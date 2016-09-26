angular
    .module('myApp')
    .directive('lineChart', lineChart);

function lineChart(commonService) {
    var directive = {
        restrict: 'EA',
        scope: {
            add: "&",
            data: "=",
            added: "=",
            linechanged: "="
        },
        templateUrl: '/static/js/components/line/line-chart.html',
        controller: Controller,
        link: lineLink


    };
    return directive;
}

function Controller($scope, commonService) {

    $scope.highlightChart = highlightChart;
    $scope.lineChartDim = {
        sizeX: 4,
        sizeY: 3,
        row: 0,
        col: 0
    };
    $scope.addChart = addChart;

    function addChart(tag) {
        $scope.add({
            tag: tag
        });
    }

    function highlightChart(search) {
        d3.selectAll(".related-search").remove();
        var promise = commonService.get_line_chart_tagpair(search);
        promise.then(
            function(payload) {
                for (i in payload.result) {
                    $scope.createThickNess(payload.result[i].name, search, payload.result[i].results)
                }
            },
            function(errorPayload) {});
    }


}

function lineLink(scope, element, attrs) {
    var data = JSON.parse(JSON.stringify(scope.data.lines));
    var dataNew = scope.data.lines;
    var related = scope.data.related
    scope.h = 600
    draw(0);
    var name = "Python";
    var count = 0
    scope.$watch('added', function() {
        scope.h = 200
        count++;
        if (count == 2) {
            d3.select(element[0].querySelector('.line-chart')).html("")
            draw(1);
            scope.lineChartDim.sizeY = 1;
        }

        setTimeout(function() {
            if (scope.linechanged == true) {
                scope.linechanged = false
                data = JSON.parse(JSON.stringify(scope.data.lines));
                draw(0);
                scope.lineChartDim.sizeY = 1;
            }
        }, 1000);


    });


    function draw(time) {
        scope.data.done = true;
        scope.handleMouseClick = handleMouseClick;
        scope.dblclickHandler = dblclickHandler;
        d3.select(element[0].querySelector('.line-chart')).html("")
        var clickCount = 0;
        var mouseClicked = false;
        var margin = {
                top: 20,
                right: 80,
                bottom: 30,
                left: 40
            },
            width = 950 - margin.left - margin.right,
            height = scope.h - margin.top - margin.bottom;

        var parseDate = d3.time.format("%Y-%m").parse;

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.pow().exponent(.005)
            .range([height, 0]);



        var color = d3.scale.category20();
        scope.color = color;

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .interpolate("basis")
            .x(function(d) {
                return x(d.Date);
            })
            .y(function(d) {
                return y(d.Value);
            });

        var svg = d3.select(element[0].querySelector('.line-chart'))
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .on("click", handleMouseOverSvg)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

        scope.svg = svg;

        color.domain(scope.data.tags);
        if (time != 1) {
            data.forEach(function(kv) {
                kv.Data.forEach(function(d) {
                    d.Date = parseDate(d.Date);
                });
            });

        }

        var languages = data;

        var minX = d3.min(data, function(kv) {
            return d3.min(kv.Data, function(d) {
                return d.Date;
            })
        });
        var maxX = d3.max(data, function(kv) {
            return d3.max(kv.Data, function(d) {
                return d.Date;
            })
        });
        var minY = d3.min(data, function(kv) {
            return d3.min(kv.Data, function(d) {
                return d.Value;
            })
        });
        var maxY = d3.max(data, function(kv) {
            return d3.max(kv.Data, function(d) {
                return d.Value;
            })
        });

        x.domain([minX, parseDate('2015-08')]);
        y.domain([minY, maxY]);

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)

        svg.append("g")
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -20)
            .attr('x', -165)
            .attr("dy", ".71em")
            .style("text-anchor", "start")
            .text("Post Count")
            .attr("font-size", "12px")
            .attr("fill", "#999");

        var language = svg.selectAll(".language")
            .data(languages)
            .enter().append("g")
            .attr("class", "language")
            .attr("font-size", "12px")
            .attr("cursor", "pointer")
            .attr("fill", "rgba(255,255,255,0.7)")

        language.append("path")
            .attr("class", "line")
	    .attr("id", function(d){
			return "language-path-"+d.name
		})
            .attr("d", function(d) {
                return line(d.Data);
            })
            .style("stroke", function(d) {
                return color(d.name);
            })
	    .style("stroke-opacity",0.8)
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleMouseClick)
            .on("dblclick", dblclickHandler);

        language.append("text")
            .attr("class", "language-text")
            .datum(function(d) {
                return {
                    name: d.name,
                    date: d.Data[d.Data.length - 1].Date,
                    value: d.Data[d.Data.length - 1].Value
                };
            })
            .attr("transform", function(d) {
                return "translate(" + x(d.date) + "," + y(d.value) + ")";
            })
            .attr("x", 3)
            .attr("dy", ".35em")
            .text(function(d) {
                return d.name;
            })
            .style("fill", function(d) {
                return color(d.name)
            })
            .on("mouseover", handleMouseOver)
            .on("mouseout", handleMouseOut)
            .on("click", handleMouseClick)
            .on("dblclick", dblclickHandler);

        scope.createThickNess = function(line, second, result) {
            svg.selectAll(".related-srch")
                .data(result)
                .enter()
                .append("circle")
                .attr("class", "related-search")
                .attr("r", 2)
                .attr("transform", function(d) {
                    d.name = line
                    YValue = getsingleY(d.bin, line)
                    if (isNaN(YValue)) {
                        console.log(d.create_date);
                        YValue = 100
                    }
                    return "translate(" + x(parseDate(d.bin)) + "," + y(YValue) + ")";
                })
                .style("fill", "black")

        }

function findYatXbyBisection(x, path, error){
		  var length_end = path.getTotalLength()
		    , length_start = 0
		    , point = path.getPointAtLength((length_end + length_start) / 2) // get the middle point
		    , bisection_iterations_max = 50
		    , bisection_iterations = 0

		  error = error || 0.01

		  while (x < point.x - error || x > point.x + error) {
		    // get the middle point
		    point = path.getPointAtLength((length_end + length_start) / 2)

		    if (x < point.x) {
		      length_end = (length_start + length_end)/2
		    } else {
		      length_start = (length_start + length_end)/2
		    }

		    // Increase iteration
		    if(bisection_iterations_max < ++ bisection_iterations)
		      break;
		  }
		  return point.y
	}

        for (i in related) {
            svg.selectAll(".circle")
                .data(related[i].Data)
                .enter()
                .append("circle")
                .attr("class", "circles")
                .attr("r", 3)
                .attr("transform", function(d) {
                    d.name = related[i].name
                    YValue = getsingleY(d.create_date, related[i].name)
                    return "translate(" + x(parseDate(d.create_date)) + "," + findYatXbyBisection(x(parseDate(d.create_date)),document.getElementById("language-path-"+d.name),0.01) + ")";
                })
                .style("fill", function(d) {
                    return color(d.name)
                })
                .style('cursor', 'pointer')
                .on("mouseover", handlemouseOverCircle)
                .on("mouseout", handlemouseOutCircle)
                .on("dblclick", dblclickHandlerCircle)
        }



        function handlemouseOverCircle(d) {
            $(".tooltip-title").text(d.tag);
            d3.select(this).select('circle').transition().attr('r', 5)
            d3.select(".tooltip")
                .style("visibility", "visible")
                .style("top", (d3.event.pageY - 10) + "px")
                .style("left", (d3.event.pageX + 10) + "px");
        }

        function handlemouseOutCircle() {
            d3.select(this).select('circle').transition().attr('r', 3)
            $(".tooltip-title").text("");
            d3.select(".tooltip")
                .style("visibility", "hidden");
        }

        function handleMouseClick(d) {
            if (mouseClicked) {
                mouseClicked = false;
                handleMouseOut(d);
                return false
            }
            mouseClicked = true;
            d3.selectAll(".language")
                .filter(function(values) {
                    return values.name != d.name;
                })
                .classed("fade", true);
            d3.selectAll(".circles")
                .filter(function(values) {
                    return values.name != d.name;
                })
                .classed("fade", true);
              d3.select(".tooltip")
                  .style("visibility", "hidden");
            return false;
        }

        function handleMouseOver(d) {
            var dots = d3.selectAll(".dot")
            if (!mouseClicked) {
                dots.select("circle")
                    .classed("related-highlighted", false)
                    .classed("search-active", false);
                d3.selectAll(".language")
                    .filter(function(values) {
                        return values.name != d.name;
                    })
                    .classed("fade", true);
                d3.selectAll(".circles")
                    .filter(function(values) {
                        return values.name != d.name;
                    })
                    .classed("fade", true);

                dots.filter(function(dot) {
                        if (dot.tags.indexOf(d.name) >= 0)
                            return true;
                        return false
                    })
                    .select("circle")
                    .classed("related-highlighted", true)
                    .classed("search-active", true);

                return false;

            }

        }

        function handleMouseOut(d) {
            var dots = d3.selectAll(".dot")
            if (!mouseClicked) {
                d3.selectAll(".language")
                    .classed("fade", false);
                d3.selectAll(".circles")
                    .classed("fade", false);
                dots.select("circle")
                    .classed("related-highlighted", false)
                    .classed("search-active", false);
                return false;

            }

        }

        function dblclickHandler(d) {
            scope.add({
                tag: d.name
            });
        }

        function dblclickHandlerCircle(d) {
            scope.add({
                tag: d.tag
            });
        }



        function handleMouseOverSvg(e) {
            if (d3.event.currentTarget == d3.event.srcElement) {
                if (mouseClicked) {
                    mouseClicked = false;
                    handleMouseOut(e);
                    return false
                }
                if (clickCount % 2 == 0) {
                    //scope.add({tag:d.name});
                    d3.select(".ranks").remove();
                    d3.select(".rankText").remove();
                    d3.selectAll(".language")
                        .classed("fade", true);
                    d3.selectAll(".circles")
                        .classed("fade", true);
                    d3.selectAll(".language-text")
                        .classed("fade", true);
                    d3.selectAll(".line")
                        .classed("fade", true);
                    var x0 = x.invert(d3.mouse(this)[0]);
                    var YValues = getY(x0);
                    var values = YValues.lines;
                    values.sort(function(a, b) {
                        return a.Value - b.Value
                    })
                    svg.append("line")
                        .attr("class", "ranks")
                        .style("stroke", "gray")
                        .attr("x1", d3.mouse(this)[0])
                        .attr("y1", 0)
                        .attr("x2", d3.mouse(this)[0])
                        .attr("y2", height);
                    var yLinear = d3.scale.linear()
                        .range([height, 0]).domain([0, values.length]);
                    language.append("text")
                        .attr("class", "rankText")
                        .data(values)
                        .attr("transform", function(d, i) {
                            return "translate(" + d3.mouse(this)[0] + "," + yLinear(i + 1) + ")";
                        })
                        .style("fill", function(d) {
                            return color(d.name)
                        })
                        .attr("x", 3)
                        .attr("dy", ".35em")
                        .text(function(d) {
                            return d.name;
                        })
                } else {

                    $(".rankText").remove()
                    d3.selectAll(".line")
                        .classed("fade", false);
                    d3.selectAll(".circles")
                        .classed("fade", false);
                    d3.selectAll(".language-text")
                        .classed("fade", false);
                    //scope.add({tag:d.name});
                    d3.select(".ranks").remove();

                }
                clickCount++;

            }

        }

        function getY(date) {
            var a = {}
            a.lines = []
            a.max = 0;
            a.min = 100000;
            for (line in languages) {

                var data = languages[line]

                for (datum in data.Data) {
                    if (moment(data.Data[datum].Date).format("YYYY-MM") == moment(date).format("YYYY-MM")) {
                        a.lines.push({
                            "name": data.name,
                            "Value": data.Data[datum].Value
                        })
                        if (data.Data[datum].Value > a.max)
                            a.max = data.Data[datum].Value;
                        if (data.Data[datum].Value < a.min)
                            a.min = data.Data[datum].Value;

                    }
                }
            }
            return a;
        }

        function getsingleY(date, name) {
            for (line in languages) {
                var data = languages[line]
                if (data.name == name) {
                    for (datum in data.Data) {
                        if (moment(data.Data[datum].Date).format("YYYY-MM") == date)
                            return data.Data[datum].Value
                    }
                }
            }

        }


    }


}

	function lineLink(scope, element, attrs){
		var data=JSON.parse(JSON.stringify(scope.data.lines));
		var dataNew=scope.data.lines;
		var related=scope.data.related
		scope.h=600
		draw(0);
		var name="Python";
		var count=0
		scope.$watch('added',function(){
			scope.h=200
			count++;
			if(count==2)
				{
					d3.select(element[0].querySelector('.line-chart')).html("")
					draw(1);
					scope.lineChartDim.sizeY=1;
				}

			setTimeout(function(){
				if(scope.linechanged==true )
					{	scope.linechanged=false
						data=JSON.parse(JSON.stringify(scope.data.lines));
						draw(0);
						scope.lineChartDim.sizeY=1;
					}
				}, 1000);


		});


		function draw(time){
			scope.data.done=true;
			scope.handleMouseClick=handleMouseClick;
			scope.dblclickHandler=dblclickHandler;
			d3.select(element[0].querySelector('.line-chart')).html("")
			var clickCount=0;
			var mouseClicked=false;
			var margin = {
				    top: 20,
				    right: 80,
				    bottom: 30,
				    left: 40
				},
				width = 950 - margin.left - margin.right,
				height = scope.h - margin.top - margin.bottom;

				var parseDate = d3.time.format("%Y-%m").parse;

				var x = d3.time.scale()
				    .range([0, width]);

				var y = d3.scale.pow().exponent(.005)
				    .range([height, 0]);



				var color = d3.scale.category20();
				scope.color= color;

				var xAxis = d3.svg.axis()
				    .scale(x)
				    .orient("bottom");

				var yAxis = d3.svg.axis()
				    .scale(y)
				    .orient("left");

				var line = d3.svg.line()
				    .interpolate("cardinal")
				    .x(function (d) {
				    return x(d.Date);
				})
				    .y(function (d) {
				    return y(d.Value);
				});

				var svg = d3.select(element[0].querySelector('.line-chart'))
					.append("svg")
				    .attr("width", width + margin.left + margin.right)
				    .attr("height", height + margin.top + margin.bottom)
				    .on("click", handleMouseOverSvg)
				    .append("g")
				    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

				scope.svg=svg;

				color.domain(data.map(function (d) { return d.name; }));
				if(time!=1){
					data.forEach(function (kv) {
					    kv.Data.forEach(function (d) {
					        d.Date = parseDate(d.Date);
					    });
					});

				}

				var languages = data;

				var minX = d3.min(data, function (kv) { return d3.min(kv.Data, function (d) { return d.Date; }) });
				var maxX = d3.max(data, function (kv) { return d3.max(kv.Data, function (d) { return d.Date; }) });
				var minY = d3.min(data, function (kv) { return d3.min(kv.Data, function (d) { return d.Value; }) });
				var maxY = d3.max(data, function (kv) { return d3.max(kv.Data, function (d) { return d.Value; }) });

				x.domain([minX,  parseDate('2015-08')]);
				y.domain([minY, maxY]);

				svg.append("g")
				    .attr("class", "x axis")
				    .attr("transform", "translate(0," + height + ")")
				    .call(xAxis)

				svg.append("g")
				    .attr("class", "y axis")
				    .call(yAxis)

				svg.append("g")
						.append("text")
						.style("text-anchor", "start")
						.attr('y', 8)
						.text("Post Count")
						.attr("font-size","12px")
						.attr("fill", "#999");

				var language = svg.selectAll(".language")
				    .data(languages)
				    .enter().append("g")
				    .attr("class", "language")
				    .attr("font-size","12px")
			    	    .attr("cursor","pointer")
				    .attr("fill", "rgba(255,255,255,0.7)")

				language.append("path")
				    .attr("class", "line")
				    .attr("d", function (d) {
				    return line(d.Data);
				})
				    .style("stroke", function (d) {
				    return color(d.name);
				})
					.on("mouseover", handleMouseOver)
          .style('opacity', 0.5)
					.on("mouseout", handleMouseOut)
					.on("click", handleMouseClick)
					.on("dblclick", dblclickHandler)
				;

				language.append("text")
					.attr("class", "language-text")
				    .datum(function (d) {
				    return {
				        name: d.name,
				        date: d.Data[d.Data.length - 1].Date,
				        value: d.Data[d.Data.length - 1].Value
				    };
				})
				    .attr("transform", function (d) {
				    return "translate(" + x(d.date) + "," + y(d.value) + ")";
				})
				    .attr("x", 3)
				    .attr("dy", ".35em")
				    .text(function (d) {
				        return d.name;
				})
				.style("fill", function (d) {
						 return color(d.name)
					 })
					.on("mouseover", handleMouseOver)
					.on("mouseout", handleMouseOut)
					.on("click", handleMouseClick)
					.on("dblclick", dblclickHandler)
				;

				scope.createThickNess=function(line, second, result){
						svg.selectAll(".related-srch")
					    .data(result)
					    .enter()
					    .append("circle")
					    .attr("class", "related-search")
						.attr("r", 2)
					    .attr("transform", function (d) {
					    	d.name=line
					    	YValue=getsingleY(d.bin, line)
					    	if(isNaN(YValue))
				    		{
				    			console.log(d.create_date);
				    			YValue=100
				    		}
						    return "translate(" + x(parseDate(d.bin)) + "," + y(YValue) + ")";
						})
						 .style("fill","black")

				}



				for( i in related){
					svg.selectAll(".circle")
				    .data(related[i].Data)
				    .enter()
				    .append("circle")
				    .attr("class", "circles")
					.attr("r", 3)
				    .attr("transform", function (d) {
				    	d.name=related[i].name
				    	YValue=getsingleY(d.create_date, related[i].name)
					    return "translate(" + x(parseDate(d.create_date)) + "," + y(YValue) + ")";
					})
					 .style("fill", function (d) {
						 return color(d.name)
					 })
					 .on("mouseover",handlemouseOverCircle)
					 .on("mouseout",handlemouseOutCircle)
					 .on("dblclick", dblclickHandlerCircle)
				}



				function handlemouseOverCircle(d) {
					$(".tooltip-title").text(d.tag);
					d3.select(this).select('circle').attr('stroke-width', 1)
					d3.select(".tooltip")
						.style("visibility", "visible")
						.style("top", (d3.event.pageY-10)+"px")
						.style("left",(d3.event.pageX+10)+"px");
					}

				function handlemouseOutCircle() {
					d3.select(this).select('circle').attr('stroke-width', 0.3)
					$(".tooltip-title").text("");
					d3.select(".tooltip")
					.style("visibility", "hidden");
				}

				function handleMouseClick(d){
					if(mouseClicked)
					{	mouseClicked=false;
						handleMouseOut(d);
						return false
					}
					mouseClicked=true;
					d3.selectAll(".language")
					.filter(function(values) { return values.name!=d.name; })
					.classed("fade", true);
					d3.selectAll(".circles")
					.filter(function(values) { return values.name!=d.name; })
					.classed("fade", true);
					return false;
				}

				function handleMouseOver(d) {
					var dots=d3.selectAll(".dot")
					if(!mouseClicked){
						dots.select("circle")
						   .classed("related-highlighted", false)
						   .classed("search-active",false);
						d3.selectAll(".language")
						.filter(function(values) { return values.name!=d.name; })
						.classed("fade", true);
					d3.selectAll(".circles")
						.filter(function(values) { return values.name!=d.name; })
						.classed("fade", true);

					dots.filter(function(dot) {
						if( dot.tags.indexOf(d.name) >= 0)
							return true;
						return false })
						.select("circle")
						.classed("related-highlighted", true)
						.classed("search-active",true);

					return false;

					}

				}
				function handleMouseOut(d) {
					var dots=d3.selectAll(".dot")
					if(!mouseClicked){
						d3.selectAll(".language")
						.classed("fade", false);
						d3.selectAll(".circles")
						.classed("fade", false);
						dots.select("circle")
						   .classed("related-highlighted", false)
						   .classed("search-active",false);
					return false;

					}

				}

				function dblclickHandler(d){
					scope.add({tag:d.name});
				}

				function dblclickHandlerCircle(d){
					scope.add({tag:d.tag});
				}



				function handleMouseOverSvg(e){
					if( d3.event.currentTarget==d3.event.srcElement){
						if(mouseClicked)
						{	mouseClicked=false;
							handleMouseOut(e);
							return false
						}
						if(clickCount%2==0){
							//scope.add({tag:d.name});
							d3.select(".ranks").remove();
							d3.select(".rankText").remove();
							d3.selectAll(".line")
							.classed("fade", true);
							d3.selectAll(".circles")
							.classed("fade", true);
							d3.selectAll(".language-text")
							.classed("fade", true);
							d3.selectAll(".line")
							.classed("fade", true);
							var x0 = x.invert(d3.mouse(this)[0]);
							var YValues=getY(x0);
							var values=YValues.lines;
							values.sort(function(a,b){return a.Value-b.Value})
							svg.append("line")
							.attr("class", "ranks")
						    .style("stroke", "gray")
						    .attr("x1", d3.mouse(this)[0])
						    .attr("y1", 0)
						    .attr("x2", d3.mouse(this)[0])
						    .attr("y2", height);
							var yLinear = d3.scale.linear()
						    .range([height, 0]).domain([0,values.length]);
							language.append("text")
							.attr("class", "rankText")
						    .data(values)
						    .attr("transform", function (d,i) {
							    return "translate(" + d3.mouse(this)[0] + "," + yLinear(i+1) + ")";
							})
							 .style("fill", function (d) {
								 return color(d.name)
							 })
							    .attr("x", 3)
							    .attr("dy", ".35em")
							    .text(function (d) {
							        return d.name;
							})
						}

					else{

						$(".rankText").remove()
						d3.selectAll(".line")
						.classed("fade", false);
						d3.selectAll(".circles")
						.classed("fade", false);
						d3.selectAll(".language-text")
						.classed("fade", false);
						//scope.add({tag:d.name});
						d3.select(".ranks").remove();

					}
					clickCount++;

					}

				}

				function getY(date){
					var a = {}
					a.lines = []
					a.max=0;
					a.min=100000;
					for(line in languages){

						var data = languages[line]

						for(datum in data.Data)
						{
							if(moment(data.Data[datum].Date).format("YYYY-MM") == moment(date).format("YYYY-MM"))
								{
								a.lines.push({"name":data.name,"Value":data.Data[datum].Value})
								if(data.Data[datum].Value>a.max)
									a.max=data.Data[datum].Value;
								if(data.Data[datum].Value<a.min)
									a.min=data.Data[datum].Value;

							}
						}
					}
					return a;
				}
				function getsingleY(date, name){
					for(line in languages){
						var data = languages[line]
						if(data.name==name){
							for(datum in data.Data)
							{
								if(moment(data.Data[datum].Date).format("YYYY-MM") == date)
									return data.Data[datum].Value}
							}
						}

				}


		}


	}
