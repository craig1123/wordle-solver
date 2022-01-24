const words = require("./words.js");
const allWords = require("./allWords.js");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form");
  const guesses = document.getElementById("guesses");
  const restart = document.getElementById("restart");
  const firstLetter = document.getElementById("letter1");
  const possibleWords = document.getElementById("possible-words");
  const wordCount = document.getElementById("word-count");
  const mostCommon = document.getElementById("most-common");

  let guessedWords = [];
  form.addEventListener("submit", onSubmit);
  restart.addEventListener("click", onRestart);

  for (let i = 1; i <= 5; i++) {
    const letterEl = document.getElementById(`letter${i}`);
    letterEl.addEventListener("keyup", onKeyUp);
    letterEl.addEventListener("click", onClick);
  }

  function onKeyUp(e) {
    const { value, id } = e.target;

    // delete button
    if (e.keyCode === 8 && !value) {
      const currentIndex = Number(id.replace("letter", ""));
      const nextInput = document.getElementById(`letter${currentIndex - 1}`);
      if (nextInput) {
        nextInput.focus();
      }
      return;
    }

    const regex = /[a-zA-Z]+$/; // only letters
    if (!value.match(regex)) {
      e.target.value = "";
      return;
    }
    const currentIndex = Number(id.replace("letter", ""));
    const nextInput = document.getElementById(`letter${currentIndex + 1}`);
    if (nextInput) {
      nextInput.focus();
    } else {
      form.elements[6].focus(); // button
    }
  }

  function onRestart() {
    guessedWords = [];
    wordCount.textContent = "Possible Words";
    Array.from(guesses.children).forEach((child) => {
      if (child.className === "row guess-row") {
        child.remove();
      }
    });
    // reset possible words
    while (possibleWords.firstChild) {
      possibleWords.removeChild(possibleWords.lastChild);
    }
    resetForm();
  }

  function onClick(e) {
    const { dataset, value } = e.target;
    if (!value) {
      return;
    }
    switch (dataset.valid) {
      case "1": {
        e.target.dataset.valid = "2";
        e.target.className = "tile correct";
        break;
      }
      case "2": {
        e.target.dataset.valid = "0";
        e.target.className = "tile";
        break;
      }

      default: {
        e.target.dataset.valid = "1";
        e.target.className = "tile present";
        break;
      }
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const word = [];
    for (let i = 0; i < 5; i++) {
      const { value, dataset } = e.target.elements[i];
      if (!value) {
        break;
      }
      word.push({ letter: value, valid: Number(dataset.valid) });
    }

    if (word.length !== 5) {
      return;
    }

    const row = document.createElement("div");
    row.className = "row guess-row";
    word.forEach((el) => {
      const tile = document.createElement("div");
      let validClass = "";
      if (el.valid === 2) {
        validClass = "correct";
      } else if (el.valid === 1) {
        validClass = "present";
      }
      tile.className = `tile small-tile ${validClass}`;
      tile.dataset.valid = el.valid;
      tile.textContent = el.letter;
      row.appendChild(tile);
    });
    guessedWords.push(word);
    guesses.appendChild(row);

    resetForm();

    const possibleWordles = wordle(word, guessedWords);
    const possibleWordlesLength = possibleWordles.length;
    wordCount.textContent = `Total Possible Words: ${possibleWordlesLength}`;

    possibleWordles.forEach((word) => {
      const item = document.createElement("li");
      item.textContent = word;
      possibleWords.appendChild(item);
    });

    const commonLetters = mostCommonLetters(
      possibleWordles,
      guessedWords.join("")
    );
    commonLetters.forEach((word) => {
      const item = document.createElement("li");
      const [key, value] = Object.entries(word)[0];
      item.textContent = `${key}: ${value}`;
      mostCommon.appendChild(item);
    });

    return false;
  }

  function resetForm() {
    // reset form
    for (let i = 0; i < 5; i++) {
      form.elements[i].className = "tile";
      form.elements[i].dataset.valid = "0";
    }
    form.reset();
    firstLetter.focus();
    // remove possible words
    while (possibleWords.firstChild) {
      possibleWords.removeChild(possibleWords.lastChild);
    }
    // remove most common letters
    while (mostCommon.firstChild) {
      mostCommon.removeChild(mostCommon.lastChild);
    }
  }
});

function wordle(input, guessedWords) {
  let possibleWords = [];

  const incorrectGuessedLetters = guessedWords
    .flat()
    .map((word) => (word.valid === 0 ? word : null))
    .filter(Boolean);

  const validLetters = guessedWords
    .map((words) =>
      words
        .map((word, index) => {
          if (word.valid === 0) {
            return null;
          } else if (word.valid === 2) {
            return {
              ...word,
              index,
            };
          }
          return word;
        })
        .filter(Boolean)
    )
    .flat();

  words
    .filter((word) => {
      // filter out all the words that include the bad guessed letters
      let hasGuessedLetter = true;
      incorrectGuessedLetters.forEach(({ letter }) => {
        if (hasGuessedLetter && word.includes(letter)) {
          hasGuessedLetter = false;
        }
      });
      return hasGuessedLetter;
    })
    .forEach((word) => {
      // figure out if it should be pushed
      let pushIt = false;
      for (let i = 0; i < input.length; i++) {
        const el = input[i];
        const letterIsInWord = word.includes(el.letter);
        if (el.valid === 1 && letterIsInWord) {
          if (word[i] === el.letter) {
            pushIt = false;
            break; // yellow can't the letter in the exact spot
          }
          pushIt = true;
        } else if (el.valid === 2 && !letterIsInWord) {
          pushIt = false;
          break;
        } else if (el.valid === 2 && letterIsInWord && word[i] === el.letter) {
          pushIt = true; // all words have to have the letter in the exact place
        } else if (el.valid === 2 && letterIsInWord && word[i] !== el.letter) {
          pushIt = false;
          break;
        } else if (el.valid === 0 && !letterIsInWord) {
          pushIt = true;
        }
      }

      // word needs to have all yellow and green letters in word
      let hasAll = true;
      validLetters.forEach(({ valid, letter, index }) => {
        if (!word.includes(letter)) {
          hasAll = false;
        } else if (valid === 2 && word[index] !== letter) {
          hasAll = false;
        }
      });
      if (hasAll && pushIt) {
        possibleWords.push(word);
      }
    });

  return possibleWords;
}

function mostCommonLetters(possibles, used) {
  const mapOfLetters = {};
  possibles.forEach((word) => {
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      if (used.includes(letter)) {
        continue;
      }
      if (mapOfLetters[letter]) {
        mapOfLetters[letter]++;
      } else {
        mapOfLetters[letter] = 1;
      }
    }
  });

  return Object.keys(mapOfLetters)
    .sort((a, b) => mapOfLetters[b] - mapOfLetters[a])
    .map((letter) => ({ [letter]: mapOfLetters[letter] }));
}

// uncomment below and enter up to 5 letters. It'll spit out the best word to try next
// const bestWordsToTry = getBestWord(['', '', '', '', '']);
// console.log('best words to try next:', bestWordsToTry);
// console.log('Best Word in possible words:', isBestWordAPossible(possibleWords, bestWordsToTry));

// use this if you want to find a word to use
function getBestWord(topLetters) {
  return allWords.slice().filter((word) => {
    let hasAll = true;
    topLetters.forEach((letter) => {
      if (hasAll && !word.includes(letter)) {
        hasAll = false;
      }
    });
    return hasAll;
  });
}

function isBestWordAPossible(possibles, bests) {
  const morePossible = [];
  possibles.forEach((word) => {
    if (bests.includes(word)) {
      morePossible.push(word);
    }
  });
  return morePossible;
}
