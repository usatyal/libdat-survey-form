// moviesurvey.js

MOVIE_NUMBER = 10

var turkID  = ''

function showValidationError(){
  alert("Please check all the fields")
}

// imdb link
function generateImdbLink (item) {
  if(imdbLinks[item] > 100000 && imdbLinks[item] !== 'undefined') {
    return 'https://www.imdb.com/title/tt0'+ imdbLinks[item]
  } else if (imdbLinks[item] <= 100000 && imdbLinks[item] !== 'undefined') {
    return 'https://www.imdb.com/title/tt00'+ imdbLinks[item] 
  } else {
    return 'https://www.imdb.com/title/tt00'
  }
}

// movie and tag names
let movieNames = Object.keys(surveyTree)

// sort movies randomly and insert fake movies
function shuffle(array) {
  var current = array.length;
  while (current !== 0) {
    // picking a random element
    rndIndex = Math.floor(Math.random() * current);
    current -= 1;

    // swapping it with the current one
    tmp = array[current];
    array[current] = array[rndIndex];
    array[rndIndex] = tmp;
  }
}

var fakeMovies = ['Dad, I am back 2 (1992)', 'Loose Limbs 5 (1998)', 'Operation Ringlet (2001)']

function prepareRandomMovieNames(surveyTree) {
  movieNames = Object.keys(surveyTree)
  array = []
  for(i = 0; i < movieNames.length; i++) {
    array.push(movieNames[i])
  }
  shuffle(array)
  array.splice(1, 0, fakeMovies[0])
  array.splice(3, 0, fakeMovies[1])
  array.splice(6, 0, fakeMovies[2])
  return array
}

// pop value from object
function removeByAttr (arr, attr, value){
    var i = arr.length;
    while(i--){
       if( arr[i] 
           && arr[i].hasOwnProperty(attr) 
           && (arguments.length > 2 && arr[i][attr] === value ) ){ 

           arr.splice(i,1);

       }
    }
    return arr;
}

var randomMovieNames = prepareRandomMovieNames(surveyTree)

let selectedMovies = []

// render movie names to select
$.each(randomMovieNames, function(i) {
  $('#movieList').append(`
    <div class='checkbox'>
      <label>
        <input type='checkbox' name='movieNames' value="${randomMovieNames[i]}"> 
        ${randomMovieNames[i]} 
        <a href="${generateImdbLink(randomMovieNames[i])}" target="_blank">See more&gt;</a>
      </label>
    </div>
  `)
})
$('#movieList').append(`
  <button type='button' id='notEnoughMovies' class='btn btn-primary' style='display: none;'>
    I can’t find more movies
  </button>
`)

// movie selection
$('#movieList').on('click', 'input[name="movieNames"]', function() {
  const movie = {}
  if (this.checked === true) {
    if (selectedMovies.length === MOVIE_NUMBER) {
      alert('You have already selected ' + MOVIE_NUMBER + ' movies')
      return false;
    }
    movie['name'] = this.value
    if (surveyTree[this.value] && surveyTree[this.value].length > 0) {
      movie['tag'] = surveyTree[this.value][Math.floor(Math.random() * surveyTree[this.value].length)]
    } else {
      movie['tag'] = 'fakeMovie'
    }
    selectedMovies.push(movie)

    // next button when there are three selected items
    if (selectedMovies.length === MOVIE_NUMBER) {
      $('.show-form').show()
    }

    // when user selects at least one item
    if (selectedMovies.length > 0) {
      $('#notEnoughMovies').show()
    }
    $('.selectedNum').html(selectedMovies.length)
    $('.remainingNum').html(MOVIE_NUMBER - selectedMovies.length)
    $('ul.selected-movies').empty()
    $.each(selectedMovies, function(i) {
      $('ul.selected-movies').append(`
        <li>
          <a href="${generateImdbLink(selectedMovies[i].name)}" target="_blank"> 
            ${selectedMovies[i].name} 
          </a>
        </li>
      `)
    })
    // console.log(selectedMovies)
  } else {
    removeByAttr(selectedMovies, 'name', this.value)
    // hide the button if disselected all
    if (selectedMovies.length === 0) {
      $('#notEnoughMovies').hide()
    }
    // hide the next button if less than needed selected
    if (selectedMovies.length < MOVIE_NUMBER) {
      $('.show-form').hide()
    }
    $('.selectedNum').html(selectedMovies.length)
    $('.remainingNum').html(MOVIE_NUMBER - selectedMovies.length)
    $('ul.selected-movies').empty()
    $.each(selectedMovies, function(i) {
      $('ul.selected-movies').append(`
        <li>
          <a href="${generateImdbLink(selectedMovies[i].name)}" target="_blank"> 
            ${selectedMovies[i].name}
          </a>
        </li>
      `)
    })
  }
})

// movie question
$('.selected-view, #movieListContainer').on('click', '.show-form, #notEnoughMovies', function() {
  // ajax request to send initial movie selection
  if ($('#selectMovie')[0].checkValidity()) {
    turkID = $('input[name="turkID"]').val()
    $.ajax ({
      url: 'insertMovieSelection',
      type: 'post',
      data: $('form#selectMovie').serialize(),
      success: function(data) {    
        if (data) {
          localStorage.setItem("UID", data.UID)
          
          // check fake tag 
          if((selectedMovies.map(a => a.tag)).includes('fakeMovie')) {
            alert('You selected fake movies. Your Turk ID is banned. If you take this survey again, we will reject your answers.')
            return
          }

          // if fake check passes, then only show this
          $('.fold-1').hide()
          $('.fold-2').show()
          window.scrollTo(0, 0)
          $('.movie-selection').removeClass('bg-info').addClass('progress-bar-striped progress-bar-animated')
          $.each(selectedMovies, function(i) {
            $('#howLongAgo').prepend(`
              <h3>How long ago did you watch 
                <a href="${generateImdbLink(selectedMovies[i].name)}" target="_blank"> 
                    <b><i> ${selectedMovies[i].name}</i></b>
                  </a>?
              </h3>
              <div class='form-group'>
                  <label class='radio-inline'>
                    <input type='radio' name="${selectedMovies[i].name}" value='1' required> Within the last 12 months
                  </label>
                  <label class='radio-inline'>
                    <input type='radio' name="${selectedMovies[i].name}" value='1to5'>Between 1 and 5 years
                  </label>
                  <label class='radio-inline'>
                    <input type='radio' name="${selectedMovies[i].name}" value='6to10'>Between 6 and 10 years
                  </label>
                  <label class='radio-inline'>
                    <input type='radio' name="${selectedMovies[i].name}" value='gt10'>More than 10 years
                  </label>
                  <label class='radio-inline'>
                    <input type='radio' name="${selectedMovies[i].name}" value='-1'>I do not remember
                  </label>
              </div>
            `)
          })
          // comment box
          $('#howLongAgo').append(`
            <div class="comment">
              <label>Please let us know if there is anything wrong with the survey </label> <br>
              <textarea rows='4' cols='50' name='comment'></textarea>
            </div>  
          `)
          $('.show-second-form').show()
        }

      }
    })
  } else {
    showValidationError()
    return
  }
})

// movie-tag question
$('.fold-2').on('click', '.show-second-form', function() {
  // ajax request to send the answer of how long ago you watched these movies
  if ($('#howLongAgo')[0].checkValidity()) {
    $.ajax ({
      url: 'insertHowLongAgo',
      type: 'post',
      data: $('form#howLongAgo').serialize()+ "&UID=" + localStorage.getItem('UID'),
      success: function(data) {
        // success
      }
    })
  } else {
    showValidationError()
    return
  }
  $('.fold-2').hide()
  $('.fold-3 .jumbotron').show()
  window.scrollTo(0, 0)
  $('.movie-question').removeClass('bg-info').addClass('progress-bar-striped progress-bar-animated')
  $.each(selectedMovies, function(i) {
    $('#tagDegree').prepend(`
      <h3>On a scale from 1 to 5, how strongly does the tag 
      <a href="https://www.google.com/search?q=${selectedMovies[i].tag}" target="_blank">
        <b><i>${selectedMovies[i].tag}</i></b>
      </a> 
      apply to 
      <a href="${generateImdbLink(selectedMovies[i].name)}" target="_blank">
        <b><i>${selectedMovies[i].name}</i></b>
      </a>
      ?
      </h3>
      <div class='form-group movie'>
        <label class='radio-inline'>
          <input type='radio' data-tag="${selectedMovies[i].tag}" name="${selectedMovies[i].name}" value='1' required>1 (Not at all)
        </label>
        <label class='radio-inline'>
          <input type='radio' data-tag="${selectedMovies[i].tag}" name="${selectedMovies[i].name}" value='2'>2
        </label>
        <label class='radio-inline'>
          <input type='radio' data-tag="${selectedMovies[i].tag}" name="${selectedMovies[i].name}" value='3'>3
        </label>
        <label class='radio-inline'>
          <input type='radio' data-tag="${selectedMovies[i].tag}" name="${selectedMovies[i].name}" value='4'>4
        </label>
        <label class='radio-inline'>
          <input type='radio' data-tag="${selectedMovies[i].tag}" name="${selectedMovies[i].name}" value='5'>5 (Very much)
        </label>
        <label class='radio-inline'>
          <input type='radio' data-tag="${selectedMovies[i].tag}" name="${selectedMovies[i].name}" value='-1'>Not sure
        </label>
      </div>
      <div>
         <p> High scoring example for 
             <a href="https://www.google.com/search?q=${selectedMovies[i].tag}" target="_blank">
               <b><i>${selectedMovies[i].tag}</i></b>
             </a> 
             is
             <a href="${generateImdbLink(exampleSurveyTree[selectedMovies[i].tag].max)}" target="_blank">
               <b><i>${exampleSurveyTree[selectedMovies[i].tag].max}</i></b>
             </a>.
          </p>
          <p> Low scoring example for 
             <a href="https://www.google.com/search?q=${selectedMovies[i].tag}" target="_blank">
               <b><i>${selectedMovies[i].tag}</i></b>
             </a> 
             is
             <a href="${generateImdbLink(exampleSurveyTree[selectedMovies[i].tag].min)}" target="_blank">
               <b><i>${exampleSurveyTree[selectedMovies[i].tag].min}</i></b>
             </a>.
          </p>
      </div>
      <h3>To what degree do you agree with the statement “it was easy for me to rate the tag 
        <a href="https://www.google.com/search?q=${selectedMovies[i].tag}" target="_blank">
          <b><i>${selectedMovies[i].tag}</i></b>
        </a>  
        of the movie
        <a href="${generateImdbLink(selectedMovies[i].name)}" target="_blank">
          <b><i>${selectedMovies[i].name}</i></b>
        </a>?
      </h3>
      <div class='form-group tag'>
        <label class='radio-inline'>
          <input type='radio' data-movie="${selectedMovies[i].name}" name="${selectedMovies[i].tag}" value='Strongly disagree' required> Strongly disagree
        </label>
        <label class='radio-inline'>
          <input type='radio' data-movie="${selectedMovies[i].name}" name="${selectedMovies[i].tag}" value='Disagree'> Disagree
        </label>
        <label class='radio-inline'>
          <input type='radio' data-movie="${selectedMovies[i].name}" name="${selectedMovies[i].tag}" value='Neither agree nor disagree'>Neither agree nor disagree
        </label>
        <label class='radio-inline'>
          <input type='radio' data-movie="${selectedMovies[i].name}" name="${selectedMovies[i].tag}" value='Agree'> Agree
        </label>
        <label class='radio-inline'>
          <input type='radio' data-movie="${selectedMovies[i].name}" name="${selectedMovies[i].tag}" value='Strongly agree'> Strongly agree
        </label>
      </div>
      <hr>
      <br>
    `)
  })
  // comment box
  $('#tagDegree').append(`
    <div class="comment">
      <label>Please let us know if there is anything wrong with the survey </label> <br>
      <textarea rows='4' cols='50' name='comment'></textarea>
    </div>  
  `)
  $('.show-third-form').show()
})


// tag question 
$('.fold-3').on('click', '.show-third-form', function() {
  // ajax request to send the answer of how long ago you watched these movies
  if ($('#tagDegree')[0].checkValidity()) {
    const movieTagArray = []
    const tagMovieArray = []
    $('#tagDegree .movie input[type=radio]:checked').each(function() {
     const obj = {}
     obj['UID'] = localStorage.getItem('UID')
     obj['movie'] = this.name
     obj['score'] = this.value
     obj['tag'] = $(this).data('tag')
     movieTagArray.push(obj);
    })
    $('#tagDegree .tag input[type=radio]:checked').each(function() {
     const obj = {}
     obj['UID'] = localStorage.getItem('UID')
     obj['tag'] = this.name
     obj['score'] = this.value
     obj['movie'] = $(this).data('movie')
     tagMovieArray.push(obj);
    })
    const postData = JSON.stringify({ movieTagArray: movieTagArray, tagMovieArray: tagMovieArray, message: [localStorage.getItem('UID'), $('#tagDegree textarea').val()] })
    $.ajax ({
      url: 'insertMovieTagQuestion',
      type: 'post',
      contentType: 'application/json',
      data: postData,
      success: function(data) {
        // success
      }
    })
  } else {
    showValidationError()
    return
  }
  $('.fold-3').hide()
  $('.fold-4 .jumbotron').show()
  window.scrollTo(0, 0)
  $('.movie-tag-question').removeClass('bg-info').addClass('progress-bar-striped progress-bar-animated')
  // get the unique tags
  let tempTagArray = [...new Set( selectedMovies.map(obj => obj.tag))]
  $.each(tempTagArray, function(i) {
    $('#tagDifficulty').prepend(`
      <h3>On a scale from 1 to 5, how familiar are you with the term 
      <a href="https://www.google.com/search?q=${tempTagArray[i]}" target="_blank">
        <b><i>${tempTagArray[i]}</i></b>
      </a> ?
      </h3>
      <div class='form-group familiar'>
        <label class='radio-inline'>
          <input type='radio' name="${tempTagArray[i]}" value='1' required>1 (not at all)
        </label>
        <label class='radio-inline'>
          <input type='radio' name="${tempTagArray[i]}" value='2'>2
        </label>
        <label class='radio-inline'>
          <input type='radio' name="${tempTagArray[i]}" value='3'>3
        </label>
        <label class='radio-inline'>
          <input type='radio' name="${tempTagArray[i]}" value='4'>4
        </label>
        <label class='radio-inline'>
          <input type='radio' name="${tempTagArray[i]}" value='5'>5 (very much)
        </label>
        <label class='radio-inline'>
          <input type='radio' name="${tempTagArray[i]}" value='-1'>Not sure
        </label>
      </div>
      <h3>On a scale from 1 to 5, how often do you watch movies that could be described as 
        <a href="https://www.google.com/search?q=${tempTagArray[i]}" target="_blank">
          <b><i>${tempTagArray[i]}</i></b>
        </a>?
      </h3>
      <div class='form-group how-often'>
        <label class='radio-inline'>
          <input type='radio' name='how_often_${tempTagArray[i]}' data-name="${tempTagArray[i]}" value='1' required>1 (never)
        </label>
        <label class='radio-inline'>
          <input type='radio' name='how_often_${tempTagArray[i]}' data-name="${tempTagArray[i]}" value='2'>2
        </label>
        <label class='radio-inline'>
          <input type='radio' name='how_often_${tempTagArray[i]}' data-name="${tempTagArray[i]}" value='3'>3
        </label>
        <label class='radio-inline'>
          <input type='radio' name='how_often_${tempTagArray[i]}' data-name="${tempTagArray[i]}" value='4'>4
        </label>
        <label class='radio-inline'>
          <input type='radio' name='how_often_${tempTagArray[i]}' data-name="${tempTagArray[i]}" value='5'>5 (very often)
        </label>
        <label class='radio-inline'>
          <input type='radio' name='how_often_${tempTagArray[i]}' data-name="${tempTagArray[i]}" value='-1'>Not sure
        </label>
      </div>
      <div class='form-group tag_definition'>
        <h3>Please write down three terms or phrases that you associate with 
        <a href="https://www.google.com/search?q=${tempTagArray[i]}" target="_blank">
          <b><i>${tempTagArray[i]}</i></b>
        </a> 
        </h3>
        <br>
        <input type='text' data-order="first" data-name="${tempTagArray[i]}" required>
        <input type='text' data-order="second" data-name="${tempTagArray[i]}" required>
        <input type='text' data-order='third' data-name="${tempTagArray[i]}" required>
      </div>
      <hr>
      <br>
    `)
  })

  // comment
  $('#tagDifficulty').append(`
    <div class="comment">
      <label>Please let us know if there is anything wrong with the survey </label> <br>
      <textarea rows='4' cols='50' name='comment'></textarea>
    </div>  
  `)

  $('.show-fourth-form').show()
})

// final submit
$('.fold-4').on('click', '.show-fourth-form', function() {
  const tagFamilarityArray = []
  const howOftenArray = []
  const tagDefinitionArray = []
  $('#tagDifficulty .familiar input[type=radio]:checked').each(function() {
     const obj = {}
     obj['UID'] = localStorage.getItem('UID')
     obj['tagname'] = this.name
     obj['tagfamilarity'] = this.value
     tagFamilarityArray.push(obj);
  })
  $('#tagDifficulty .how-often input[type=radio]:checked').each(function() {
     const obj = {}
     obj['UID'] = localStorage.getItem('UID')
     obj['tagname'] = $(this).data('name')
     obj['tagHowOftenValue'] = this.value
     howOftenArray.push(obj);
  })
  $('#tagDifficulty .tag_definition input').each(function() {
     const obj = {}
     obj['UID'] = localStorage.getItem('UID')
     obj['tagname'] = $(this).data('name')
     obj['ordervalue'] = $(this).data('order')
     obj['tagDefinition'] = this.value
     tagDefinitionArray.push(obj);
     console.log(obj)
     console.log(tagDefinitionArray)
  })   
  const postData = JSON.stringify({ tagFamilarityArray: tagFamilarityArray, howOftenArray: howOftenArray, tagDefinitionArray: tagDefinitionArray, message: [localStorage.getItem('UID'), $('#tagDifficulty textarea[name=comment]').val()] })
  // console.log(postData)
  if ($('#tagDifficulty')[0].checkValidity()) {
    $.ajax ({
      url: 'tagQuestion',
      type: 'post',
      contentType: 'application/json',
      data: postData,
      success: function(data) {
        $('.fold-4').hide()
        $('.container').html(`Thank you for taking part in the survey. Your unique id is <b><i> ${localStorage.getItem('UID')+turkID} </i></b>`)
      }
    })
  } else {
    showValidationError()
    return
  }
  $('.tag-question').removeClass('bg-info').addClass('progress-bar-striped progress-bar-animated')
})
