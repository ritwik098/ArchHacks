var express = require('express')
  , app = express()
  , http = require('http')
  , bodyParser = require('body-parser')
  , firebase = require('firebase')	
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);

require('firebase/auth');
require('firebase/database');
server.listen(8080);

app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));


firebase.initializeApp({
  databaseURL: "https://counsl-dd6fe.firebaseio.com",
  serviceAccount: "counsl-dd6fe-firebase-adminsdk-bdz8g-54f3eb9f39.json",
  apiKey: "AIzaSyCN_z36yq6gMeEqjmSVjkNGNrtI_ClCv_s",
authDomain: "counsl-dd6fe.firebaseapp.com",
	    storageBucket: "counsl-dd6fe.appspot.com",
	    messagingSenderId: "456446067935"
});


var db = firebase.database();
var ref = db.ref();
ref.once("value", function(snapshot) {
 console.log(snapshot.val());
});

/*var tokenGenerator = new FirebaseTokenGenerator("mXpMJYiopVqgvmZTWRsMAtJYZwzXM4mMfCZ2WSRp");
var token = tokenGenerator.createToken(
   {uid: "my-awesome-server"}, 
   { expires:100000 });

var ref = new firebase("https://counsl-dd6fe.firebaseio.com/");
ref.authWithCustomToken(token, function(error, authData) {
  if(!error)
  	console.log(authData);
  else
  	console.log(error);
});
*/



app.post('/register',function(req,res){


	var email = req.body.email;
	var password = req.body.password;
	var type = req.body.type;

	console.log(email);
	console.log(password);
	console.log(type);
/*

	firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
	 	 // Handle Errors here.
	  	var errorCode = error.code;
	    var errorMessage = error.message;

	 	console.log(errorCode + ": " +errorMessage);
	});

*/
	
	firebase.database().ref('users').push({
  	    email: email,
    	password : password,
   		type: type
    });
	console.log("Success");

    ref.once("value", function(snapshot) {
 		res.send("SUCCESS");
 		console.log(snapshot.val());
	});

});

app.post('/login',function(req,res){


	var email = "" + req.body.email;
	console.log("email: "+ email);
	var password = req.body.password;
	var type = req.body.type;

	//var loginObjects;
	ref.once("value", function(snapshot) {
 		
 		//loginObjects = snapshot.val();
 		snapshot.forEach(function(user){
			user.forEach(function(users){
				var ab = ""+ user.val().email;
				console.log("email : "+email);
				if(email.localeCompare(ab)){
					console.log("LOGIN SUCCESS");
				} else{
					console.log("wtf");
				}
				//res.send(users.val().email + '\n' + email);
				console.log("BREAK");
			});
			
	});
	});



});

// routing
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['room1','room2','room3'];

io.sockets.on('connection', function (socket) {
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'room1';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('room1');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to room1');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('room1').emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, 'room1');
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		socket.emit('updaterooms', rooms, newroom);
	});
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
console.log("magic happens at 8080");
exports = module.exports = app;