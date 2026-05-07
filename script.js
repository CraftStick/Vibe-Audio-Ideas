const recordBtn = document.querySelector("#recordBtn");
const stopBtn = document.querySelector("#stopBtn");
const saveBtn = document.querySelector("#saveBtn");
const clearBtn = document.querySelector("#clearBtn");
const statusEl = document.querySelector("#status");
const titleInput = document.querySelector("#titleInput");
const transcriptEl = document.querySelector("#transcript");
const notesList = document.querySelector("#notesList");

const STORAGE_KEY = "vibe-audio-ideas-notes";
let mediaRecorder = null;
let activeStream = null;
let chunks = [];
let currentAudioDataUrl = "";
let recognition = null;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

function getNotes() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function setNotes(notes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

function updateStatus(message) {
  statusEl.textContent = message;
}

function formatDate(isoDate) {
  return new Date(isoDate).toLocaleString("ru-RU");
}

function renderNotes() {
  const notes = getNotes();
  if (!notes.length) {
    notesList.innerHTML = '<p class="empty">Пока нет заметок.</p>';
    return;
  }

  notesList.innerHTML = notes
    .map(
      (note) => `
      <article class="note">
        <h3>${note.title}</h3>
        <audio controls src="${note.audioDataUrl}"></audio>
        <p>${note.transcript || "Без текста"}</p>
        <div class="note-meta">
          <span>${formatDate(note.createdAt)}</span>
          <button class="delete-btn" data-id="${note.id}" type="button">Удалить</button>
        </div>
      </article>
    `
    )
    .join("");
}

function stopRecognition() {
  if (!recognition) return;
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;
  recognition.stop();
  recognition = null;
}

function startRecognition() {
  if (!SpeechRecognition) {
    updateStatus("Распознавание речи не поддерживается, но запись работает.");
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = true;
  recognition.continuous = true;
  recognition.onresult = (event) => {
    let output = "";
    for (let i = 0; i < event.results.length; i += 1) {
      output += `${event.results[i][0].transcript} `;
    }
    transcriptEl.value = output.trim();
  };
  recognition.onerror = () => {
    updateStatus("Ошибка распознавания речи. Можно продолжать запись без текста.");
  };
  recognition.start();
}

function setRecordingState(isRecording) {
  recordBtn.disabled = isRecording;
  stopBtn.disabled = !isRecording;
  saveBtn.disabled = isRecording || !currentAudioDataUrl;
}

async function startRecording() {
  try {
    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(activeStream);
    chunks = [];
    currentAudioDataUrl = "";

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(chunks, { type: "audio/webm" });
      currentAudioDataUrl = await blobToDataURL(audioBlob);
      setRecordingState(false);
      saveBtn.disabled = false;
      updateStatus("Запись готова. Проверь текст и сохрани заметку.");
    };

    mediaRecorder.start();
    startRecognition();
    setRecordingState(true);
    updateStatus("Идет запись... Говорите.");
  } catch {
    updateStatus("Не удалось получить доступ к микрофону.");
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
  stopRecognition();
}

function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function saveNote() {
  if (!currentAudioDataUrl) return;

  const note = {
    id: crypto.randomUUID(),
    title: titleInput.value.trim() || "Без названия",
    transcript: transcriptEl.value.trim(),
    audioDataUrl: currentAudioDataUrl,
    createdAt: new Date().toISOString(),
  };

  const notes = getNotes();
  notes.unshift(note);
  setNotes(notes);
  renderNotes();

  titleInput.value = "";
  transcriptEl.value = "";
  currentAudioDataUrl = "";
  saveBtn.disabled = true;
  updateStatus("Заметка сохранена.");
}

function deleteNote(noteId) {
  const notes = getNotes().filter((note) => note.id !== noteId);
  setNotes(notes);
  renderNotes();
}

recordBtn.addEventListener("click", startRecording);
stopBtn.addEventListener("click", stopRecording);
saveBtn.addEventListener("click", saveNote);

clearBtn.addEventListener("click", () => {
  if (!confirm("Удалить все заметки?")) return;
  localStorage.removeItem(STORAGE_KEY);
  renderNotes();
  updateStatus("Все заметки удалены.");
});

notesList.addEventListener("click", (event) => {
  const button = event.target.closest(".delete-btn");
  if (!button) return;
  deleteNote(button.dataset.id);
});

renderNotes();
