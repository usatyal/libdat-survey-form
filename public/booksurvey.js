// booksurvey.js
NUMBER_OF_BOOKS = 10
NUMBER_OF_RESPONSES = 30
NUMBER_OF_ITEMS_IN_FIRST_FOLD = 10
FAKE_BOOK = {id:-1, title: "Night Nocturne by Kate Preston", url:"https://www.google.com/search?q=Night+Nocturne+by+Kate+Preston"}
MIN_CHARS_FOR_SEARCH = 3

let selectedBooks = []
let tagArray = []
let currentIndex = 0
let displayedBooks = []
let turkId = ''
let UID = 0
let RECS = []
let trapState = true

$('#question_number').html(NUMBER_OF_RESPONSES)

$.ajaxSetup({
  beforeSend:function(){
    $("#loading").show()
  },
  complete:function(){
    $("#loading").hide()
  }
})

function showPagination (num, searchKey) {
 if($('#pagination li').length) {
  $('#pagination li').remove()
 }
 if (num === 1 ) {
  return
 } else {
  for (i = 1; i <= num; i++) {
    // first page active by default
    if (i === 1) {
      $('#pagination').append(`<li class='page-item active'><a class='page-link' data-search='${searchKey}' data-pagenum='${i}'>${i}</a></li>`)
    } else {
      $('#pagination').append(`<li class='page-item'><a class='page-link' data-search='${searchKey}' data-pagenum='${i}'>${i}</a></li>`)
    }
  }
 }
}

function showValidationError(){
  alert("Please check all the fields")
}

function isBookSelected(book) {
  selected = false
  selectedBooks.forEach(element => {
    if(element["id"] === book["id"]) {
      selected = true
    }
  })
  return selected
}

function getSearchBookHtml(book, checked){
  let checkedStr = ""
  if(checked) {
    checkedStr = "checked"
  }
  return `<div class='checkbox'>
        <label>
        <input type='checkbox' name='bookNames' value="${book["id"]}" ${checkedStr}>
        ${book["title"]} 
        </label>
        </div>`
}

function updateBooks() {
  $('#books').empty()
  $.each(displayedBooks, function(i) {
    $('#books').append(getSearchBookHtml(displayedBooks[i], isBookSelected(displayedBooks[i])))
  })
}

$('.remainingNum').html(NUMBER_OF_BOOKS)

function updateRecs(){
  $('#recs').empty()
  RECS.forEach(book => {
    $('#recs').append(getSearchBookHtml(book, isBookSelected(book)))
  })
}

$('#submitTurkId').on('click', function(e) {
  if (!$('form#turkForm')[0].checkValidity()) {
    showValidationError()
    return
  }
  e.preventDefault()

  turkId = $('#turkId').val()

  $.ajax({
      url: 'login',
      type: 'post',
      data: "turkId=" + turkId,
      success: function(data) {
        UID = data.uid
        RECS = data.recs
        //adding the fake book
        RECS.splice(1, 0, FAKE_BOOK)
        updateRecs()
      }
    })

  $('.turk-id-row').hide()
  //$('.search-book-row').show()
  selectedBooks = [{id:-10, title: "Fight Club by Chuck Palahniuk", url:"https://www.goodreads.com/book/show/36236124-fight-club"},
    {id:-11, title: "Harry Potter and the Sorcerer's Stone by J.K. Rowling", url:"https://www.goodreads.com/book/show/3.Harry_Potter_and_the_Sorcerer_s_Stone"},
    {id:-12, title: "Alice's Adventures in Wonderland / Through the Looking-Glass by Lewis Carroll", url:"https://www.goodreads.com/book/show/24213.Alice_s_Adventures_in_Wonderland_Through_the_Looking_Glass"}]
  tagArray = [{"tag":"for kids", "id":-100}]
  currentIndex = 0
  trapState = true
  showSurveyPage()
})

$('#inputBookName').on('keypress', function(e) {
  if (e.which == 13) {
    if (!$('form#searchTermForm')[0].checkValidity()) {
      showValidationError()
      return false
    }

    var searchKey = $('#inputBookName').val()

    if (searchKey.length < MIN_CHARS_FOR_SEARCH) {
      alert('Minimum character limit for search functionality is ' + MIN_CHARS_FOR_SEARCH + '')
      return false
    }
    e.preventDefault()
    // to prevent multiple ajax request
    var that = $(this);
    if (that.data('requestRunning')){
      return
    }
    
    that.data('requestRunning', true);

    $('#books div.checkbox').remove()
    $.ajax({
      url: 'searchBookFromTerm',
      type: 'post',
      data: $('form#searchTermForm').serialize()+ "&uid=" + UID,
      success: function(data) {
        $('#recs_block').show()
        displayedBooks = data.resultBookList
        
        updateBooks()

        if(displayedBooks.length == 0) {
          $('#nothing').show()
        }else{
          $('#nothing').hide()
        }
        
        $('#submitSelectedBooks').show()
        $('#noBook').show()

        showPagination(data.paginationNum, searchKey)
      },
      complete: function() {
        that.data('requestRunning', false);
        $("#loading").hide()
      }
    })
  }
})

// search from pagination
$('#pagination').on('click', '.page-link', function() {
  var currentLi = $(this).parent('li')
  $.ajax({
    url: 'searchFromPagination',
    type: 'post',
    data: 'searchKey=' + $(this).data('search') + '&pageNum=' + $(this).data('pagenum'),
    success: function (data) {
     displayedBooks = data.resultBookList
     // display new set of books based on pagination and searchKey
     // remove if exists
     if($('#books .checkbox').length) {
      $('#books .checkbox').remove()
     }
     
     updateBooks()

     // remove active class from other pagination and add to the current
     $('ul li.page-item').removeClass('active')
     currentLi.addClass('active')
    } 
  })
})

function getBookById(id) {
  id = parseInt(id)
  book = getBookByIdFromList(id, displayedBooks)
  if(book === null) {
    book = getBookByIdFromList(id, RECS)
  }
  return book;
}

function getBookByIdFromList(id, list) {
  book = null
  list.forEach(element => {
    if(element["id"] === id) {
      book = element
      return;
    }
  })
  return book
}

function updateSelectedBooks(){
  $('ul.selected-books').empty()
  $.each(selectedBooks, function(i) {
    $('ul.selected-books').append(`<li> <a target="_blank" href="${selectedBooks[i]["url"]}">${selectedBooks[i]["title"]}</a></li>`)
  })
}

$('#books, #recs').on('click', 'input[name="bookNames"]', function() {
  if (this.checked === true) {
    if (selectedBooks.length === NUMBER_OF_BOOKS) {
      alert(`You have already selected ${NUMBER_OF_BOOKS} books`)
      return false
    }
    selectedBooks.push(getBookById(this.value))
    if (selectedBooks.length >= 1) {
      $('.show-form').html('I cannot find more books')
    }
    if (selectedBooks.length === NUMBER_OF_BOOKS) {
      $('.show-form').html('Next')
    }
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(NUMBER_OF_BOOKS - selectedBooks.length)
    updateSelectedBooks()
  } else {
    // remove item from array and regenerate the list
    selectedBooks = selectedBooks.filter(item => item["id"] !== parseInt(this.value))
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(NUMBER_OF_BOOKS - selectedBooks.length)
    updateSelectedBooks()
  }
  updateRecs()
  updateBooks()
})

function isFakeBookSelected(){
  selected = false
  selectedBooks.forEach(book => {
    if(book["id"] === -1) {
      selected = true
    }
  })
  return selected;
}

function updateTag(){
  currentTag = tagArray[currentIndex].tag
  tagHtml = `<a target="_blank" href="https://www.google.com/search?q=${currentTag}">${currentTag} </a>`
  $('#tagLarge').html(tagHtml)
  $('#calculatedTagName').html(tagHtml)
}

function showSurveyPage(){
  //$('.intro-view').empty()
  $('.intro-view').hide()
  $('#selectedBooks').show()
  $('#selectedBooks .jumbotron').show()
  checked = ""
  if(trapState) {
    checked = ""
    $('#surveyPages').hide()
    $('#comment').hide()
    $('#tutorial').show()
  }else {
    checked = "checked"
    $('#surveyPages').show()
    $('#tutorial').hide()
    $('#totalPagination').html(Math.ceil(NUMBER_OF_RESPONSES / selectedBooks.length))
    $('#currentPagination').html(currentIndex + 1)
    $('#comment').show()
  }
  updateTag()
  $('.form-wrapper').empty()
  $.each(selectedBooks, function(i) {
    $('.form-wrapper').append(`<h3> <a target="_blank" href="${selectedBooks[i]["url"]}">${selectedBooks[i]["title"]} </a> </h3>
       <div class='form-group' style="font-size: large">
         <label class='radio-inline'>
           <input type='radio' name='${selectedBooks[i]["id"]}' value='1' required>1 (not at all)
         </label>
         <label class='radio-inline'>
           <input type='radio' name='${selectedBooks[i]["id"]}' value='2'>2
         </label>
         <label class='radio-inline'>
           <input type='radio' name='${selectedBooks[i]["id"]}' value='3'>3
         </label>
         <label class='radio-inline'>
           <input type='radio' name='${selectedBooks[i]["id"]}' value='4'>4
         </label>
         <label class='radio-inline'>
           <input type='radio' name='${selectedBooks[i]["id"]}' value='5'>5 (very strongly)
         </label>
         <label class='radio-inline'>
           <input type='radio' name='${selectedBooks[i]["id"]}' value='-1' ${checked}><b>Not sure</b>
         </label>
       </div>`);
  })
}

$('.selected-view').on('click', '.show-form', function() {
  if (selectedBooks.length < 1) {
    if(confirm("Are you sure that you searched well enough and want to continue?")){
      $.ajax({
        url: 'noBooks',
        type: 'post',
        data: {
          turkId: turkId,
          uid: UID
        }
      })
      alert ('Sorry, you cannot take this survey. Your Turk ID is banned. If you take this survey again, we will reject your answers.')
    }
    return false
  }
  if(isFakeBookSelected()){
    $.ajax({
      url: 'fakeBooks',
      type: 'post',
      data: {
        turkId: turkId,
        uid: UID
      },success: function(data) {}
    })
    alert ('You selected a fake book. Your Turk ID is banned. If you take this survey again, we will reject your answers.')
    return false
  }

  $.ajax({
    url: 'calculateTag',
    type: 'post',
    data: {
      selectedBooks: selectedBooks,
      uid: UID
    },
    success: function(data) {
      tagArray = data.result
      currentIndex = 0
      showSurveyPage()
    }
  })
})

function getAnswerByKey(array, key){
  result = null
  array.forEach(element => {
    if(element["name"] == key) {
      result = element;
    }
  })
  if(result == null) {
    return null
  }
  return result["value"]
}

$('#submitForm').click(function() {
  if(trapState) {
    if (!$('#tagRangeForm')[0].checkValidity()) {
      showValidationError()
      return false
    }
    answers = $('form#tagRangeForm').serializeArray()
    fightAns = getAnswerByKey(answers, "-10")
    harryAns = getAnswerByKey(answers, "-11")
    aliceAns = getAnswerByKey(answers, "-12")
    if(fightAns > 3 || harryAns == 2 || harryAns == 1 || aliceAns == 2 || aliceAns == 1) {
      $.ajax({
        url: 'trap',
        type: 'post',
        data: $('form#tagRangeForm').serialize() + "&tag_id=" + tagArray[currentIndex]["tag_id"] + "&uid=" + UID + "&turkId=" + turkId
      })
      alert("Your answer is incorrect. You are not suitable for this survey. Your Turk ID is banned. If you take this survey again, we will reject your answers.")
      return false;
    }
    trapState = false
    $('#selectedBooks').hide()
    $('#selectedBooks .jumbotron').hide()
    $('.intro-view').show()
    $('.search-book-row').show()
    selectedBooks = []
    tagArray = []
    return false
  }
  trapState = false
  if ($('#tagRangeForm')[0].checkValidity()) {
    $.ajax({
      url: 'submitSurvey',
      type: 'post',
      data: $('form#tagRangeForm').serialize() + "&tag_id=" + tagArray[currentIndex]["tag_id"] + "&uid=" + UID,
      success: function(data) {
        if (data.success === true) {
          currentIndex = currentIndex + 1
          if(currentIndex >= tagArray.length) {
            alert("You have provided your feedback on all the tags. Thank you for your effort!")
          }
          let messageIndex = Math.ceil(NUMBER_OF_RESPONSES/selectedBooks.length)
          if (currentIndex + 1 > messageIndex) {
            // show message hide pagination
            $('#finish').show()
            $('.jumbotron h2').hide()
            $('.randomcode').html(UID + turkId)
          }
          // change the pagination and tag
          $('#currentPagination').html(currentIndex + 1)
          updateTag()
          // reset the form
          $('#tagRangeForm').trigger("reset")
          $("html, body").animate({ scrollTop: 0 }, "slow");
        }
      }
    })
  } else {
    showValidationError()
  }
  // so that form does not reload on submit
  return false
})