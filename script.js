const SUPABASE_URL = 'https://svlllemeaoglofgkjwqy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_'; // sb_publishable_awG6lCJsMGP7n35B2yV20w_h46ATS9L
const db = window.supabase.createClient(
SUPABASE_URL,
SUPABASE_KEY
);

let selectedAvatar = null;
let currentParticipant = null;

const CHARACTERS = {
jess: 'Jess',
leo: 'Leo',
nego: 'Nego',
beagons: 'Beagons',
pat: 'Pat'
};

// ==========================================
// 1. LÓGICA DE SELEÇÃO DE PERSONAGEM
// ==========================================
const avatarButtons = document.querySelectorAll('.avatar-option');

for (let i = 0; i < avatarButtons.length; i++) {
avatarButtons[i].addEventListener('click', async function() {
if (selectedAvatar !== null) {
  return;
}

const avatarId = this.dataset.avatar;
const characterName = CHARACTERS[avatarId];

this.classList.add('selected');
selectedAvatar = avatarId;

for (let j = 0; j < avatarButtons.length; j++) {
  avatarButtons[j].disabled = true;
}

console.log('Avatar selecionado:', selectedAvatar);

const participantResult = await db
  .from('participants')
  .select('*')
  .eq('avatar_url', avatarId)
  .maybeSingle();

if (participantResult.error) {
  console.error('Erro ao procurar participante:', participantResult.error);
  return;
}

if (participantResult.data) {
  currentParticipant = participantResult.data;
  localStorage.setItem('participant_id', currentParticipant.id);
  console.log('Participante encontrado:', currentParticipant);
  return;
}

const newParticipantResult = await db
  .from('participants')
  .insert({
    name: characterName,
    avatar_url: avatarId
  })
  .select()
  .single();

if (newParticipantResult.error) {
  console.error('Erro ao criar participante:', newParticipantResult.error);
  return;
}

currentParticipant = newParticipantResult.data;
localStorage.setItem('participant_id', currentParticipant.id);

console.log('Participante criado:', currentParticipant);
});
}

// ==========================================
// 2. LÓGICA DE CARREGAR ATRAÇÕES E MONTAR CARDS
// ==========================================
async function loadAttractions() {
const attractionResult = await db
.from('attractions')
.select('*')
.order('created_at', { ascending: true });

if (attractionResult.error) {
console.error('Erro ao carregar atrações:', attractionResult.error);
return;
}

const list = document.getElementById('attractions-list');

while (list.firstChild) {
list.removeChild(list.firstChild);
}

const attractions = attractionResult.data;

for (let i = 0; i < attractions.length; i++) {
const attraction = attractions[i];
const card = document.createElement('div');
card.className = 'attraction';

// ---> LÓGICA DO FILTRO DE DIAS NO BANCO: 
// Se você criar uma coluna "dias" no Supabase (ex: "25,26,28"), mude 'attraction.dias'
// Se não existir, por padrão ele assume que abre todos os dias ("25,26,27,28") para não quebrar.
const daysOpen = attraction.dias || "25,26,27,28"; 
card.setAttribute('data-open', daysOpen);

// TÍTULO SEMPRE VISÍVEL
const title = document.createElement('h3');
title.textContent = '🍲 ' + attraction.name;
card.appendChild(title);

// CATEGORIA SEMPRE VISÍVEL
const category = document.createElement('span');
category.className = 'category';
category.textContent = attraction.category;
card.appendChild(category);

// ---> DIV QUE ESCONDE O RESTO DAS INFORMAÇÕES
const extraInfo = document.createElement('div');
extraInfo.className = 'extra-info';

const address = document.createElement('p');
address.className = 'info';
address.textContent = '📍 ' + attraction.address;
extraInfo.appendChild(address);

const hours = document.createElement('p');
hours.className = 'info';
hours.textContent = '🕐 Horário: ' + (attraction.opening_hours || 'A definir');
extraInfo.appendChild(hours);

if (attraction.description) {
  const description = document.createElement('p');
  description.className = 'info';
  description.textContent = attraction.description;
  extraInfo.appendChild(description);
}

const votes = document.createElement('div');
votes.className = 'votes';

const yesButton = document.createElement('button');
yesButton.className = 'yes';
yesButton.dataset.vote = 'yes';
yesButton.dataset.attractionId = attraction.id;
yesButton.textContent = 'Quero ir';

const maybeButton = document.createElement('button');
maybeButton.className = 'maybe';
maybeButton.dataset.vote = 'maybe';
maybeButton.dataset.attractionId = attraction.id;
maybeButton.textContent = 'Talvez';

const noButton = document.createElement('button');
noButton.className = 'no';
noButton.dataset.vote = 'no';
noButton.dataset.attractionId = attraction.id;
noButton.textContent = 'Passo';

votes.appendChild(yesButton);
votes.appendChild(maybeButton);
votes.appendChild(noButton);

extraInfo.appendChild(votes);
card.appendChild(extraInfo);
list.appendChild(card);

// ---> EVENTO DE EXPANDIR O CARD AO CLICAR
card.addEventListener('click', function(e) {
  // Impede de fechar o card se a pessoa clicar num botão de voto
  if (e.target.tagName === 'BUTTON') return;
  
  // Opcional: Fecha outros cards antes de abrir este (descomente a linha abaixo se quiser)
  // document.querySelectorAll('.attraction').forEach(c => { if(c !== this) c.classList.remove('expanded') });
  
  this.classList.toggle('expanded');
});

// ---> EVENTO DOS BOTÕES DE VOTO (Manteve sua lógica do Supabase intocada)
const buttons = [yesButton, maybeButton, noButton];

for (let j = 0; j < buttons.length; j++) {
  buttons[j].addEventListener('click', async function(e) {
    e.stopPropagation(); // Garante que clicar no botão não dispare o clique do card

    const participantId = localStorage.getItem('participant_id');

    if (!participantId) {
      alert('👾 Ei! Você precisa escolher seu personagem lá em cima primeiro!');
      return;
    }

    for (let k = 0; k < buttons.length; k++) {
      buttons[k].classList.remove('selected');
    }

    this.classList.add('selected');

    const vote = this.dataset.vote;
    const attractionId = this.dataset.attractionId;

    console.log('Voto:', participantId, attractionId, vote);

    const voteResult = await db
      .from('votes')
      .upsert(
        {
          participant_id: participantId,
          attraction_id: attractionId,
          vote: vote
        },
        {
          onConflict: 'participant_id,attraction_id'
        }
      )
      .select()
      .single();

    if (voteResult.error) {
      console.error('Erro ao salvar voto:', voteResult.error);
      return;
    }

    console.log('Voto salvo:', voteResult.data);
  });
}

}

console.log('Atrações carregadas:', attractions);

// Depois que carregar tudo, inicializa a lógica dos Filtros de Dias
initDayFilters();
}

// ==========================================
// 3. LÓGICA DO FILTRO DE DIAS (NOVIDADE)
// ==========================================
function initDayFilters() {
  const dayButtons = document.querySelectorAll('.day-btn');
  const cards = document.querySelectorAll('.attraction');

  dayButtons.forEach(button => {
    button.addEventListener('click', () => {
      // 1. Troca a classe 'active' do botão clicado
      dayButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const selectedDay = button.getAttribute('data-day');

      // 2. Fecha todos os cards expandidos pra não bagunçar a tela ao filtrar
      cards.forEach(c => c.classList.remove('expanded'));

      // 3. Verifica os dias de cada card (Cinza ou Normal)
      cards.forEach(card => {
        const openDays = card.getAttribute('data-open').split(',');

        if (selectedDay === 'all' || openDays.includes(selectedDay)) {
          card.classList.remove('disabled');
        } else {
          card.classList.add('disabled');
        }
      });
    });
  });
}

// ==========================================
// INICIA O APP
// ==========================================
loadAttractions();
