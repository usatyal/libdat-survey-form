NUMBER_OF_BOOKS = 10
NUMBER_OF_RESPONSES = 30
NUMBER_OF_ITEMS_IN_FIRST_FOLD = 10

function showValidationError(){
  alert("Please check all the fields")
}

function displayBooks (bookArray) {
  $.each(bookArray, function(i) {
    if (selectedBooks.includes(bookArray[i])) {
      $('#books').prepend(`<div class='checkbox'>
        <label>
        <input type='checkbox' name='bookNames' value="${bookArray[i]}" checked>
        ${bookArray[i]} 
        </label>
        </div>`)
    } else {
      $('#books').prepend(`<div class='checkbox'>
        <label>
        <input type='checkbox' name='bookNames' value="${bookArray[i]}">
        ${bookArray[i]} 
        </label>
        </div>`)
    }
  })
}

let selectedBooks = []
let tagArray = []
let currentIndex = 1
let currentPagination = 1
let turkId = ''
let resultBookList = []
let totalBookList = []

$('.remainingNum').html(NUMBER_OF_BOOKS)

$('#submitTurkId').on('click', function(e) {
  if (!$('form#turkForm')[0].checkValidity()) {
    showValidationError()
    return
  }
  e.preventDefault()

  turkId = $('#turkId').val()
  $('.turk-id-row').hide()
  $('.search-book-row').show()
})

$('#inputBookName').on('keypress', function(e) {
  if (e.which == 13) {
    if (!$('form#searchTermForm')[0].checkValidity()) {
      showValidationError()
      return
    }
    e.preventDefault()
    // to prevent multiple ajax request
    var that = $(this);
    if (that.data('requestRunning')) {
        return;
    }
    that.data('requestRunning', true);

    $('#books div.checkbox').remove()
    $.ajax({
      url: 'searchBookFromTerm',
      type: 'post',
      data: $('form#searchTermForm').serialize()+ "&turkId=" + turkId,
      success: function(data) {
        $('#instruction').show()
        // hide if already exist then append again
        if($('#showAllBooks').length) {
          $('#showAllBooks').remove()
        }
        if (data.resultBookList.length > NUMBER_OF_ITEMS_IN_FIRST_FOLD) {
          totalBookList = data.resultBookList
          resultBookList = data.resultBookList.slice(0, NUMBER_OF_ITEMS_IN_FIRST_FOLD)
          $('#books').append(`<button type='button' class='btn btn-primary' id='showAllBooks'>Show all</button>`)
        } else {
          resultBookList = data.resultBookList
        }
        displayBooks(resultBookList)
        $('#submitSelectedBooks').show()
        $('#noBook').show()
      },
      complete: function() {
        that.data('requestRunning', false);
      }
    })
  }
})

// show remaining books if more than 10
$('#books').on('click', '#showAllBooks', function() {
  $('#books div.checkbox').remove()
  displayBooks(totalBookList)
  $('#showAllBooks').remove()
})

$('#books').on('click', 'input[name="bookNames"]', function() {
  if (this.checked === true) {
    if (selectedBooks.includes(this.value)) {
      alert ('The book is already in your selected list. Please select another.')
      return false
    }
    if (selectedBooks.length === NUMBER_OF_BOOKS) {
      alert(`You have already selected ${NUMBER_OF_BOOKS} books`)
      return false
    }
    selectedBooks.push(this.value)
    if (selectedBooks.length >= 1) {
      $('.show-form').html('I CAN\'T FIND MORE BOOKS')
    }
    if (selectedBooks.length === NUMBER_OF_BOOKS) {
      $('.show-form').html('NEXT')
    }
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(NUMBER_OF_BOOKS - selectedBooks.length)
    $('ul.selected-books').empty()
    $.each(selectedBooks, function(i) {
      $('ul.selected-books').append(`<li> ${selectedBooks[i]} </li>`)
    })
  } else {
    // remove item from array and regenerate the list
    selectedBooks = selectedBooks.filter(item => item !== this.value)
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(NUMBER_OF_BOOKS - selectedBooks.length)
    $('ul.selected-books').empty()
    $.each(selectedBooks, function(i) {
      $('ul.selected-books').append(`<li> ${selectedBooks[i]} </li>`)
    })
  }
})

$('.selected-view').on('click', '.show-form', function() {
  // throw out from the survey is none selected
  if (selectedBooks.length < 1) {
    // TODO: implement ajax request?
    alert ('Sorry, you cannot take this survey. Your Turk ID will be banned. If you take this survey again, we will reject your answers.')
    return false
  }

  $.ajax({
    url: 'calculateTag',
    type: 'post',
    data: {
      selectedBooks: selectedBooks,
      turkId: turkId
    },
    success: function(data) {
      tagArray = data.result
      // uid is set in this point and it will remain same
      localStorage.setItem('uid', data.uid)
      $('.intro-view').empty()
      $('#selectedBooks').show()
      $('#selectedBooks .jumbotron').show()
      $('#totalPagination').html(Math.ceil(NUMBER_OF_RESPONSES/selectedBooks.length))
      $('#currentPagination').html(currentPagination)
      $('#submitFirstForm').show()
      $('#calculatedTagName').html(`<a target="_blank" href="https://www.google.com/search?q=${tagArray[currentIndex].tag}">${tagArray[currentIndex].tag} </a>`)
      $.each(selectedBooks, function(i) {
        $('.form-wrapper').append(`<h3> <a target="_blank" href="https://www.google.com/search?q=${selectedBooks[i]}">${selectedBooks[i]} </a> </h3>
           <div class='form-group'>
             <label class='radio-inline'>
               <input type='radio' name='${selectedBooks[i]}' value='1' required>1
             </label>
             <label class='radio-inline'>
               <input type='radio' name='${selectedBooks[i]}' value='2'>2
             </label>
             <label class='radio-inline'>
               <input type='radio' name='${selectedBooks[i]}' value='3'>3
             </label>
             <label class='radio-inline'>
               <input type='radio' name='${selectedBooks[i]}' value='4'>4
             </label>
             <label class='radio-inline'>
               <input type='radio' name='${selectedBooks[i]}' value='5'>5
             </label>
             <label class='radio-inline'>
               <input type='radio' name='${selectedBooks[i]}' value='-1' checked>Not sure
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
      data: $('form#tagRangeForm').serialize() + "&tag=" + tagArray[currentIndex].tag + "&uid=" + localStorage.getItem('uid'),
      success: function(data) {
        if (data.success === true) {
          let messageIndex = Math.ceil(NUMBER_OF_RESPONSES/selectedBooks.length) - 1
          if (currentIndex > messageIndex) {
            // show message hide pagination
            $('.message').show()
            $('.jumbotron h2').hide()
            $('.randomcode').html(localStorage.getItem('uid') + turkId)
          }
          currentIndex = currentIndex + 1
          currentPagination = currentPagination + 1
          // change the pagination and tag
          $('#currentPagination').html(currentPagination)
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