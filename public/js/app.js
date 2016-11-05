(function() {
	var app = angular.module('counsl', []);
	var data = [];
	var register = false;	

	app.controller('homeController', ['$scope','$http','$window', function($scope,$http,$window) {
		$scope.homeTxt = "Login";
		
		$scope.status = "Submit";
		$scope.success = false;
		$scope.auth = {
			username: "",
			password: "",
		};
		var subData = $.param({
			username: $scope.auth.username,
			password: $scope.auth.password
		});

		$scope.register = false;
		
		this.registerOn = function() {
			$scope.homeTxt = "Register";
			$scope.register = true;
		}
		this.loginOn = function() {
			$scope.homeTxt = "Login";
			$scope.register = false;
		}
		this.submitForm = function() {
			$scope.status = "Submitting...";
			
			if(!$scope.register){
				$http.post('/auth', $scope.auth).
				success(function(data, status) {
					if (data.success == true) {
						$scope.status = "Submit";
						$scope.success = true;
						$window.location.reload();
					} else {
						$scope.status = "Try Again";
						console.log(data);
					}
				}).error(function(data, status, headers, config) {
					$scope.status = "Try Again";
					console.log(data);
	
				});
			} else if($scope.register){
				$http.post('/register', $scope.auth).
				success(function(data, status) {
					if (data.success == true) {
						$scope.status = "Submit";
						$scope.success = true;
						$window.location.reload();
					} else {
						$scope.status = "Try Again";
						console.log(data);
					}
				}).error(function(data, status, headers, config) {
					$scope.status = "Try Again";
					console.log(data);
				});
			}
		}
	}]);
	
	app.controller('formController', ['$scope', '$http', '$window', function($scope, $http, $window) {
		$scope.status = "Submit";
		$scope.success = false;
		$scope.auth = {
			username: "",
			password: "",
		};
		var subData = $.param({
			username: $scope.auth.username,
			password: $scope.auth.password
		});
	
		
		this.submitForm = function() {
			$scope.status = "Submitting...";
			
			if(!$('#homeTxt').html == "Register"){
				$http.post('/auth', $scope.auth).
				success(function(data, status) {
					if (data.success == true) {
						$scope.status = "Submit";
						$scope.success = true;
						$window.location.reload();
					} else {
						$scope.status = "Try Again";
						console.log(data);
					}
				}).error(function(data, status, headers, config) {
					$scope.status = "Try Again";
					console.log(data);
	
				});
			} else {
				$http.post('/register', $scope.auth).
				success(function(data, status) {
					if (data.success == true) {
						$scope.status = "Submit";
						$scope.success = true;
						$window.location.reload();
					} else {
						$scope.status = "Try Again";
						console.log(data);
					}
				}).error(function(data, status, headers, config) {
					$scope.status = "Try Again";
					console.log(data);
				});
			}
		};
	}]);

	
	function sortByKey(array, key) {
	    return array.sort(function(a, b) {
	        var x = a[key]; var y = b[key];
	        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	    });
	}
	
})();