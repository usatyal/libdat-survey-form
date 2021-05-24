NUMBER_OF_BOOKS = 10
NUMBER_OF_RESPONSES = 30
NUMBER_OF_ITEMS_IN_FIRST_FOLD = 5

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
    $('#pagination').append(`<li class='page-item'><a class='page-link' data-search='${searchKey}' data-pagenum='${i}'>${i}</a></li>`)
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

function displayBooks () {
  $.each(displayedBooks, function(i) {
    $('#books').prepend(getSearchBookHtml(displayedBooks[i], isBookSelected(displayedBooks[i])))
  })
}

let selectedBooks = []
let tagArray = []
let currentIndex = 0
let displayedBooks = []
let turkId = ''
let UID = 0
let RECS = []
let displayedBooksWithRecs = []

$('.remainingNum').html(NUMBER_OF_BOOKS)

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
        RECS.forEach(book => {
          $('#recs').append(getSearchBookHtml(book))
          displayedBooksWithRecs.push(book)
        })
      }
    })

  $('.turk-id-row').hide()
  $('.search-book-row').show()
})

$('#inputBookName').on('keypress', function(e) {
  if (e.which == 13) {
    if (!$('form#searchTermForm')[0].checkValidity()) {
      showValidationError()
      return
    }

    var searchKey = $('#inputBookName').val()
    e.preventDefault()
    // to prevent multiple ajax request
    var that = $(this);
    if (that.data('requestRunning')){
      return;
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

        // to address recs
        displayedBooksWithRecs = displayedBooks.concat(displayedBooksWithRecs)
        
        displayBooks()
        
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
     displayBooks()
    } 
  })
})

function getBookById(id) {
  book = {}
  displayedBooksWithRecs.forEach(element => {
    if(element["id"] === id) {
      book = element
      return;
    }
  })
  return book;
}

function updateSelectedBooks(){
  $('ul.selected-books').empty()
    $.each(selectedBooks, function(i) {
      $('ul.selected-books').append(`<li> <a target="_blank" href="${selectedBooks[i]["url"]}">${selectedBooks[i]["title"]}</a></li>`)
    })
}

//TODO: modify getBookById() to accept the recs as well
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
    selectedBooks = selectedBooks.filter(item => item["id"] !== this.value)
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(NUMBER_OF_BOOKS - selectedBooks.length)
    updateSelectedBooks()
  }
})

$('.selected-view').on('click', '.show-form', function() {
  if (selectedBooks.length < 1) {
    $.ajax({
      url: 'noBooks',
      type: 'post',
      data: {
        turkId: turkId,
        uid: UID
      }
    })
    alert ('Sorry, you cannot take this survey. Your Turk ID is banned. If you take this survey again, we will reject your answers.')
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
      $('.intro-view').empty()
      $('#selectedBooks').show()
      $('#selectedBooks .jumbotron').show()
      $('#totalPagination').html(Math.ceil(NUMBER_OF_RESPONSES/selectedBooks.length))
      $('#currentPagination').html(currentIndex + 1)
      $('#submitFirstForm').show()
      $('#tag_large').html(`<a target="_blank" href="https://www.google.com/search?q=${tagArray[currentIndex].tag}">${tagArray[currentIndex].tag} </a>`)
      $('#calculatedTagName').html(`<a target="_blank" href="https://www.google.com/search?q=${tagArray[currentIndex].tag}">${tagArray[currentIndex].tag} </a>`)
      $.each(selectedBooks, function(i) {
        $('.form-wrapper').append(`<h3> <a target="_blank" href="${selectedBooks[i]["url"]}">${selectedBooks[i]["title"]} </a> </h3>
           <div class='form-group'>
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
               <input type='radio' name='${selectedBooks[i]["id"]}' value='-1' checked><b>Not sure</b>
             </label>
           </div>`)
      })
    }
  })
})

$('#submitForm').click(function() {
  if ($('#tagRangeForm')[0].checkValidity()) {
    $.ajax({
      url: 'submitSurvey',
      type: 'post',
      data: $('form#tagRangeForm').serialize() + "&tag_id=" + tagArray[currentIndex]["tag_id"] + "&uid=" + UID,
      success: function(data) {
        if (data.success === true) {
          currentIndex = currentIndex + 1
          let messageIndex = Math.ceil(NUMBER_OF_RESPONSES/selectedBooks.length)
          if (currentIndex + 1 > messageIndex) {
            // show message hide pagination
            $('.message').show()
            $('.jumbotron h2').hide()
            $('.randomcode').html(UID + turkId)
          }
          // change the pagination and tag
          $('#currentPagination').html(currentIndex + 1)
          $('#calculatedTagName').html(`<a target="_blank" href="https://www.google.com/search?q=${tagArray[currentIndex].tag}">${tagArray[currentIndex].tag} </a>`)
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
  return false;
})