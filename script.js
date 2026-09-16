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

avatarButtons.forEach(function(button) {
button.addEventListener('click', async function() {
if (selectedAvatar !== null) {
return;
}

```
const avatarId = button.dataset.avatar;
const characterName = CHARACTERS[avatarId];

button.classList.add('selected');
selectedAvatar = avatarId;

avatarButtons.forEach(function(btn) {
  btn.disabled = true;
});

console.log('Avatar selecionado:', selectedAvatar);
console.log('Personagem:', characterName);

const result = await db
  .from('participants')
  .select('*')
  .eq('avatar_url', avatarId)
  .maybeSingle();

if (result.error) {
  console.error('Erro ao procurar participante:', result.error);
  return;
}

if (result.data) {
  currentParticipant = result.data;

  console.log('Participante encontrado:', currentParticipant);

  localStorage.setItem('participant_id', currentParticipant.id);

  return;
}

const insertResult = await db
  .from('participants')
  .insert({
    name: characterName,
    avatar_url: avatarId
  })
  .select()
  .single();

if (insertResult.error) {
  console.error('Erro ao criar participante:', insertResult.error);
  return;
}

currentParticipant = insertResult.data;

console.log('Participante criado:', currentParticipant);

localStorage.setItem('participant_id', currentParticipant.id);
```

});
});

async function loadAttractions() {
const result = await db
.from('attractions')
.select('*')
.order('created_at', { ascending: true });

if (result.error) {
console.error('Erro ao carregar atrações:', result.error);
return;
}

const list = document.getElementById('attractions-list');

list.innerHTML = '';

result.data.forEach(function(attraction) {
const card = document.createElement('div');

```
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

const description = document.createElement('p');
description.className = 'info';
description.textContent = attraction.description || '';
card.appendChild(description);

const votes = document.createElement('div');
votes.className = 'votes';

const yesButton = document.createElement('button');
yesButton.className = 'yes';
yesButton.dataset.vote = 'yes';
yesButton.dataset.attractionId = attraction.id;
yesButton.textContent = '👍 Quero ir';

const maybeButton = document.createElement('button');
maybeButton.className = 'maybe';
maybeButton.dataset.vote = 'maybe';
maybeButton.dataset.attractionId = attraction.id;
maybeButton.textContent = '🤷 Talvez';

const noButton = document.createElement('button');
noButton.className = 'no';
noButton.dataset.vote = 'no';
noButton.dataset.attractionId = attraction.id;
noButton.textContent = '👎 Passo';

votes.appendChild(yesButton);
votes.appendChild(maybeButton);
votes.appendChild(noButton);

card.appendChild(votes);
list.appendChild(card);

const voteButtons = card.querySelectorAll('.votes button');

voteButtons.forEach(function(button) {
  button.addEventListener('click', async function() {
    const participantId = localStorage.getItem('participant_id');
    const attractionId = button.dataset.attractionId;
    const vote = button.dataset.vote;

    if (!participantId) {
      console.error('Nenhum personagem selecionado.');
      return;
    }

    voteButtons.forEach(function(btn) {
      btn.classList.remove('selected');
    });

    button.classList.add('selected');

    console.log('Voto:', {
      participantId: participantId,
      attractionId: attractionId,
      vote: vote
    });

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
});
```

});

console.log('Atrações carregadas:', result.data);
}

loadAttractions();
