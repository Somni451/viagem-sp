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

    const avatarId = button.dataset.avatar;
    const characterName = CHARACTERS[avatarId];

    avatarButtons.forEach(btn => {
      btn.classList.remove('selected');
    });

    button.classList.add('selected');

    selectedAvatar = avatarId;

    console.log('Avatar selecionado:', selectedAvatar);
    console.log('Personagem:', characterName);
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

    card.className = 'attraction';

    card.innerHTML = `
      <h3>🍲 ${attraction.name}</h3>

      <p class="info">📍 ${attraction.address}</p>

      <span class="category">${attraction.category}</span>

      <p class="info">🕐 Horário: ${attraction.opening_hours || 'A definir'}</p>

      <p class="info">${attraction.description || ''}</p>

      <div class="votes">
        <button class="yes">👍 Quero ir</button>
        <button class="maybe">🤷 Talvez</button>
        <button class="no">👎 Passo</button>
      </div>
    `;

    list.appendChild(card);
  });

  console.log('Atrações carregadas:', data);
}

loadAttractions();
