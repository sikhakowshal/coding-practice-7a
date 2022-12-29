const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (err) {
    console.log(`DB Error : ${err.message}`);
    program.exit(1);
  }
};
initializeDbAndServer();

//API TO GET ALL PLAYERS FROM PLAYER_DETAILS TABLE
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
        SELECT *
        FROM player_details;
    `;
  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  };
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API TO GET PLAYER BASED ON PLAYER_ID FROM PLAYER_DETAILS TABLE
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
        SELECT *
        FROM player_details
        WHERE player_id  = ${playerId};
    `;
  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  };
  const playerArray = await db.get(getPlayerQuery);
  response.send(convertDbObjectToResponseObject(playerArray));
});

//API TO UPDATE PLAYER_NAME FROM PLAYER_DETAILS TABLE
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
        UPDATE player_details
        SET player_name = '${playerName}'
        WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API TO GET MATCH DETAILS OF A SPECIFIC MATCH FROM MATCH_DETAILS TABLE
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
        SELECT *
        FROM match_details
        WHERE match_id = ${matchId};
    `;
  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    };
  };
  const matchArray = await db.get(getMatchDetails);
  response.send(convertDbObjectToResponseObject(matchArray));
});

//API TO GET ALL MATCHES OF A PLAYER
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesDetails = `
        SELECT 
          match_details.match_id, 
          match_details.match,
          match_details.year
        FROM match_details NATURAL JOIN player_match_score
        WHERE player_match_score.player_id = ${playerId};
    `;
  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    };
  };
  const playerMatchesArray = await db.all(getPlayerMatchesDetails);
  response.send(
    playerMatchesArray.map((eachPlayerMatch) =>
      convertDbObjectToResponseObject(eachPlayerMatch)
    )
  );
});

//API TO GET LIST OF PLAYERS OF A SPECIFIC MATCH
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfAMatchArrayQuery = `
        SELECT player_id, player_name
        FROM player_details NATURAL JOIN player_match_score
        WHERE match_id =  ${matchId};
    `;
  const convertDbObjectToResponseObject = (dbObject) => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  };
  const playersOfMatchArray = await db.all(getPlayersOfAMatchArrayQuery);
  response.send(
    playersOfMatchArray.map((eachArray) =>
      convertDbObjectToResponseObject(eachArray)
    )
  );
});

//API TO GET STATS OF A PLAYER BASED ON PLAYER_ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `
        SELECT 
          player_details.player_id,
          player_details.player_name,
          SUM(player_match_score.score) AS total_score,
          SUM(player_match_score.fours) AS total_fours,
          SUM(player_match_score.sixes) AS total_sixes
        FROM player_details NATURAL JOIN player_match_score
        GROUP BY player_id
        HAVING player_id = ${playerId};
    `;
  const convertDBObjectToResponseObject = (dbObject) => {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
      totalScore: dbObject.total_score,
      totalFours: dbObject.total_fours,
      totalSixes: dbObject.total_sixes,
    };
  };
  const playerStatsArray = await db.get(getPlayerStatsQuery);
  response.send(convertDBObjectToResponseObject(playerStatsArray));
});

module.exports = app;
