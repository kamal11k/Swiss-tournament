/*
Adds a player to the tournament by putting an entry in the database.
The database should assign an ID number to the player. Different players may
have the same names but will receive different ID numbers.
*/
function registerPlayer(connection, name) {
	connection.query('insert into player(name) values(?)', name, function (error, results, fields) {
		if (error) throw error;
		console.log('Record inserted successfully: ', results.affectedRows);
	});
}
/*
Returns the number of currently registered players.
This function should not use the Python len() function;
it should have the database count the players.

*/
function countPlayers(connection) {
	connection.query('select count(*) as num_players from player', function (error, results, fields) {
		if (error) throw error;
		console.log('Total number of players in tournament:', results[0].num_players);
	});
}

/*
Clear out all the player records from the database.
*/
function deletePlayers(connection) {
	connection.query('truncate player', function (error, results, fields) {
		if (error) throw error;
		console.log('All player records deleted');
	});
}

/*
Stores the outcome of a single match between two players in the database.
*/
function reportMatch(connection, match_id, winner_id, loser_id) {

}

/*
Clear out all the match records from the database.
*/
function deleteMatches() {
	connection.query('truncate matches', function (error, results, fields) {
		if (error) throw error;
		console.log('All match records deleted');
	});
}

/*
Returns a list of (id, name, wins, matches) for each player, sorted by the number of wins each player has.
*/
function playerStandings(connection) {
	//lets prepare this table in memory for now
	var player_map = {}
	connection.query('select * from players', function(error, results, fields){
		if (error) throw error;
		var stats_table = {};
		for (var result of results) {
			player_map[result.id] = result.name;
		}
		connection.query('select * from game', function (error, results, fields) {
			if (error) throw error;
			for (var result of results) {
				if (result.winner_id in stats_table) {
					var stats = stats_table[winner_id];
					stats.matches = stats.matches + 1;
					stats.wins = stats.wins + 1 ;
				}
				else {
					var stats = {wins: 0, matches: 0, player_id:result.winner_id, name: player_map[winner_id]};
					stats_table[winner_id] = stats;
				}
				if (result.loser_id in stats_table) {
					var stats = stats_table[loser_id];
					stats.matches = stats.matches + 1;
				}
				else {
					var stats = {wins: 0, matches: 0, player_id:result.loser_id, name: player_map[winner_id]};
					stats_table[loser_id] = stats;
				}

			}
			var stats_array = []
			for (var player_id of stats_table) {
				stats_array.push[stats_table[player_id]]
			}
			stats_array.sort(function(a, b) {
				return a.wins - b.wins;
			})
			stats_array.forEach(function(elem) {
				console.log(elem.player_id, elem.name, elem.wins, elem.matches)
			})
		});

	})

}

/*
Given the existing set of registered players and the matches they have played,
generates and returns a list of pairings according to the Swiss system.
Each pairing is a tuple (id1, name1, id2, name2), giving the ID and name of the paired players.
For instance, if there are eight registered players, this function should return four pairings.
This function should use playerStandings to find the ranking of players.
*/
function swissPairings() {

}

module.exports = {
	registerPlayer: registerPlayer,
	countPlayers: countPlayers,
	deletePlayers: deletePlayers,
	deleteMatches: deleteMatches,
	swissPairings: swissPairings,
	reportMatch: reportMatch,
	playerStandings: playerStandings
}
