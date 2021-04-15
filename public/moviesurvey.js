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
  $('#movieList').prepend("<div class='checkbox'><label><input type='checkbox' name='movieNames' value='" + movieNames[i] + "'>" + movieNames[i] + "</label></div>")
})

// movie selection
$('#movieList').on('click', 'input[name="movieNames"]', function() {
  if (this.checked === true) {
    if (selectedMovies.length === 3) {
      alert('You have already selected 3 movies')
      return false;
    }
    selectedMovies.push(this.value)
    if (selectedMovies.length === 3) {
      $('.show-form').show()
    }
    $('.selectedNum').html(selectedMovies.length)
    $('.remainingNum').html(3 - selectedMovies.length)
    $('ul.selected-movies').empty()
    $.each(selectedMovies, function(i) {
      $('ul.selected-movies').append("<li>" + selectedMovies[i] + "</li>")
    })
  } else {
    selectedMovies.pop(this.value)
    $('.selectedNum').html(selectedMovies.length)
    $('.remainingNum').html(3 - selectedMovies.length)
    $('ul.selected-movies').empty()
    $.each(selectedMovies, function(i) {
      $('ul.selected-movies').append("<li>" + selectedMovies[i] + "</li>")
    })
  }
})

// movie question
$('.selected-view').on('click', '.show-form', function() {
  $('.fold-1').hide()
  $('.progress-bar').css("width", "25%");
  $('.progress-bar').html('movie selection')
  $.each(selectedMovies, function(i) {
    $('#howLongAgo').prepend("<h3>How long ago did you watch <b>" + selectedMovies[i] + "</b>?</h3><div class='form-group'><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='1' required>Within 1 year</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='1to5'>Between 1 and 5 years</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='6to10'>Between 6 and 10 years</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='gt10'>More than 10 years</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='-1'>I do not rememmber</label></div>")
  })
  $('.show-second-form').show()
})

// movie-tag question
$('.fold-2').on('click', '.show-second-form', function() {
  $('.fold-2').hide()
  $('.progress-bar').css("width", "50%");
  $('.progress-bar').html('movie question')
  $.each(selectedMovies, function(i) {
    $('#tagDegree').prepend("<h3>On a scale from 1 (not at all) to 5 (very much), how strongly does the tag <b>" + tempTagArray[i] + "</b> apply to the movie <b>" + selectedMovies[i] + "</b>. For example, the movie " + exampleSurveyTree[tempTagArray[i]].min + " would have a low score, while the movie " + exampleSurveyTree[tempTagArray[i]].max + " high</h3><div class='form-group'><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='1' required>1</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='2'>2</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='3'>3</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='4'>4</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='5'>5</label><label class='radio-inline'><input type='radio' name='" + selectedMovies[i] + "' value='-1'>Not sure</label></div><h3>On a scale from 1 (not at all) to 5 (very much), how easy was it to attach the tag <b>" + tempTagArray[i] + "</b> to the movie <b>" + selectedMovies[i] + "</b></h3><div class='form-group'><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='1' required>1</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='2'>2</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='3'>3</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='4'>4</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='5'>5</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='-1'>Not sure</label></div><br>")
  })
  $('.show-third-form').show()
})

// tag question 
$('.fold-3').on('click', '.show-third-form', function() {
  $('.fold-3').hide()
  $('.progress-bar').css("width", "75%");
  $('.progress-bar').html('movie-tag question')
  $.each(tempTagArray, function(i) {
    $('#tagDifficulty').prepend("<h3>On a scale from 1 (not at all) to 5 (very much), to what degree are you familiar with the meaning of the tag <b>" + tempTagArray[i] + "</b></h3><div class='form-group'><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='1' required>1</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='2'>2</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='3'>3</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='4'>4</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='5'>5</label><label class='radio-inline'><input type='radio' name='" + tempTagArray[i] + "' value='-1'>Not sure</label></div><div class='form-group'><label>Please write down the definition of the tag <b>" + tempTagArray[i] + "</b></label><br><textarea rows='4' cols='50' name='name' required></textarea></div>")
  })
  $('.show-fourth-form').show()
})

// final submit
$('.fold-4').on('click', '.show-fourth-form', function() {
  $('.progress-bar').css("width", "100%");
  $('.progress-bar').html('tag question')
})