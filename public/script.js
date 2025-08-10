const conversationEl = document.getElementById('conversation');
const feedbackEl = document.getElementById('feedback');
const objectivesEl = document.getElementById('objectives');
const newObjectiveEl = document.getElementById('newObjective');
const addObjectiveBtn = document.getElementById('addObjective');
const vocabBar = document.getElementById('vocabBar');
const grammarBar = document.getElementById('grammarBar');
const timeBar = document.getElementById('timeBar');
const errorsEl = document.getElementById('errors');
const diaryEl = document.getElementById('diary');
const proficiencyEl = document.getElementById('proficiency');
const modeToggle = document.getElementById('modeToggle');
const languageSelect = document.getElementById('language');

let mode = 'chat';
let objectives = [];
let conversation = [];
let vocab = new Set();
let mistakes = 0;
let errorTracker = {};
let startTime = Date.now();
let diary = [];

function appendMessage(who, text) {
  const div = document.createElement('div');
  div.className = `msg ${who}`;
  div.textContent = text;
  conversationEl.appendChild(div);
  conversationEl.scrollTop = conversationEl.scrollHeight;
  diary.push({ type: who, text });
  updateDiary();
}

function showFeedback(text) {
  feedbackEl.textContent = text;
  if (/error|mistake|incorrect|intenta|try/i.test(text)) {
    mistakes++;
    errorTracker[text] = (errorTracker[text] || 0) + 1;
    updateErrors();
  }
}

function updateErrors() {
  const entries = Object.entries(errorTracker).map(([msg, count]) => `<div>${msg} (${count})</div>`);
  errorsEl.innerHTML = entries.join('');
}

function vocabAdd(text) {
  text.split(/\s+/).forEach(w => vocab.add(w.toLowerCase()));
}

function updateProgress() {
  vocabBar.style.width = Math.min(vocab.size, 100) + '%';
  const grammarScore = Math.max(0, 100 - mistakes * 10);
  grammarBar.style.width = grammarScore + '%';
  const elapsed = (Date.now() - startTime) / 1000;
  timeBar.style.width = Math.min(100, (elapsed / 600) * 100) + '%';
}

function suggestObjectives(level) {
  if (level === 'Beginner') return ['Aprender saludos básicos', 'Practicar verbos en presente', 'Ampliar vocabulario de comida'];
  if (level === 'Intermediate') return ['Dominar verbos irregulares', 'Mejorar estructura de oraciones', 'Hablar sobre eventos pasados'];
  return ['Practicar modismos', 'Debatir temas complejos', 'Refinar pronunciación'];
}

function updateObjectivesDisplay() {
  objectivesEl.innerHTML = '';
  objectives.forEach((obj, idx) => {
    const li = document.createElement('li');
    li.textContent = obj;
    li.contentEditable = true;
    li.addEventListener('input', e => {
      objectives[idx] = e.target.textContent;
    });
    objectivesEl.appendChild(li);
  });
}

addObjectiveBtn.addEventListener('click', () => {
  const val = newObjectiveEl.value.trim();
  if (!val) return;
  objectives.push(val);
  newObjectiveEl.value = '';
  updateObjectivesDisplay();
});

modeToggle.addEventListener('click', () => {
  mode = mode === 'chat' ? 'lesson' : 'chat';
  modeToggle.textContent = mode === 'chat' ? 'Lección estructurada' : 'Chat casual';
});

function updateProficiency() {
  const level = mistakes < 3 ? 'Intermediate' : 'Beginner';
  proficiencyEl.textContent = level;
}

function updateDiary() {
  diaryEl.innerHTML = diary.map(entry => `<div class="${entry.type}"><strong>${entry.type === 'user' ? 'Tú' : 'Tutor'}:</strong> ${entry.text}</div>`).join('');
}

// initialize objectives
objectives = suggestObjectives('Beginner');
updateObjectivesDisplay();

const form = document.getElementById('chatForm');
form.addEventListener('submit', async e => {
  e.preventDefault();
  const messageInput = document.getElementById('message');
  const text = messageInput.value.trim();
  if (!text) return;
  const language = languageSelect.value;
  appendMessage('user', text);
  vocabAdd(text);
  const messagesForServer = [
    { role: 'system', content: `Learning objectives: ${objectives.join(', ')}. Mode: ${mode}.` },
    ...conversation,
    { role: 'user', content: text }
  ];
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language, messages: messagesForServer })
    });
    const data = await res.json();
    appendMessage('tutor', data.reply);
    showFeedback(data.feedback || '');
    conversation.push({ role: 'user', content: text });
    conversation.push({ role: 'assistant', content: data.reply });
    updateProficiency();
    updateProgress();
  } catch (err) {
    appendMessage('tutor', 'Error contacting server.');
  }
  messageInput.value = '';
});

