"use strict";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
let ws;
let player_mark;
let boardEventListenerFunction;
let canMove;
let my_username;
let other_player;

// window.location.replace("/game");
window.addEventListener("load", app);

let gameBoard = ["", "", "", "", "", "", "", "", ""];

// INITIALIZE APP
function app() {
  ws = adonis.Ws().connect();
  ws.on("open", (socket) => {
    fetch("/socket-id", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        socket_id: socket.connId,
      }),
    })
      .then(() => {
        $(".wrap").style.display = "none";
      })
      .catch((error) => {
        $(".wrap").style.display = "none";
        alert("Something went wrong, please reload");
        console.error(error);
      });
    subscribeToChannel();
    checkForExistingGame();
    initializeVariables();
  });

  const boardMain = document.querySelector(".board__main");
  boardMain.classList.remove("hide-container");

  buildBoard();
  loadEventListeners();
}

function buildBoard() {
  const allCells = document.querySelectorAll(".board__cell");
  const cellHeight = allCells[0].offsetWidth;

  allCells.forEach((cell) => {
    cell.style.height = `${cellHeight}px`;
  });

  boardEventListenerFunction = ({ target }) => {
    if (target.classList.contains("board__cell")) {
      const board_address = target.children[0].dataset.id;
      if (canMove) {
        makeMove(board_address);
        canMove = false;

        document.querySelector(
          `[data-id='${board_address}']`
        ).textContent = player_mark;
      }
    }
  };
  $(".board__container").addEventListener("click", boardEventListenerFunction);
}

function subscribeToChannel() {
  const game = ws.subscribe("tic-tac-toe");
  const updateBoard = (response) => {
    const cellToAddToken = document.querySelector(
      `[data-id='${response.cell}']`
    );
    cellToAddToken.textContent = response.other_player_mark;
  };

  game.on("gameDoesExist", ({ board, winnerState }) => {
    board.forEach((cell, index) => {
      $(`[data-id='${index}']`).textContent = cell;
    });

    if (winnerState.status === "win") {
      paintWinningMoves(winnerState.sequence);
      setWinnerMessage(winnerState.player);
      disableBoard();
      displayRematchButton(winnerState.player);
    } else if (winnerState.status === "draw") {
      disableBoard();
      updateTurnNotification(
        "It's a draw. Try outsmarting your opponent next time."
      );
    }
  });

  game.on("playAgainRequest", ({ username }) => {
    const playAgainModal = new bootstrap.Modal($("#play-again-modal"));
    $("#play-again-modal #other-player-username").textContent = username;

    playAgainModal.show();

    $("#lets-play-again").onclick = () => {
      game.emit("playAgain", { status: "accepted" });
    };

    $("#i-am-done-playing").onclick = () => {
      game.emit("playAgain", { status: "rejected" });
    };
  });

  game.on("restartGame", () => {
    window.location.reload();
  });

  game.on("endGame", () => {
    window.location.href = "/";
  });

  game.on("otherPlayerMove", (response) => {
    updateBoard(response);
    canMove = true;
    updateTurnNotification(`It's your turn`);
  });
  game.on("draw", (response) => {
    updateBoard(response);
    updateTurnNotification(
      "It's a draw. Try outsmarting your opponent next time."
    );
  });
  game.on("playerWins", (response) => {
    updateBoard(response);

    setWinnerMessage(response.player);
    paintWinningMoves(response.sequence);
    updateScore(response.score_info);
    disableBoard();
    displayRematchButton(response.player);
  });
}

function makeMove(cell) {
  ws.getSubscription("tic-tac-toe").emit("boardMove", {
    cell,
  });
  updateTurnNotification(`It's ${other_player}'s turn`);
}

function checkForExistingGame() {
  ws.getSubscription("tic-tac-toe").emit("checkForExistingGame");
}

function loadEventListeners() {
  $("#rematch-button").onclick = () => {
    ws.getSubscription("tic-tac-toe").emit("requestRematch");
  };
}

async function initializeVariables() {
  try {
    const response = await fetch("/game/variables");
    const data = await response.json();

    player_mark = data.player_mark;
    canMove = data.canMove;
    my_username = data.my_username;
    other_player = data.other_player;

    if (data.canMove) {
      updateTurnNotification("It's your turn");
    } else {
      updateTurnNotification(`It's ${other_player}'s turn`);
    }
  } catch (error) {
    alert("An error occured, please reload");
  }
}

function paintWinningMoves(sequence) {
  sequence.forEach((cell) => {
    $$(`[data-id='${cell}']`).forEach((node) => {
      node.classList.add("board__cell--winner");
    });
  });
}

function disableBoard() {
  $(".board__container").removeEventListener(
    "click",
    boardEventListenerFunction
  );
}

function setWinnerMessage(player) {
  if (player === my_username) {
    updateTurnNotification(`Congrats ${player}, you won!`);
  } else {
    updateTurnNotification(
      `${player} won this round. We can't accept defeat, challenge them now!`
    );
  }
}

function updateScore(score_info) {
  $(`#${score_info.player}_score`).textContent = score_info.score;
}

function updateTurnNotification(msg) {
  $("#turn-notification-message").textContent = msg;
}

function displayRematchButton(player) {
  if (player !== my_username) {
    $("#rematch-button").classList.remove("d-none");
  }
}
