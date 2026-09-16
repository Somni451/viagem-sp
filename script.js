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

avatarButtons.forEach(button => {
button.addEventListener('click', async () => {

```
if (selectedAvatar !== null) {
  return;
}

const avatarId = button.dataset.avatar;
const characterName = CHARACTERS[avatarId];

button.classList.add('selected');

selectedAvatar = avatarId;

avatarButtons.forEach(btn => {
  btn.disabled = true;
});

console.log('Avatar selecionado:', selectedAvatar);
console.log('Personagem:', characterName);

const { data: existingParticipant, error: findError } = await db
  .from('participants')
  .select('*')
  .eq('avatar_url', avatarId)
  .maybeSingle();

if (findError) {
  console.error('Erro ao procurar participante:', findError);
  return;
}

if (existingParticipant) {
  currentParticipant = existingParticipant;
  console.log('Participante encontrado:', currentParticipant);
  localStorage.setItem('participant_id', currentParticipant.id);
  return;
}

const { data: newParticipant, error: insertError } = await db
  .from('participants')
  .insert({
    name: characterName,
    avatar_url: avatarId
  })
  .select()
  .single();

if (insertError) {
  console.error('Erro ao criar participante:', insertError);
  return;
}

currentParticipant = newParticipant;

console.log('Participante criado:', currentParticipant);

localStorage.setItem('participant_id', currentParticipant.id);
```

});
});

async function loadAttractions() {
const { data, error } = await db
.from('attractions')
.select('*')
.order('created_at', { ascending: true });

if (error) {
console.error('Erro ao carregar atrações:', error);
return;
}

const list = document.getElementById('attractions-list');

list.innerHTML = '';

data.forEach(attraction => {
const card = document.createElement('div');

```
card.className = 'attraction';

card.innerHTML = `
  <h3>🍲 ${attraction.name}</h3>
  <p class="info">📍 ${attraction.address}</p>
  <span class="category">${attraction.category}</span>
  <p class="info">🕐 Horário: ${attraction.opening_hours || 'A definir'}</p>
  <p class="info">${attraction.description || ''}</p>

  <div class="votes">
    <button class="yes" data-vote="yes" data-attraction-id="${attraction.id}">
      👍 Quero ir
    </button>

    <button class="maybe" data-vote="maybe" data-attraction-id="${attraction.id}">
      🤷 Talvez
    </button>

    <button class="no" data-vote="no" data-attraction-id="${attraction.id}">
      👎 Passo
    </button>
  </div>
`;

list.appendChild(card);

const voteButtons = card.querySelectorAll('.votes button');

voteButtons.forEach(button => {
  button.addEventListener('click', async () => {

    const participantId = localStorage.getItem('participant_id');
    const attractionId = button.dataset.attractionId;
    const vote = button.dataset.vote;

    if (!participantId) {
      console.error('Nenhum personagem selecionado.');
      return;
    }

    voteButtons.forEach(btn => {
      btn.classList.remove('selected');
    });

    button.classList.add('selected');

    console.log('Voto:', {
      participantId,
      attractionId,
      vote
    });

    const { data: savedVote, error: voteError } = await db
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

    if (voteError) {
      console.error('Erro ao salvar voto:', voteError);
      return;
    }

    console.log('Voto salvo:', savedVote);
  });
});
```

});

console.log('Atrações carregadas:', data);
}

loadAttractions();
