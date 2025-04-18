const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const resultado = document.getElementById("resultado");
const resetBtn = document.getElementById("reset-btn");
const scanBtn = document.getElementById("scan-btn");

let codigosValidos = [];
let escaneando = false;

fetch('codigos_validos.json')
  .then(res => res.json())
  .then(data => {
    codigosValidos = data.codigos;
  })
  .catch(err => {
    resultado.textContent = "Error cargando los códigos válidos.";
    console.error(err);
  });

scanBtn.addEventListener("click", () => {
  iniciarCamara();
  scanBtn.hidden = true;
  video.hidden = false;
});

function iniciarCamara() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      video.setAttribute("playsinline", true);
      escaneando = true;
      requestAnimationFrame(tick);
    })
    .catch(err => {
      resultado.textContent = "Error al acceder a la cámara.";
      console.error(err);
    });
}

function tick() {
  if (!escaneando) return;

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const codigo = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    if (codigo) {
      validarCodigo(codigo.data);
    }
  }

  requestAnimationFrame(tick);
}

let ultimoCodigo = "";
let ultimoTiempo = 0;

function validarCodigo(texto) {
  if (texto === ultimoCodigo && (Date.now() - ultimoTiempo < 3000)) {
    return;
  }

  ultimoCodigo = texto;
  ultimoTiempo = Date.now();
  resetBtn.hidden = false;

  const esValido = /^[A-Za-z0-9]{16}$/.test(texto);

  if (!esValido) {
    resultado.textContent = "Código QR no válido (debe tener 16 caracteres alfanuméricos).";
    resultado.style.color = "black";
    return;
  }

  if (codigosValidos.includes(texto)) {
    resultado.textContent = "✅ Código válido: " + texto;
    resultado.style.color = "green";
  } else {
    resultado.textContent = "❌ Código NO válido: " + texto;
    resultado.style.color = "red";
  }

  escaneando = false;
}

resetBtn.addEventListener("click", () => {
  resultado.textContent = "Esperando código QR...";
  resultado.style.color = "black";
  ultimoCodigo = "";
  ultimoTiempo = 0;
  resetBtn.hidden = true;
  scanBtn.hidden = false;
  video.hidden = true;
});
