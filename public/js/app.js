(function() {
    var app = angular.module('counsl', ['firebase']);
    var data = [];
    var register = false;

    app.factory('socket', function($rootScope) {
        var socket = io.connect();
        return {
            on: function(eventName, callback) {
                socket.on(eventName, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        callback.apply(socket, args);
                    });
                });
            },
            emit: function(eventName, data, callback) {
                socket.emit(eventName, data, function() {
                    var args = arguments;
                    $rootScope.$apply(function() {
                        if (callback) {
                            callback.apply(socket, args);
                        }
                    });
                })
            }
        };
    });

    app.factory("Auth", ["$firebaseAuth",
        function($firebaseAuth) {
            return $firebaseAuth();
        }
    ]);


    app.config(function() {
        var config = {
            databaseURL: "https://counsl-dd6fe.firebaseio.com",
            //serviceAccount: "counsl-dd6fe-firebase-adminsdk-bdz8g-54f3eb9f39.json",
            apiKey: "AIzaSyCN_z36yq6gMeEqjmSVjkNGNrtI_ClCv_s",
            authDomain: "counsl-dd6fe.firebaseapp.com",
            storageBucket: "counsl-dd6fe.appspot.com"
                //messagingSenderId: "456446067935"  // Your Firebase Storage bucket ("*.appspot.com")
        };
        firebase.initializeApp(config);
    });

    app.controller('homeController', ['$scope', '$http', '$window', '$firebaseAuth', function($scope, $http, $window, $firebaseAuth, $firebaseObject, $firebaseArray) {
        var FIREBASE_APP_URL = 'counsl-dd6fe.firebaseapp.com'
        var firebaseRef = firebase.database().ref();
        $scope.authObj = $firebaseAuth();
        $scope.homeTxt = "Login";
        $scope.status = "Submit";
        $scope.success = false;
        $scope.auth = {
            email: "",
            password: "",
            type: "",
            fullname: ""
        };

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

            if (!$scope.register) {
                $scope.authObj.$signInWithEmailAndPassword($scope.auth.email, $scope.auth.password).then(function(firebaseUser) {
                    console.log("Signed in as:", firebaseUser.uid);
                    $scope.status = "Submit";
                    $scope.success = true;

                    $window.location.href = '/dash';

                }).catch(function(error) {
                    $scope.status = "Try Again";
                    console.error("Authentication failed:", error);
                });
            } else if ($scope.register) {
                $scope.authObj.$createUserWithEmailAndPassword($scope.auth.email, $scope.auth.password)
                    .then(function(firebaseUser) {
                        $scope.status = "Registration Successful";
                        $scope.success = true;

                        var user = {
                        	email: $scope.auth.email, 
                            type: $scope.auth.type,
                            name: $scope.auth.fullname
                        };

                        firebaseRef.child("users").child(firebaseUser.uid).set(user);

                        console.log("User " + firebaseUser.uid + " created successfully!");
                    }).catch(function(error) {
                        $scope.status = "Try Again";
                        console.error("Error: ", error);
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

            if (!$('#homeTxt').html == "Register") {
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

    app.controller('DashController', ['$scope', '$http', '$window', '$firebaseArray', 'Auth', 'socket', function($scope, $http, $window, $firebaseArray, Auth, socket) {
        $scope.screen = 0;
        $scope.auth = Auth;

        var ref = firebase.database().ref().child("rooms");
        $scope.rooms = $firebaseArray(ref);

        this.createChat = function() {
            var firebaseUser = $scope.auth.$getAuth();

            if (firebaseUser) {
                console.log("Signed in as:", firebaseUser.email);

                var ref = firebase.database().ref().child("users");
        		$scope.users = $firebaseArray(ref);

        		$scope.users.forEach(function(element) {
				    console.log(element);
				});

                var obj = {
                    "id": firebaseUser.uid,
                    "name": prompt("Enter name for chatroom")
                   // "counselorName": firebaseUser.name
                };
                socket.emit("addroom", obj);
            } else {
                console.log("Signed out");
            }
        };
    }]);

    function sortByKey(array, key) {
        return array.sort(function(a, b) {
            var x = a[key];
            var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

})();
