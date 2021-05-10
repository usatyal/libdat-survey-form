let selectedBooks = []
let tagArray = []
let currentIndex = 0
let totalPagination = 3
let currentPagination = 1

$('#inputBookName').on('keypress', function(e) {
  if (e.which == 13) {
    e.preventDefault()
    $('#books div.checkbox').remove()
    $.ajax({
      url: 'searchBookFromTerm',
      type: 'post',
      data: $('form#searchTermForm').serialize(),
      success: function(data) {
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
    if (selectedBooks.length === 6) {
      alert('You have already selected 6 books')
      return false;
    }
    selectedBooks.push(this.value)
    if (selectedBooks.length === 6) {
      $('.show-form').show()
    }
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(6 - selectedBooks.length)
    $('ul.selected-books').empty()
    $.each(selectedBooks, function(i) {
      $('ul.selected-books').append(`<li> ${selectedBooks[i]} </li>`)
    })
  } else {
    selectedBooks.pop(this.value)
    $('.selectedNum').html(selectedBooks.length)
    $('.remainingNum').html(6 - selectedBooks.length)
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
      selectedBooks: selectedBooks
    },
    success: function(data) {
      tagArray = data
      $('.intro-view').empty()
      $('#selectedBooks').show()
      $('#selectedBooks .jumbotron').show()
      $('#totalPagination').html(totalPagination)
      $('#currentPagination').html(currentPagination)
      $('#submitFirstForm').show()
      $('#calculatedTagName').html(tagArray[currentIndex].tag)
      $.each(selectedBooks, function(i) {
        $('.form-wrapper').prepend(`<h3> ${selectedBooks[i]} </h3>
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
      data: $('form#tagRangeForm').serialize() + "&tag=" + tagArray[currentIndex].tag,
      success: function(data) {
        if (data.success === true) {
          if (currentIndex === 2) {
            $('.message').show()
            $('.randomcode').html(Math.random().toString(36).slice(2))
          }
          currentIndex = currentIndex + 1
          currentPagination = currentPagination + 1
          // change the pagination and tag
          $('#currentPagination').html(currentPagination)
          $('#calculatedTagName').html(tagArray[currentIndex].tag)
          // save username in a variable reset the form and fill the username back
          var username = $('#username').val()
          $('#tagRangeForm').trigger("reset")
          $('#username').val(username)
        }
      }
    })
  } else {
    alert('All fields are mandatory!')
  }
  // so that form does not reload on submit
  return false;
})