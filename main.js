// app.js
NUMBER_OF_ITEMS_IN_FIRST_FOLD = 5

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

// the user inputs turk id
app.post('/login', function(req,res){
  const obj = req.body
  const query = 'INSERT INTO user (turkid) VALUES (?);select b.id, b.title, b.url, b.pop as pop, count(rs.book_id) as cnt from book b left join (select * from survey_response where score <> -1) rs on rs.book_id=b.id group by id order by cnt, pop limit 2;'

  con.query(query, [obj.turkId], function (err, result) {
    if (!err) {
     res.send({uid: result[0].insertId, recs: result[1]})
    }
	})
})

// the user selects no books
app.post('/noBooks', function(req,res){
  const obj = req.body
  const query = 'INSERT INTO exclusion (turkid, uid, no_books, fake, wrong) VALUES (?,?,?,?,?)'

  con.query(query, [obj.turkId, obj.uid, true, false, false], function (err, result) {
    if (err) {
      console.log(err)
    }
	})
})

// survery book search
app.post('/searchBookFromTerm', function(req, res){
  const obj = req.body
  const searchTerm = obj.searchTerm
  const uid = obj.uid
  var keywordIndex
  var resultBookList = []

  // insert search key
  async function insertSearchKey () {
    try {
       await con.query('INSERT INTO search_term (uid, term) VALUES (?, ?)',[uid, searchTerm], function(err, result){
       }) 
      } catch (err) {
        console.log(err)
     }
  }

  insertSearchKey()

  const query = 'select id, title, url from book where REGEXP_LIKE(title, N?) order by pop desc;'

  con.query(query, ['\\b'+searchTerm+'\\b'], function (err, result) {
    if (!err) {
      res.send({resultBookList: result.slice(0, NUMBER_OF_ITEMS_IN_FIRST_FOLD), paginationNum: Math.ceil(result.length/NUMBER_OF_ITEMS_IN_FIRST_FOLD)})
    }
  })
})

function getBookIds(bookArray){
  ids = []
  bookArray.forEach(element => {
    ids.push(element["id"])
  })
  return ids;
}

// calculates the tag for selected books
app.post('/calculateTag', function(req, res) {
	const obj = req.body
	const bookArray = getBookIds(obj.selectedBooks)
    const uid = obj.uid
  // same query for calculating tag and inserting to the book_selection
	const query = 'select tag, tag_id, abs(max(score) - min(score)) as absoluteDifference from score, tag where score.tag_id = tag.id and book_id in (?) group by tag_id order by absoluteDifference desc; INSERT INTO book_selection (uid, selection) VALUES (?, ?)'
  
  con.query(query, [bookArray, uid, bookArray.toString()], function (err, result) {
    if (!err) {
     res.send({result: result[0]})
    }
	})
})

// submits form
app.post('/submitSurvey', function(req,res){
  const obj = req.body
  // saved the tag in a variable and removed it from the obj so that it can be iterated
  const tag_id = obj.tag_id
  const uid = obj.uid
  const comment = obj.comment
  delete obj.tag_id
  delete obj.uid
  delete obj.comment

  async function insertComment () {
    try {
       await con.query('INSERT INTO book_comment (uid, comment, tag_id) VALUES (?, ?, ?)',[uid, comment, tag_id], function(err, result){
       }) 
      } catch (err) {
        console.log(err)
     }
  }
  
  async function insertData () {
    for(const i in obj){
     try {
       await con.query('INSERT INTO survey_response (uid, book_id, tag_id, score) VALUES (?, ?, ?, ?)',[uid, i, tag_id, obj[i]], function(err, result){
       }) 
      } catch (err) {
        console.log(err)
     }
    }
  }
  
  if(comment != "") {
    insertComment()
  }

  insertData()

  res.send({success:true})
})

app.listen(port, function () {
  console.log("Running book survey on port " + port)
})
