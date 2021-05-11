NUMBER_OF_BOOKS = 2
NUMBER_OF_RESPONSES = 4


function showValidationError(){
  alert("Please check all the fields")
}


let selectedBooks = []
let tagArray = []
let currentIndex = 1
let currentPagination = 1
let turkId = ''

$('.remainingNum').html(NUMBER_OF_BOOKS)

$('#inputBookName').on('keypress', function(e) {
  if (e.which == 13) {
    if (!$('form#searchTermForm')[0].checkValidity()) {
      showValidationError()
      return
    }
    e.preventDefault()
    turkId = $('#turkId').val()
    $('#books div.checkbox').remove()
    $.ajax({
      url: 'searchBookFromTerm',
      type: 'post',
      data: $('form#searchTermForm').serialize()+ "&uid=" + localStorage.getItem('UID'),
      success: function(data) {
        localStorage.setItem("UID", data.UID)
        $('#instruction').show()
        $.each(data.resultBookList, function(i) {
          $('#books').prepend(`<div class='checkbox'>
            <label>
              <input type='checkbox' name='bookNames' value="${data.resultBookList[i]}">
              ${data.resultBookList[i]} 
              </label>
          </div>`)
        })
        $('#submitSelectedBooks').show()
      }
    })
  }
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
    if (selectedBooks.length === NUMBER_OF_BOOKS) {
      $('.show-form').show()
    }
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(NUMBER_OF_BOOKS - selectedBooks.length)
    $('ul.selected-books').empty()
    $.each(selectedBooks, function(i) {
      $('ul.selected-books').append(`<li> ${selectedBooks[i]} </li>`)
    })
  } else {
    selectedBooks.pop(this.value)
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(NUMBER_OF_BOOKS - selectedBooks.length)
    $('ul.selected-books').empty()
    $.each(selectedBooks, function(i) {
      $('ul.selected-books').append(`<li> ${selectedBooks[i]} </li>`)
    })
  }
})

$('.selected-view').on('click', '.show-form', function() {
  $.ajax({
    url: 'calculateTag',
    type: 'post',
    data: {
      selectedBooks: selectedBooks,
      uid: localStorage.getItem('uid')
    },
    success: function(data) {
      tagArray = data
      $('.intro-view').empty()
      $('#selectedBooks').show()
      $('#selectedBooks .jumbotron').show()
      $('#totalPagination').html(NUMBER_OF_RESPONSES/selectedBooks.length)
      $('#currentPagination').html(currentPagination)
      $('#submitFirstForm').show()
      $('#calculatedTagName').html(tagArray[currentIndex].tag)
      $.each(selectedBooks, function(i) {
        $('.form-wrapper').append(`<h3> ${selectedBooks[i]} </h3>
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
               <input type='radio' name='${selectedBooks[i]}' value='-1'>Not sure
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
      data: $('form#tagRangeForm').serialize() + "&tag=" + tagArray[currentIndex].tag + "&uid=" + localStorage.getItem('UID'),
      success: function(data) {
        if (data.success === true) {
          let messageIndex = NUMBER_OF_RESPONSES/selectedBooks.length - 1
          if (currentIndex > messageIndex) {
            // show message hide pagination
            $('.message').show()
            $('.jumbotron h2').hide()

            // TODO: this should be replaced by uid + turkId
            $('.randomcode').html(localStorage.getItem('UID') + turkId)
          }
          currentIndex = currentIndex + 1
          currentPagination = currentPagination + 1
          // change the pagination and tag
          $('#currentPagination').html(currentPagination)
          $('#calculatedTagName').html(tagArray[currentIndex].tag)
          // reset the form
          $('#tagRangeForm').trigger("reset")
        }
      }
    })
  } else {
    showValidationError()
  }
  // so that form does not reload on submit
  return false;
})