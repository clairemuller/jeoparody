const baseURL = 'http://localhost:3000/';
const herokuURL = 'https://jeoparody.herokuapp.com/';
let introDiv = document.getElementById('intro');
let form = document.getElementById('login');
let gameDiv = document.getElementById('game');
let overlay = document.getElementById('overlay');
let overlayContent = document.getElementById('overlay-content');
let score = 0;
let sidebar = document.createElement('div');
sidebar.id = 'sidebar';
sidebar.innerHTML = `SCORE<br>$${score}`;
let currentClue = "";
let clickedCount = 0;
let currentUser = '';

// 1 - USER CLICKS PLAY NEW GAME
document.getElementById('submit').addEventListener("click", function(e){
  e.preventDefault();
  username = document.getElementById('username').value.toLowerCase();
  findUser(username);
})

// 2 - FIND OR CREATE USER; CREATE NEW GAME
function findUser(username) {
  console.log('click!');
  fetch(herokuURL + 'users', {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({username: username})
  })
  .then(res => res.json())
  .then(user => {
    currentUser = user;
  })
  startFetch();
}

// 3 - ONCE LOGGED IN
function startFetch() {
  displayRules();
  fetch(herokuURL + 'categories')
  .then(res => res.json())
  .then(categories => {
    setTimeout(() => renderNewGame(categories), 5000);
  });
}

// 3.5 - DISPLAY RULES FOR 5 SECONDS
function displayRules() {
  let rulesP = document.createElement('p');
  rulesP.id = 'rules';
  rulesP.innerHTML = `
    <hr>
    <h2>HERE'S HOW THIS WORKS:</h2>\
    YOU'RE COMPETING AGAINST YOURSELF!<br>\
    ONCE YOU SELECT A CLUE, YOU HAVE 7 SECONDS<br>\
    TO COME UP WITH THE ANSWER<br>\
    <h2>HAVE FUN!</h2>\
    `;
  introDiv.removeChild(form);
  introDiv.appendChild(rulesP);
}

// 4 - CREATE NEW GAME BOARD
function renderNewGame(categories) {
  introDiv.style.display = 'none';
  gameDiv.style.display = 'block';
  categories = fixClueCount(categories);
  categories = getFive(categories);
  categories.forEach(category => {
    if (category.clues.length > 5) {
      category.clues = getFive(category.clues);
    }
    return category;
  })
  categories.forEach(category => renderColumn(category));
  gameDiv.appendChild(sidebar);
}

// 5 - REMOVE CATEGORIES WITH LESS THAN 5 CLUES
function fixClueCount(categories) {
  const newCats = categories.filter(category => {
    return category.clues.length >= 5;
  })
  return newCats;
}

// 6 - GET FIVE RANDOM CATEGORIES OR CLUES
function getFive(arr) {
  let five = [];
  let numsUsed = [];
  while (five.length < 5) {
    let num = Math.floor(Math.random() * arr.length);
    if (!numsUsed.includes(num)) {
      five.push(arr[num]);
      numsUsed.push(num);
    }
  }
  return five;
}

// 7 - CREATE COLUMN
function renderColumn(category) {
  const column = document.createElement('div');
  const title = document.createElement('div');

  column.classList.add('column');
  title.classList.add('title');
  title.textContent = category.title.toUpperCase();
  column.appendChild(title);

  renderClues(category, column)
  gameDiv.appendChild(column);
}

// 8 - CREATE CLUES FOR COLUMN
function renderClues(category, column) {
  // CREATE EACH CLUE
  let dollar = 0;
  for (let i = 0; i < category.clues.length; i++) {
    dollar += 200
    // ADD DOLLAR AMOUNT
    const clueDiv = document.createElement('div');
    clueDiv.classList.add('clue');
    clueDiv.id = dollar
    clueDiv.innerText = `$${dollar}`;
    // ADD EVENT LISTENER
    clueDiv.addEventListener('click', () => {
      currentClue = category.clues[i];
      currentClue["dollar"] = clueDiv.id;
      // REMOVE EVENT LISTENER
      if (clueDiv.classList.contains('clicked')) {
        return;
      }
      clueDiv.classList.add('clicked');
      clickedCount += 1;
      displayQuestion();
    })
    column.appendChild(clueDiv);
  }
}

// 9 - ON CLICK DISPLAY QUESTION
function displayQuestion() {
  currentClue.question = removeHTML(currentClue.question);
  gameDiv.style.display = 'none';
  overlay.style.display = 'block';
  let questionDiv = document.getElementById('question');
  questionDiv.innerText = currentClue.question.toUpperCase();
  setTimeout(() => displayAnswer(), 7000);
}

// 9.5 - REMOVE HTML TAGS & ESCAPE CHARS
function removeHTML(element) {
  if (element.includes('<i>')) {
    element = element.replace(/<[^>]*>/g, '');
  }
  if (element.includes("\\'")) {
    element = element.replace("\\'", "'");
  }
  return element;
}

// 10 - AFTER 5 SECONDS DISPLAY ANSWER
function displayAnswer() {
  currentClue.answer = removeHTML(currentClue.answer);
  let answerDiv = document.getElementById('answer');
  answerDiv.innerText = currentClue.answer.toUpperCase();
  setTimeout(() => correct(), 2000);
}

function correct() {
  let correctDiv = document.getElementById('correct');
  correctDiv.innerText = 'WERE YOU CORRECT? Y/N';
  document.body.addEventListener("keydown", yesOrNo);
}

function yesOrNo() {
  // IF YES
  if (event.keyCode === 89) {
    score += parseInt(currentClue.dollar);
    sidebar.innerHTML = `SCORE<br>$${score}`;
    finishClue();
  }
  // IF NO
  if (event.keyCode === 78) {
    finishClue();
  }
}

// 11 - BRING BACK GAME BOARD
function finishClue() {
  document.body.removeEventListener("keydown", yesOrNo);
  let question = document.getElementById('question');
  let answer = document.getElementById('answer');
  let correct = document.getElementById('correct');
  question.textContent = '';
  answer.textContent = '';
  correct.textContent = '';

  if (clickedCount === 25) {
    setTimeout(() => endGame(), 1000);
  } else {
    overlay.style.display = 'none';
    gameDiv.style.display = 'block';
  }
}

function endGame() {
  updateDbScore();
  question.textContent = "GAME OVER!";
  answer.textContent = `FINAL SCORE: $${score}`;
}

function updateDbScore() {
  fetch(herokuURL + `users/${currentUser.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({username: currentUser.username, score: score})
  })
}
