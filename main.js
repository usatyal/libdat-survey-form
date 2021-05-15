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
  host               : process.env.RDS_HOSTNAME,
  user               : process.env.RDS_USERNAME,
  password           : process.env.RDS_PASSWORD,
  port               : process.env.RDS_PORT,
  database           : process.env.RDS_DB_NAME,
  multipleStatements : true
})

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

// survery book search
app.post('/searchBookFromTerm', function(req, res){
  const obj = req.body
  const searchTerm = obj.searchTerm
  const turkId = obj.turkId
  var keywordIndex
  var resultBookList = []

  // insert search key
  async function insertSearchKey () {
    try {
       await con.query('INSERT INTO searchterm (turkid, searchkey) VALUES (?, ?)',[turkId, searchTerm], function(err, result){
       }) 
      } catch (err) {
        console.log(err)
     }
  }

  insertSearchKey ()

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
  console.log(obj)
	const bookArray = obj.selectedBooks 
  const turkId = obj.turkId
  var uid;
  // same query for calculating tag and inserting the bookselection
	const query = 'select tag, abs(max(score) - min(score)) as absoluteDifference from tags where title in (?) group by tag order by absoluteDifference desc; INSERT INTO bookselection (turkid, bookselection) VALUES (?, ?)'
  
  con.query(query, [bookArray, turkId, bookArray.toString()], function (err, result) {
    if (!err) {
     res.send({result: result[0], uid: result[1].insertId})
    }
	})
})

// submits form
app.post('/submitSurvey', function(req,res){
  const obj = req.body
  // saved the tag in a variable and removed it from the obj so that it can be iterated
  const tag = obj.tag
  const uid = obj.uid
  const comment = obj.comment
  delete obj.tag
  delete obj.uid
  delete obj.comment

  async function insertComment () {
    try {
       await con.query('INSERT INTO bookcomment (uid, comment) VALUES (?, ?)',[uid, comment], function(err, result){
       }) 
      } catch (err) {
        console.log(err)
     }
  }
  
  async function insertData () {
    for(const i in obj){
     try {
       await con.query('INSERT INTO surveyresponse (uid, title, tag, score) VALUES (?, ?, ?, ?)',[uid, i, tag, obj[i]], function(err, result){
       }) 
      } catch (err) {
        console.log(err)
     }
    }
  }
  
  if( comment != "") {
    insertComment()
  }

  insertData()

  res.send({success:true})
})

app.listen(port, function () {
  console.log("Running book survey on port " + port)
})
