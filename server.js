var express = require('express');
var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var swiss = require ('./lib/swisstourney.js');

var host = 'localhost';
    port = 8000;

var app = express();
app.use(morgan('dev'));
var session = require('express-session');
var cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser('12345-54321-67890-09876'));//secret key
app.use(session({   secret: 'winter is coming' ,
                    resave:'false',
                    saveUninitialized :'true',
                    cookie : 'maxAge: 1000*60*2'
                })
        );


app.post('/addPlayer',function(req,res,next){
    var tournament_id = req.body.t_id;
    var player_name = req.body.p_name;
    swiss.registerPlayer(player_name,tournament_id,function(error,x){
        if(error)
            res.end('Registration failure');
        else
            //res.end('Player registered successfully!!');
            res.render('addPlayer.ejs',{"t_id":tournament_id});
    })
})

app.get('/count',function(req,res,next){
    swiss.countPlayers(function(error,x){
        if(error)
            res.end('Error occured');
        else
            res.end('No. of player(s): '+x);
    })
})

app.delete('/delete',function(req,res,next){
    swiss.deletePlayers(function(error,x){
        if(error)
            res.end('Error occured');
        else
            res.end('deleted row(s) '+x);
    })
})

app.delete('/delete/:id',function(req,res,next){
    swiss.removePlayer(req.params.id,function(error,x){
        if(error)
            res.end('Error occured');
        else
            res.end('deleted row(s) '+x);
    })
})

// var app = express.Router();
// app.use(bodyParser.json());


// app.get('/',function(req,res,next){
//     res.end(200,{'Content-Type':'text/html'});
// })

app.post('/register',function(req,res,next){
    swiss.registerUser(req.body,function(error,x){
        if(error)
            res.end('Registration failure');
        else
            res.sendFile(path.join(__dirname + '/views/RelogIn.html'));
    })
})

app.post('/createTournament',checkSignIn,function(req,res,next){
    var user_id = req.session.user_id;
    var t_name = req.body.t_name;
    swiss.createTournament(user_id,t_name,function(error,x){
        if(error)
            res.end('Unsuccessfull');
        else
            res.sendFile(path.join(__dirname + '/views/recreateTournament.html'));

    })
})

app.get('/viewTournament',checkSignIn,function(req,res,next){
    var user_id = req.session.user_id;
    swiss.viewTournament(user_id,function(error,x){
        if(error)
            res.end('Unsuccessfull');
        else{
            res.render('viewTournament.ejs',{
                "data":x
            });
        }
    })
})

app.post('/individualTournament',checkSignIn,function(req,res,next){
    var tournament_id = req.body.t_id;
    res.render('tournamentMenu.ejs',{"t_id":tournament_id})
})

app.post('/Play',checkSignIn,function(req,res,next){
    var tournament_id = req.body.t_id;
    res.render('addPlayer.ejs',{"t_id":tournament_id});
})
app.post('/logIn',function(req,res,next){
    var user_name = req.body.user_name;
    var pswd = req.body.pswd;
    swiss.checkUser(user_name,pswd,function(error,result){
        if(error)
            res.end('Error occured');
        else if(pswd == result.password){
            req.session.user_id = result.id;
            res.redirect('/createTournament')
        }
        else
            res.sendFile(path.join(__dirname + '/views/relogIn.html'));
    })
})

app.post('/ExecuteRound',function(req,res,next){
    var t_id = req.body.t_id;
    var round = req.body.round;
    swiss.swissPairings(t_id,function(error, sp) {
        var arr = [];
        sp.forEach(function(pairing, index){
            if (Math.random() > 0.5) {
                swiss.reportMatch(t_id,round, pairing[0].id, pairing[1].id, function(){
                    if (index == sp.length - 1) {
                        swiss.playerStandings(t_id,function(error, x) {
                            if (error) {
                                res.end('error');
                            }
                            else {
                                //res.json(x);
                            }
                        });
                    }
                });
                arr.push(`${pairing[0].name} beats ${pairing[1].name}`);
                //res.json(`${pairing[0].name} beats ${pairing[1].name}`);
            }
            else {
                swiss.reportMatch(t_id, round, pairing[1].id, pairing[0].id, function(){
                    if (index == sp.length - 1) {
                        swiss.playerStandings(t_id,function(error, x) {
                            if (error) {
                                res.end('error');
                            }
                            else {
                                //res.json(x);
                            }
                        });
                    }
                });
                arr.push(`${pairing[1].name} beats ${pairing[0].name}`);
                //res.json(`${pairing[1].name} beats ${pairing[0].name}`);
            }
        });
        res.render('roundResults.ejs',{"data":arr,"t_id":t_id});
    });
})

app.post('/Execute',function(req,res,next){
    var tournament_id = req.body.t_id;
    res.render('executeRound.ejs',{"t_id":tournament_id})
});

app.post('/showStanding',function(req,res,next){
    var tournament_id = req.body.t_id;
    swiss.playerStandings(tournament_id,function(error,data){
        if(error)
            res.end('Error');
        else{
            //res.json(data);
            res.render('showStanding.ejs',{'data':data})
        }

    })
});

app.post('/getFixture',function(req,res,next){
    var tournament_id = req.body.t_id;
    swiss.swissPairings(tournament_id,function(error,data){
        if(error)
            res.end('Error');
        else{
            //res.json(data);
            res.render('getFixture.ejs',{'data':data})
        }

    })
});

app.post('/Players',function(req,res,next){
    var tournament_id = req.body.t_id;
    swiss.seePlayers(tournament_id,function(error,data){
        if(error)
            res.end('Error');
        else{
            //res.json(data);
            res.render('seePlayers.ejs',{'data':data})
        }

    })
});


app.get('/createTournament',checkSignIn,function(req,res,next){
    res.sendFile(path.join(__dirname + '/views/tournament.html'));
})
app.use('/',express.static(path.join(__dirname ,'/views')));
//app.use(express.static(__dirname + './controller'));

function checkSignIn(req, res, next){
    if(req.session.user_id){
        next();     //If session exists, proceed to page
    }
    else {
        res.status(404).send('You are not allowed to access')
    }
}
app.listen(port,host,function(){
    console.log('Server is running');
})
