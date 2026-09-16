const SUPABASE_URL = 'https://svlllemeaoglofgkjwqy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_awG6lCJsMGP7n35B2yV20w_h46ATS9L';
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

const title = document.createElement('h3');
title.textContent = '🍲 ' + attraction.name;
card.appendChild(title);

const address = document.createElement('p');
address.className = 'info';
address.textContent = '📍 ' + attraction.address;
card.appendChild(address);

const category = document.createElement('span');
category.className = 'category';
category.textContent = attraction.category;
card.appendChild(category);

const hours = document.createElement('p');
hours.className = 'info';
hours.textContent = '🕐 Horário: ' + (attraction.opening_hours || 'A definir');
card.appendChild(hours);

if (attraction.description) {
  const description = document.createElement('p');
  description.className = 'info';
  description.textContent = attraction.description;
  card.appendChild(description);
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

card.appendChild(votes);
list.appendChild(card);

const buttons = [yesButton, maybeButton, noButton];

for (let j = 0; j < buttons.length; j++) {
  buttons[j].addEventListener('click', async function() {

    const participantId = localStorage.getItem('participant_id');

    if (!participantId) {
      console.error('Nenhum personagem selecionado.');
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
}

loadAttractions();

