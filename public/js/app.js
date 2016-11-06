(function() {
    var app = angular.module('counsl', ['firebase', 'angular-md5']);
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
                            uid: firebaseUser.uid,
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

    app.controller('DashController', ['$scope', '$http', '$window', '$firebaseAuth', '$firebaseArray', '$firebaseObject', 'Auth', 'socket', 'md5', function($scope, $http, $window, $firebaseAuth, $firebaseArray, $firebaseObject, Auth, socket, md5) {
        $scope.screen = 0;
        $scope.auth = Auth;
        $scope.fullname = "";
        $scope.joinedRooms;

        $scope.locationRadius = 20;

        $scope.lat;
        $scope.lon;
        navigator.geolocation.getCurrentPosition(function(location) {
            $scope.lat = location.coords.latitude;
            $scope.lon = location.coords.longitude;
        });

        $scope.counselor = false;

        var ref = firebase.database().ref().child("rooms");
        $scope.rooms = $firebaseArray(ref);

        var authData = $scope.auth.$onAuthStateChanged(function(firebaseUser) {
            if (firebaseUser) {
                var jRef = firebase.database().ref().child("users").child(firebaseUser.uid);
                $scope.joinedRooms = $firebaseArray(jRef.child("rooms"));
                $scope.fullname = firebaseUser.email;

                $scope.user = $firebaseObject(jRef);
                $scope.user.$loaded()
                    .then(function(data) {
                        console.log($scope.user.type);
                        var type = $scope.user.type;
                        if (type == 'counselor') {
                            $scope.counselor = true;
                        }
                    });

                console.log(firebaseUser);
            } else {
                console.log("Signed out");
            }
        });

        if (authData) {
            console.log("Logged in as:", authData.uid);

        } else {
            console.log("Logged out");
        }

        this.getHash = function(s) {
            return md5.createHash(s);
        };

        this.createChat = function() {
            var firebaseUser = $scope.auth.$getAuth();

            if (firebaseUser) {
                console.log("Signed in as:", firebaseUser.email);

                var userRef = firebase.database().ref().child("users").child(firebaseUser.uid);
                $scope.user = $firebaseObject(userRef);

                $scope.user.$loaded()
                    .then(function(data) {
                        console.log($scope.user.name);
                        var obj = {
                            "id": firebaseUser.uid,
                            "name": prompt("Enter name for chatroom"),
                            "counselorName": $scope.user.name,
                            "counselorEmail": $scope.user.email,
                            "lat": $scope.lat,
                            "lon": $scope.lon
                        };
                        socket.emit("addroom", obj);



                    })
                    .catch(function(error) {
                        console.error("Error:", error);
                    });



            } else {
                console.log("Signed out");
            }
        };

        this.joinChat = function(roomId) {
            var firebaseUser = $scope.auth.$getAuth();

            if (firebaseUser) {
                console.log("Signed in as:", firebaseUser.email);



                var roomRef = firebase.database().ref().child("rooms").child(roomId);
                $scope.room = $firebaseObject(roomRef);

                $scope.room.$loaded()
                    .then(function(data) {
                        var obj = {
                            "userId": firebaseUser.uid,
                            "room": {
                                "name": data.name,
                                "counselorName": data.counselorName,
                                "counselorEmail": data.counselorEmail,
                                "roomId": roomId
                            },
                        };
                        socket.emit("adduser", obj);
                    })
                    .catch(function(error) {
                        console.error("Error:", error);
                    });


            } else {
                console.log("Signed out");
            }
        };

        this.getDistance = function(lat, lon) {
            if (!lat || !lon)
                return "Not available";
            var d = 0;
            //var from = new google.maps.LatLng(location.coords.latitude, location.coords.longitude);
            //var to   = new google.maps.LatLng(lat, lon);
            //var dist = google.maps.geometry.spherical.computeDistanceBetween(from, to);
            var toRad = function(degrees) {
                return degrees * Math.PI / 180;
            }

            var R = 6371; // km
            var dLat = toRad(lat - $scope.lat);
            var dLon = toRad($scope.lon - lon);
            var lat1 = toRad(lat);
            var lat2 = toRad($scope.lat);

            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            var d = Math.round(R * c);
            console.log(d);
            return d;
        }
    }]);

    app.controller('ChatController', ['$scope', '$http', '$location', '$firebaseArray', '$firebaseObject', 'Auth', 'socket', 'md5', function($scope, $http, $location, $firebaseArray, $firebaseObject, Auth, socket, md5) {
        var url = $location.absUrl();
        var roomId = url.substring(url.indexOf("/chat/") + 6);
        $scope.auth = Auth;

        var ref = firebase.database().ref().child("rooms").child(roomId);
        $scope.roomObj = $firebaseObject(ref);
        $scope.messages = $firebaseArray(ref.child("messages"));
        $scope.fullname;
        var authData = $scope.auth.$onAuthStateChanged(function(firebaseUser) {
            if (firebaseUser) {
                var jRef = firebase.database().ref().child("users").child(firebaseUser.uid);
                $scope.joinedRooms = $firebaseArray(jRef.child("rooms"));
                $scope.fullname = firebaseUser.email;
            }
        });

        $scope.msgTxt = "";

        this.sendMsg = function() {
            var firebaseUser = $scope.auth.$getAuth();

            if (firebaseUser) {
                var firebaseUser = $scope.auth.$getAuth();




                var userRef = firebase.database().ref().child("users").child(firebaseUser.uid);
                $scope.user = $firebaseObject(userRef);

                $scope.user.$loaded()
                    .then(function(data) {
                        var msgObject = {
                            roomId: roomId,
                            msg: {
                                time: Date.now(),
                                type: "message",
                                message: $scope.msgTxt,
                                user: firebaseUser.uid,
                                email: data.email,
                                name: data.name
                            }
                        }
                        socket.emit("sendchat", msgObject);
                        $scope.msgTxt = "";
                    })
                    .catch(function(error) {
                        console.error("Error:", error);
                    });



            }
        };

        this.getHash = function(s) {
            return md5.createHash(s);
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
