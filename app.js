var express = require('express')
  , app = express()
  , http = require('http')
  , bodyParser = require('body-parser')
  , firebase = require('firebase')	
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , fs = require("fs")
  , uuid = require('uuid')
  , gravatar = require('gravatar');

var path = require('path').dirname(require.main.filename);
var publicPath = path + "/public/";

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


    
    var type = req.body.type;
    var id = req.body.id;

    //console.log(email);
    //console.log(password);
    console.log(type);

    var user = req.body;

    if(type.localeCompare('counselor')){
    	user.img = gravatar.url("nisargkolhe@gmail.com", {s: '200', r: 'pg', d: '404'});
    }

    firebase.database().ref("users").child(id).set(user);
   
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
  res.sendfile(__dirname + '/public/');
});
app.get('/clogin', function (req, res) {
  res.sendfile(__dirname + '/public/clogin.html');
});
app.get('/dash', function (req, res) {
  res.sendfile(__dirname + '/public/dash.html');
});
app.get('/css/:file', function (req, res) { sendFolder("css",req,res); });
app.get('/images/:file', function (req, res) { sendFolder("images",req,res); });
app.get('/js/:file', function (req, res) { sendFolder("js",req,res); });

function sendFolder(folder,req,res)
{
  var fileId = req.params.file;
  var file = publicPath + folder + "/" + fileId;
  if(fs.existsSync(file))
  {
    res.sendFile(file);
  }
  else {
    res.send("404 not found.");
  }
}


// usernames which are currently connected to the chat
//var usernames = {};


io.sockets.on('connection', function (socket) {
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username,room){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = room;
		// add the client's username to the global list
		var usernames = [];
		var usersRef = firebase.database().ref("rooms").child(name).child("users");
		usersRef.once("value", function(snapshot) {
        
        	usernames = snapshot.val();
        	usernames[usernames.length] = username;
    	});
    	firebase.database().ref("rooms").child(name).child("users").set(usernames);
		// send client to room 1
		socket.join(room);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to ' + room);
		// echo to room 1 that a person has connected to their room
		var rooms;
		ref("rooms").once("value", function(snapshot) {
        	rooms = snapshot.val();
    	});
		socket.broadcast.to(room).emit('updatechat', 'SERVER', username + ' has connected to this room');
		socket.emit('updaterooms', rooms, room);
	});
	
	socket.on('addroom', function(obj){
		
		var room = {
			"name" : obj.name,
			"psychId" : obj.id,
			//"counselorName": obj.counselorName,
			"roomId" : uuid.v1(),
			"users" : [],
			"messages" : []
		}
		//var rooms;
		/*firebase.database().ref("rooms").once("value", function(snapshot) {
        	rooms = snapshot.val();
    	});*/
		//socket.psychId = psychId;
		//socket.name = name;
		console.log(room.name);
		firebase.database().ref("rooms").child(obj.name).set(room);
		

	});

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data,room) {
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
		//delete usernames[socket.username];
		// update list of users in chat, client-side
		//io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
console.log("magic happens at 8080");
exports = module.exports = app;