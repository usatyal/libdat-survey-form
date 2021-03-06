// app.js
NUMBER_OF_ITEMS_IN_FIRST_FOLD = 10

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

function insertRecs(recs, uid){
  recs.forEach(rec => {
    let q = 'insert into recs (uid, book_id) values (?, ?)'
    con.query(q, [uid, rec["id"]], function (err, result) {
      if (err) {
       console.log(err)
      }
	})
  })
}

// the user inputs turk id
app.post('/login', function(req,res){
  const obj = req.body
  const query = 'INSERT INTO user (turkid) VALUES (?);' +
      'select b.id, b.title, b.url, b.pop as pop, count(rs.book_id) as cnt from book b ' +
      'left join (select * from survey_response where score <> -1 ' +
      'and uid not in (select uid from user where turkid in (select turkid from exclusion))) rs on ' +
      'rs.book_id=b.id group by id order by cnt asc, pop desc limit 2;'

  con.query(query, [obj.turkId], function (err, result) {
    if (!err) {
      res.send({uid: result[0].insertId, recs: result[1]})
      insertRecs(result[1], result[0].insertId)
    }
	})
})

function banUser(no_books, fake, wrong, obj){
  const query = 'INSERT INTO exclusion (turkid, uid, no_books, fake, wrong) VALUES (?,?,?,?,?)'

  con.query(query, [obj.turkId, obj.uid, no_books, fake, wrong], function (err, result) {
    if (err) {
      console.log(err)
    }
	})
}

// the user selects a fake book
app.post('/fakeBooks', function(req,res){
  const obj = req.body
  banUser(false, true, false, obj)
  res.send()
})

// the user selects no books
app.post('/noBooks', function(req,res){
  const obj = req.body
  banUser(true, false, false, obj)
  res.send()
})

//let searchTermQuery = 'select id, title, url from book where REGEXP_LIKE(title, N?) order by pop desc'
let searchTermQuery = 'select id, title, url from book where REGEXP_LIKE(title, N?)\n' +
    'and id not in\n' +
    '(select book_id from\n' +
    '(select book_id, tag_id, count(score) as cnt from survey_response\n' +
    'where score <> -1 and\n' +
    'uid not in (select uid from user where turkid in (select turkid from exclusion))\n' +
    'group by book_id, tag_id having cnt >= 5) as sr group by book_id having count(book_id) >= 5)\n' +
    'order by pop desc'

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

  const query = searchTermQuery + ";"

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

// search from pagination 
app.post('/searchFromPagination', function(req, res) {
  const obj = req.body
  const searchTerm = obj.searchKey
  const pageNum = obj.pageNum
  const query = searchTermQuery + ' limit ? offset ?;'
  con.query(query, ['\\b'+searchTerm+'\\b', NUMBER_OF_ITEMS_IN_FIRST_FOLD, (pageNum - 1)*NUMBER_OF_ITEMS_IN_FIRST_FOLD], function (err, result) {
    if (!err) {
      res.send({resultBookList: result})
    }
  }
  /*con.query(query, ['\\b'+searchTerm+'\\b'], function (err, result) {
    if (!err) {
      res.send({resultBookList: result.slice((pageNum-1)*NUMBER_OF_ITEMS_IN_FIRST_FOLD, pageNum*NUMBER_OF_ITEMS_IN_FIRST_FOLD)})
    }
  }*/)
})

// calculates the tag for selected books
app.post('/calculateTag', function(req, res) {
	const obj = req.body
	const bookArray = getBookIds(obj.selectedBooks)
    const uid = obj.uid
  // same query for calculating tag and inserting to the book_selection
	//const query = 'select tag, tag_id, abs(max(score) - min(score)) as absoluteDifference from score, tag where score.tag_id = tag.id and book_id in (?) group by tag_id order by absoluteDifference desc; INSERT INTO book_selection (uid, selection) VALUES (?, ?)'
  const query = 'select score.tag_id, tag.tag, abs(max(score.score) - min(score.score)) as absoluteDifference, tag_count.tc as tag_cnt from score\n' +
      'left outer join\n' +
      '(select tag_id, count(tag_id) as tc from\n' +
      '(select book_id, tag_id, count(score) as cnt from survey_response\n' +
      'where score <> -1 and book_id in (?) and\n' +
      'uid not in (select uid from user where turkid in (select turkid from exclusion))\n' +
      'group by book_id, tag_id having cnt >= 5) sr group by tag_id) as tag_count\n' +
      'on score.tag_id=tag_count.tag_id\n' +
      'inner join tag on tag.id = score.tag_id\n' +
      'where score.book_id in (?)\n' +
      'group by tag_id order by tag_cnt, absoluteDifference desc; INSERT INTO book_selection (uid, selection) VALUES (?, ?)'
  /*const query = 'select score.tag_id, tag.tag, abs(max(score.score) - min(score.score)) as absoluteDifference, tag_count.tc as tag_cnt from score\n' +
      'left outer join\n' +
      '(select tag_id, count(tag_id) as tc from survey_response \n' +
      'where score <> -1 and uid not in (select uid from user where turkid in (select turkid from exclusion)) \n' +
      'group by tag_id) as tag_count\n' +
      'on score.tag_id=tag_count.tag_id\n' +
      'inner join tag on tag.id = score.tag_id\n' +
      'where score.book_id in (?)\n' +
      'group by tag_id order by tag_cnt, absoluteDifference desc; INSERT INTO book_selection (uid, selection) VALUES (?, ?)'*/
  // !!! do not forget to check the parameters
  con.query(query, [bookArray, bookArray, uid, bookArray.toString()], function (err, result) {
  //con.query(query, [bookArray, uid, bookArray.toString()], function (err, result) {
    if (!err) {
     res.send({result: result[0]})
    }
	})
})


app.post('/trap', function(req,res){
  const obj = req.body
  banUser(false, false, true, obj)
  // saved the tag in a variable and removed it from the obj so that it can be iterated
  const tag_id = obj.tag_id
  const uid = obj.uid
  delete obj.tag_id
  delete obj.uid
  delete obj.comment
  delete obj.turkId

  async function insertData () {
    for(const i in obj){
     try {
       await con.query('INSERT INTO trap (uid, book_id, tag_id, score) VALUES (?, ?, ?, ?)',[uid, i, tag_id, obj[i]], function(err, result){
       })
      } catch (err) {
        console.log(err)
     }
    }
  }
  insertData()

  res.send({success:true})
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
