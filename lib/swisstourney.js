var mysql = require('mysql');
var Game = require('./tournament_lib.js').Game;
var Tournament = require('./tournament_lib.js').Tournament;
/*
Adds a player to the tournament by putting an entry in the database.
The database should assign an ID number to the player. Different players may
have the same names but will receive different ID numbers.
*/
function get_connection() {
	var connection = mysql.createConnection({
	  host     : 'localhost',
	  user     : 'root',
	  password : 'mountblue',
	  database : 'swiss_tournament'
	});
	connection.connect();
	return connection
}

function registerPlayer(name,t_id, cb) {
	var connection = get_connection();
	var query = 'insert into player(name,tournament_id) values(?,?)';
	connection.query(query, [name,t_id] ,function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		cb(null, results);
	});
}
/*
Returns the number of currently registered players.

*/
function countPlayers(cb){
	var connection = get_connection();
	connection.query('select count(*) as total_num from player', function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		cb(null, results[0].total_num);
	});
}

/*
Clear out all the player records from the database.
*/
function deletePlayers(cb) {
	var connection = get_connection();
	connection.query('delete from player', function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		cb(null, results.affectedRows);
	});
}

//Reomves a single player from player table.
function removePlayer(id,cb){
	var connection = get_connection();
	var query = 'delete from player where player.id = ?';
	connection.query(query,id,function(error, results, fields){
		if(error)
			cb(error, 0);
		else
			cb(null,results.affectedRows);
	});
}

function registerUser(user, cb) {
	var connection = get_connection();
	query = 'insert into user(name,user_name,password) values(?,?,?)';
	connection.query(query, [user.name,user.user_name,user.pswd], function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		cb(null, results);
	});
}

function createTournament(user_name,t_name,cb) {
	var connection = get_connection();
	query = 'insert into tournament(user_name,name) values(?,?)';
	connection.query(query, [user_name,t_name], function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		cb(null, results);
	});
}

function viewTournament(user_name,cb) {
	var connection = get_connection();
	var query = 'select  id,name from tournament where user_name=?';
	connection.query(query, [user_name], function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		cb(null, results);
	});
}



/*
Stores the outcome of a single match between two players in the database.
*/
function reportMatch(round, winner_id, loser_id, cb) {
	buildTournament(function(error, tournament){
		var connection = get_connection();
		if (tournament.hasPlayedInRound(winner_id, loser_id, round)) {
			throw `Player ${winner_id} has already played with player ${loser_id} in round ${round}`;
		}
		else {
			var query = `
			insert into game(player1_id, player2_id, round, winner_id, loser_id)
			values(?,?,?,?,?)
			`
			connection.query(query, [winner_id, loser_id, round, winner_id, loser_id],
				function (error, results, fields) {
					connection.end();
					if (error) {
						cb(error, 0);
					}
					cb(null, results.affectedRows);
				});
		}
	});
}

/*
Clear out all the match records from the database.
*/
function deleteMatches(cb) {
	var connection = get_connection();
	connection.query('delete from game', function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		cb(null, results.affectedRows);
	});
}

/*
Returns a list of (id, name, wins, matches) for each player, sorted by the number of wins each player has.
*/
function playerStandings(t_id,cb) {
	var connection = get_connection();
	var query = `
		select p.id, p.name, ifnull(ws.wins, 0) as wins,
		       (ifnull(ws.wins,0) + ifnull(ls.losses,0)) as games_played
		from
			(select * from player where player.tournament_id = ?) as p
			left outer join
			((select tournament_id,winner_id, count(*) as wins from game group by winner_id) as ws)
				on (p.id = ws.winner_id)
			left outer join
			((select tournament_id,loser_id, count(*) as losses from game group by loser_id) as ls)
				on (p.id = ls.loser_id)
		order by
		wins desc;`

	connection.query(query,t_id, function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		var out = [];
		console.log(results);
		for (var result of results) {
			out.push({
				id: result.id,
				name: result.name,
				wins: result.wins,
				matches: result.games_played
			})
		}
		cb(null, out);
	});
}

function checkUser(user_name,pswd,cb){
	var connection = get_connection();
	var query = "select * from user where user_name=?";
	connection.query(query,user_name,function(error, results){
		if(error)
			cb(error,null);
		else
			cb(null,results[0]);
	})
}

function buildTournament(cb) {
	var connection = get_connection();
	connection.query('select * from game', function (error, results, fields) {
		connection.end();
		if (error) {
			cb(error, 0);
		}
		var t = new Tournament();
		for (var result of results) {
			var g = new Game(result.player1_id, result.player2_id,
				result.winner_id, result.loser_id, result.round);
			t.addGame(g);
		}
		cb(null, t);
	});
}


/*
Given the existing set of registered players and the matches they have played,
generates and returns a list of pairings according to the Swiss system.
Each pairing is a tuple (id1, name1, id2, name2), giving the ID and name of the paired players.
For instance, if there are eight registered players, this function should return four pairings.
This function should use playerStandings to find the ranking of players.
*/

function getNextPair(playerStandings, tournament) {
	var first = playerStandings.splice(0,1)[0];
	for (var i=0; i<playerStandings.length; i++) {
		if (!tournament.hasPlayed(first.id, playerStandings[i].id)) {
			var second = playerStandings.splice(i,1)[0];
			return [first, second];
		}
	}
	throw 'Swiss pairing algorith failed';
}

function swissPairings(cb) {
	playerStandings(function(error, playerStandings) {
		if (error) {
			throw error;
		}
		else {
			pairings = [];
			buildTournament(function(error, tournament){
				while (playerStandings.length > 0) {
					pairings.push(getNextPair(playerStandings, tournament));
				}
				cb(null, pairings);
			});
		}
	})
}

module.exports = {
	registerPlayer: registerPlayer,
	registerUser: registerUser,
	removePlayer: removePlayer,
	countPlayers: countPlayers,
	deletePlayers: deletePlayers,
	deleteMatches: deleteMatches,
	swissPairings: swissPairings,
	reportMatch: reportMatch,
	playerStandings: playerStandings,
	checkUser: checkUser,
	createTournament: createTournament,
	viewTournament: viewTournament
}