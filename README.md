# Vibe Audio Ideas

[English](README.md) · [Русский](README.ru.md)

A vibe-coding prototype: an app for quick voice notes.

## Features

- Records audio from the microphone
- Produces a draft transcript automatically (where the browser supports it)
- Saves notes locally in the browser
- Plays back and deletes saved notes

## Getting Started

Open `index.html` in a browser. For more reliable microphone access, serve the folder with a local server instead:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Usage

1. Allow microphone access.
2. Click **Начать запись** (start recording), then stop it and click **Сохранить заметку** (save note).
