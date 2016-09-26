var module = angular.module('myApp', ['gridster']);
module.config(function($interpolateProvider) {
	  $interpolateProvider.startSymbol('[[');
	  $interpolateProvider.endSymbol(']]');
	});

//$(function(){
//	$('#submitButton').on('click', function () {
//			$.ajax({
//	            type: 'GET',
//	            url: '/data/get-info',
//	            data: {"year":"2010"},
//	        }).done(function(data, textStatus, jqXHR){
//	            console.log(JSON.parse(data))
//	        }).fail(function(data){
//	        	console.log("Something went wrong..");
//	        });
//		});
//});