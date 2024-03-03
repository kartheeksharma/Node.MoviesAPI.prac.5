const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3001, () => {
      console.log("Server running at http://localhost:3001/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertMovieDetails = (dbObj) => {
  return {
    movieName: dbObj.movie_name,
  };
};

//1.List of all movies
app.get("/movies/", async (request, response) => {
  const moviesQuery = `SELECT movie_name FROM 
                        movie;`;
  const moviesArray = await db.all(moviesQuery);
  response.send(moviesArray.map((moviename) => convertMovieDetails(moviename)));
});

//2.Adds new movie in movie table
app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `INSERT INTO movie(director_id,movie_name,lead_actor)
                            VALUES(${directorId}, '${movieName}', '${leadActor}');`;
  const newMovieResponse = await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

//3
const convertMovieObjToResponseObj = (dbObj) => {
  return {
    movieId: dbObj.movie_id,
    directorId: dbObj.director_id,
    movieName: dbObj.movie_name,
    leadActor: dbObj.lead_actor,
  };
};
//3.Movie based on movieId
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieIdQuery = `SELECT *FROM movie
                            WHERE movie_id= ${movieId};`;
  const movieResponse = await db.get(movieIdQuery);
  //console.log(movieId);
  response.send(convertMovieObjToResponseObj(movieResponse));
});

//4.Updates Details of movie in movie table
app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `UPDATE movie
                                SET
                                director_id=${directorId},
                                movie_name='${movieName}',
                                lead_actor='${leadActor}'
                                WHERE movie_id= ${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//5.Deletes movie from movie table
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const delMovieQuery = `DELETE FROM movie
                            WHERE movie_id= ${movieId};`;
  await db.run(delMovieQuery);
  response.send("Movie Removed");
});
//6
const convertDiretorDetails = (dbObj) => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.director_name,
  };
};

//6.List of diretors in director table
app.get("/directors/", async (request, response) => {
  const directorsQuery = `SELECT *FROM director;`;
  const directorsArray = await db.all(directorsQuery);
  response.send(
    directorsArray.map((director) => convertDiretorDetails(director))
  );
});

//7
const convertMovieNameDetails = (dbObj) => {
  return {
    movieName: dbObj.movie_name,
  };
};
//7.List of all movie names directed by specific director
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const direcMovieQuery = `SELECT movie_name FROM 
                                 director INNER JOIN movie 
                                 ON director.director_id = movie.director_id
                                 WHERE
                                 director.director_id=${directorId};`;
  const movies = await db.all(direcMovieQuery);
  //console.log(directorId);
  response.send(
    movies.map((movienames) => convertMovieNameDetails(movienames))
  );
});

module.exports = app;
