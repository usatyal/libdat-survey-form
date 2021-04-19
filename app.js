// app.js
require('dotenv').config()
let express = require('express')
let app = express()
let bodyParser = require('body-parser')
const path = require('path')

// static files
var assetsPath = path.join(__dirname, 'public');
app.use(express.static(assetsPath));

// mysql connection
var mysql = require('mysql')

var con = mysql.createConnection({
  host     : process.env.RDS_HOSTNAME,
  user     : process.env.RDS_USERNAME,
  password : process.env.RDS_PASSWORD,
  port     : process.env.RDS_PORT,
  database : process.env.RDS_DB_NAME
})

con.connect(function(err) {
  if (err) {
    // console.error('error connecting: ' + err.stack);
    return;
  }
 
  // console.log('connected as id ' + con.threadId);
});

// load books
const BOOKLIST_FOR_SEARCH = require('./public/names.js')
const booklist_for_search = BOOKLIST_FOR_SEARCH.booklist_for_search 

// to use jquery in node
var jsdom = require('jsdom')
const { JSDOM } = jsdom
const { window } = new JSDOM()
const { document } = (new JSDOM('')).window
global.document = document

var $ = jQuery = require('jquery')(window)

// configure bodyparser to handle post request
app.use(bodyParser.urlencoded({
	extended: true
}))
app.use(bodyParser.json())

// port
let port = process.env.PORT || 3030

// tag survey page
app.get('/booksurvey', function(req, res) {
    res.sendFile(path.join(__dirname, "/survey.html"))
})

// movie survey page
app.get('/moviesurvey', function(req, res) {
    res.sendFile(path.join(__dirname, "/moviesurvey.html"))
})


// survery book search
app.post('/searchBookFromTerm', function(req, res){
  const obj = req.body
  const searchTerm = obj.searchTerm
  var keywordIndex
  var resultBookList = []

  $.each(booklist_for_search, function(i) {
    var rSearchTerm = new RegExp('\\b' + searchTerm + '\\b','i')
    if (booklist_for_search[i].match(rSearchTerm)) {
      keywordIndex = i  // grouping keyword is in
      resultBookList.push(booklist_for_search[i]) //debug
    }
  }) 
  res.send({resultBookList: resultBookList})

})

// calculates the tag for selected books
app.post('/calculateTag', function(req, res) {
	const obj = req.body
	const bookArray = obj.selectedBooks 
	const query = 'select tag, abs(max(score) - min(score)) as absoluteDifference from tags where title in (?) group by tag order by absoluteDifference desc' 

	  con.query(query, [bookArray], function (err, result) {
	    res.send(result)
	  })
})

// submits form
app.post('/submitSurvey', function(req,res){
  const obj = req.body
  // saved the tag in a variable and removed it from the obj so that it can be iterated
  const tag = obj.tag
  const name = obj.name
  delete obj.tag
  delete obj.name
  
  for(const i in obj){
   con.query('INSERT INTO surveyresponse (name_or_turkid, title, tag, score) VALUES (?, ?, ?, ?)',[name, i, tag, obj[i]], function(err, result){
   	 if (err) {
   	 	console.log(err)
   	 }
   }) 
  }
  // Nodejs is single threaded, this response runs before completing the for loop above, need to imporve using promise resolve
  res.send({success:true})
})

// insert movie selection
app.post('/insertMovieSelection', function( req, res ){
  const obj = req.body
  con.query('INSERT INTO movieselection (TURKID, selected_movies, comment) VALUES (?, ?, ?)',[obj.turkID, obj.movieNames.toString(), obj.comment], function(err, result){
     if (err) {
      // console.log(err)
     }
     res.send({UID:result.insertId})
  })
})

// insertHowLongAgo
app.post('/insertHowLongAgo', function( req, res ){
  const obj = req.body
  const UID  = obj.UID
  const comment = obj.comment
  delete obj.UID
  delete obj.comment
  for(const i in obj){
   con.query('INSERT INTO moviequestion (UID, movie, how_long_ago, comment) VALUES (?, ?, ?, ?)',[UID, i, obj[i], comment], function(err, result){
     if (err) {
      // console.log(err)
     }
   }) 
  }
  res.send({success:true})
})

// insertMovieTagQuestion
app.post('/insertMovieTagQuestion', function( req, res ){
  const obj = req.body
  const movieData = obj.movieTagArray
  const tagData = obj.tagMovieArray
  const commentData = obj.message
  for(const i in movieData){
   con.query('INSERT INTO movietagscore (UID, movie, tag, score) VALUES (?, ?, ?, ?)',[movieData[i].UID, movieData[i].movie, movieData[i].tag, movieData[i].score], function(err, result){
     if (err) {
      // console.log(err)
    }
  }) 
 }
 for(const i in tagData){
   con.query('INSERT INTO movietagdifficulty (UID, movie, tag, score) VALUES (?, ?, ?, ?)',[tagData[i].UID, tagData[i].movie, tagData[i].tag, tagData[i].score], function(err, result){
     if (err) {
      // console.log(err)
    }
  }) 
 }
 con.query('INSERT INTO comment (UID, type, comment) VALUES (?, ?, ?)',[commentData[0], 'movie-tag-comment', commentData[1]], function(err, result){
   if (err) { 
     // console.log(err)
   }
 })
 res.send({success:true})
})

// tag question
app.post('/tagQuestion', function ( req, res ){
  const obj = req.body
  const UID  = obj.UID
  const comment = obj.comment
  delete obj.UID
  delete obj.comment
  for(const i in obj){
   con.query('INSERT INTO tagquestion (UID, tag, score, tagdefinition, comment) VALUES (?, ?, ?, ?, ?)',[UID, i, obj[i][0], obj[i][1], comment], function(err, result){
     if (err) {
      // console.log(err)
     }
   }) 
  }
  res.send({success:true})
})

app.listen(port, function () {
  console.log("Running book-tag-api on port " + port)
})
