// moviesurvey.js

// movie and tag names
let movieNames = Object.keys(surveyTree)
let tagArray = [].concat.apply([], Object.values(surveyTree))

// removing the duplicates
tagArray = [...new Set(tagArray)]

// get random three tags
let tempTagArray = tagArray.sort(() => Math.random() - Math.random()).slice(0, 3)

// sort movies randomly
movieNames = movieNames.sort(() => Math.random() - Math.random())

let selectedMovies = []

// render movie names to select
$.each(movieNames, function(i) {
  $('#movieList').prepend(`
    <div class='checkbox'>
      <label>
        <input type='checkbox' name='movieNames' value='${movieNames[i]}'> 
        ${movieNames[i]} 
      </label>
    </div>
  `)
})

// movie selection
$('#movieList').on('click', 'input[name="movieNames"]', function() {
  if (this.checked === true) {
    if (selectedMovies.length === 3) {
      alert('You have already selected 3 movies')
      return false;
    }
    selectedMovies.push(this.value)

    // next button when there are three selected items
    if (selectedMovies.length === 3) {
      $('.show-form').show()
    }

    // when user selects at least one item
    if (selectedMovies.length > 0) {
      $('#notEnoughMovies').show()
    }
    $('.selectedNum').html(selectedMovies.length)
    $('.remainingNum').html(3 - selectedMovies.length)
    $('ul.selected-movies').empty()
    $.each(selectedMovies, function(i) {
      $('ul.selected-movies').append(`<li> ${selectedMovies[i]} </li>`)
    })
  } else {
    selectedMovies.pop(this.value)
    // hide the button if disselected all
    if (selectedMovies.length === 0) {
      $('#notEnoughMovies').hide()
    }
    // hide the next button if less than 3 selected
    if (selectedMovies.length < 3) {
      $('.show-form').hide()
    }
    $('.selectedNum').html(selectedMovies.length)
    $('.remainingNum').html(3 - selectedMovies.length)
    $('ul.selected-movies').empty()
    $.each(selectedMovies, function(i) {
      $('ul.selected-movies').append(`<li> ${selectedMovies[i]} </li>`)
    })
  }
})

// movie question
$('.selected-view, #movieListContainer').on('click', '.show-form, #notEnoughMovies', function() {
  $('.fold-1').hide()
  $('.fold-2').show()
  $('.movie-selection').removeClass('bg-info').addClass('progress-bar-striped progress-bar-animated')
  $.each(selectedMovies, function(i) {
    $('#howLongAgo').prepend(`
      <h3>How long ago did you watch <b><i>${selectedMovies[i]}</i></b>?</h3>
      <div class='form-group'>
          <label class='radio-inline'>
            <input type='radio' name='${selectedMovies[i]}' value='1' required>Within 1 year
          </label>
          <label class='radio-inline'>
            <input type='radio' name='${selectedMovies[i]}' value='1to5'>Between 1 and 5 years
          </label>
          <label class='radio-inline'>
            <input type='radio' name='${selectedMovies[i]}' value='6to10'>Between 6 and 10 years
          </label>
          <label class='radio-inline'>
            <input type='radio' name='${selectedMovies[i]}' value='gt10'>More than 10 years
          </label>
          <label class='radio-inline'>
            <input type='radio' name='${selectedMovies[i]}' value='-1'>I do not remember
          </label>
      </div>
    `)
  })
  // comment box
  $('#howLongAgo').append(`
    <div class="comment">
      <label>Comment(if any): </label> <br>
      <textarea rows='4' cols='50' name='comment'></textarea>
    </div>  
  `)
  $('.show-second-form').show()
})

// movie-tag question
$('.fold-2').on('click', '.show-second-form', function() {
  $('.fold-2').hide()
  $('.movie-question').removeClass('bg-info').addClass('progress-bar-striped progress-bar-animated')
  $.each(selectedMovies, function(i) {
    $('#tagDegree').prepend(`
      <h3>On a scale from 1 (not at all) to 5 (very much), how strongly does the tag <b><i>${tempTagArray[i]}</i></b> apply to the movie <b><i>${selectedMovies[i]}</i></b>. For example, the movie ${exampleSurveyTree[tempTagArray[i]].min} would have a low score, while the movie ${exampleSurveyTree[tempTagArray[i]].max} high
      </h3>
      <div class='form-group'>
        <label class='radio-inline'>
          <input type='radio' name='${selectedMovies[i]}' value='1' required>1
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${selectedMovies[i]}' value='2'>2
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${selectedMovies[i]}' value='3'>3
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${selectedMovies[i]}' value='4'>4
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${selectedMovies[i]}' value='5'>5
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${selectedMovies[i]}' value='-1'>Not sure
        </label>
      </div>
      <h3>On a scale from 1 (not at all) to 5 (very much), how easy was it to attach the tag <b><i>${tempTagArray[i]}</i></b> to the movie <b><i>${selectedMovies[i]}</i></b>
      </h3>
      <div class='form-group'>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='1' required>1
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='2'>2
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='3'>3
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='4'>4
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='5'>5
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='-1'>Not sure
        </label>
      </div>
      <hr>
      <br>
    `)
  })
  // comment box
  $('#tagDegree').append(`
    <div class="comment">
      <label>Comment(if any): </label> <br>
      <textarea rows='4' cols='50' name='comment'></textarea>
    </div>  
  `)
  $('.show-third-form').show()
})

// tag question 
$('.fold-3').on('click', '.show-third-form', function() {
  $('.fold-3').hide()
  $('.movie-tag-question').removeClass('bg-info').addClass('progress-bar-striped progress-bar-animated')
  $.each(tempTagArray, function(i) {
    $('#tagDifficulty').prepend(`
      <h3>On a scale from 1 (not at all) to 5 (very much), to what degree are you familiar with the meaning of the tag <b><i>${tempTagArray[i]}</i></b>
      </h3>
      <div class='form-group'>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='1' required>1
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='2'>2
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='3'>3
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='4'>4
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='5'>5
        </label>
        <label class='radio-inline'>
          <input type='radio' name='${tempTagArray[i]}' value='-1'>Not sure
        </label>
      </div>
      <div class='form-group'>
        <h3>Please write down the definition of the tag <b><i>${tempTagArray[i]}</i></b>
        </h3>
        <br>
        <textarea rows='4' cols='50' name='name' required></textarea>
      </div>
      <hr>
      <br>
    `)
  })

  // comment
  $('#tagDifficulty').append(`
    <div class="comment">
      <label>Comment(if any): </label> <br>
      <textarea rows='4' cols='50' name='comment'></textarea>
    </div>  
  `)

  $('.show-fourth-form').show()
})

// final submit
$('.fold-4').on('click', '.show-fourth-form', function() {
  $('.tag-question').removeClass('bg-info').addClass('progress-bar-striped progress-bar-animated')
})
