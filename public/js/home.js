let socket_id;
let ws;
const $ = (selector) => document.querySelector(selector);

setTimeout(() => {
  if ($("#success-alert")) {
    $("#success-alert").remove();
  }
}, 3000);

window.onload = () => {
  setSocketId();
  generalStuff();
};

const generalStuff = () => {
  if ($("#copy-code-button")) {
    $("#copy-code-button").onclick = function () {
      copyToClipboard($("#game-code-input"));
      this.textContent = "copied";

      setTimeout(() => {
        this.textContent = "copy";
      }, 1500);
    };
  }
};

const setSocketId = () => {
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
        setUpConnection();
      })
      .catch((error) => {
        alert("Something went wrong, please reload");
        console.error(error);
      });
  });
};

const setUpConnection = () => {
  const game = ws.subscribe("tic-tac-toe");

  game.on("startGame", () => {
    window.location.href = "/game";
  });
};
