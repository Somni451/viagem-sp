const SUPABASE_URL = 'https://svlllemeaoglofgkjwqy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_awG6lCJsMGP7n35B2yV20w_h46ATS9L'
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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
    if (selectedAvatar !== null) return;

    const avatarId = this.dataset.avatar;
    const characterName = CHARACTERS[avatarId];

    this.classList.add('selected');
    selectedAvatar = avatarId;

    for (let j = 0; j < avatarButtons.length; j++) {
      avatarButtons[j].disabled = true;
    }

    // Busca ou cria o participante no Supabase
    const participantResult = await db.from('participants').select('*').eq('avatar_url', avatarId).maybeSingle();

    if (participantResult.data) {
      currentParticipant = participantResult.data;
    } else {
      const newParticipant = await db.from('participants').insert({ name: characterName, avatar_url: avatarId }).select().single();
      if (newParticipant.data) currentParticipant = newParticipant.data;
    }

    if (currentParticipant) {
      localStorage.setItem('participant_id', currentParticipant.id);
      // Assim que descobrir quem sou eu, trava os cards que já votei
      checkMyPastVotes(); 
    }
  });
}

// Verifica no banco de dados o que o personagem já votou e deixa cinza
async function checkMyPastVotes() {
  if (!currentParticipant) return;
  
  const pastVotes = await db.from('votes').select('attraction_id').eq('participant_id', currentParticipant.id);
  
  if (!pastVotes.error && pastVotes.data) {
    const votedIds = pastVotes.data.map(v => v.attraction_id.toString());
    
    document.querySelectorAll('.attraction').forEach(card => {
      if (votedIds.includes(card.getAttribute('data-id'))) {
        card.classList.add('voted-disabled');
        card.classList.remove('expanded');
      }
    });
  }
}

// ==========================================
// 2. LÓGICA DE CARREGAR ATRAÇÕES E RANKING
// ==========================================
async function loadAttractions() {
  // Puxa as atrações e TODOS os votos de uma vez
  const [attractionResult, votesResult] = await Promise.all([
    db.from('attractions').select('*').order('created_at', { ascending: true }),
    db.from('votes').select('*')
  ]);

  if (attractionResult.error) return console.error('Erro ao carregar atrações');

  const list = document.getElementById('attractions-list');
  list.innerHTML = ''; // Limpa a lista
  
  const attractions = attractionResult.data;
  const allVotes = votesResult.data || [];

  for (let i = 0; i < attractions.length; i++) {
    const attraction = attractions[i];
    const card = document.createElement('div');
    card.className = 'attraction';
    card.setAttribute('data-id', attraction.id); // Importante para travar depois
    card.setAttribute('data-open', attraction.dias || "25,26,27,28");

    // ---> CABEÇALHO DO CARD (Flexbox para separar textos e o badge)
    const headerDiv = document.createElement('div');
    headerDiv.className = 'attraction-header';

    const infoTopDiv = document.createElement('div');
    infoTopDiv.className = 'attraction-info-top';

    // 1. TÍTULO
    const title = document.createElement('h3');
    title.textContent = '🍲 ' + attraction.name;
    infoTopDiv.appendChild(title);

    // 2. MÚLTIPLAS CATEGORIAS
    const catContainer = document.createElement('div');
    catContainer.className = 'categories-container';
    
    // Pega a string do banco e separa por "/" ou ","
    const categoriesString = attraction.category || 'Atração';
    const categoriesArray = categoriesString.split(/[\/,]/); 
    
    categoriesArray.forEach(cat => {
      const catSpan = document.createElement('span');
      catSpan.className = 'category';
      catSpan.textContent = cat.trim(); // .trim() remove os espaços em branco extras
      catContainer.appendChild(catSpan);
    });
    
    infoTopDiv.appendChild(catContainer);
    headerDiv.appendChild(infoTopDiv);

    // 3. BADGE 8-BIT DO RANKING
    const yesCount = allVotes.filter(v => v.attraction_id === attraction.id && v.vote === 'yes').length;
    
    const rankingBadge = document.createElement('div');
    rankingBadge.className = 'ranking-badge';
    
    const numberSpan = document.createElement('span');
    numberSpan.className = 'number';
    numberSpan.textContent = yesCount.toString().padStart(2, '0');
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'label';
    labelSpan.textContent = 'querem ir';
    
    rankingBadge.appendChild(numberSpan);
    rankingBadge.appendChild(labelSpan);
    
    headerDiv.appendChild(rankingBadge);
    
    // Adiciona o cabeçalho montado dentro do card principal
    card.appendChild(headerDiv);

    // ---> ÁREA ESCONDIDA (Expandível)
    const extraInfo = document.createElement('div');
    extraInfo.className = 'extra-info';

    extraInfo.innerHTML += `<p class="info">📍 ${attraction.address}</p>`;
    extraInfo.innerHTML += `<p class="info">🕐 Horário: ${attraction.opening_hours || 'A definir'}</p>`;
    if (attraction.description) {
      extraInfo.innerHTML += `<p class="info">${attraction.description}</p>`;
    }

    const votesDiv = document.createElement('div');
    votesDiv.className = 'votes';

    // Criando os botões de voto
    ['yes', 'maybe', 'no'].forEach(voteType => {
      const btn = document.createElement('button');
      btn.className = voteType;
      btn.dataset.vote = voteType;
      btn.dataset.attractionId = attraction.id;
      
      if (voteType === 'yes') btn.textContent = 'Quero ir';
      if (voteType === 'maybe') btn.textContent = 'Talvez';
      if (voteType === 'no') btn.textContent = 'Passo';

      // Evento de Salvar o Voto
      btn.addEventListener('click', async function(e) {
        e.stopPropagation();

        if (!currentParticipant) {
          alert('👾 Ei! Você precisa escolher seu personagem lá em cima primeiro!');
          return;
        }

        const vote = this.dataset.vote;
        const attractionId = this.dataset.attractionId;

        // Salva no Supabase
        await db.from('votes').upsert(
          { participant_id: currentParticipant.id, attraction_id: attractionId, vote: vote },
          { onConflict: 'participant_id,attraction_id' }
        );

        // Trava o card na hora para o usuário
        const currentCard = this.closest('.attraction');
        currentCard.classList.remove('expanded');
        currentCard.classList.add('voted-disabled');
      });

      votesDiv.appendChild(btn);
    });

    extraInfo.appendChild(votesDiv);
    card.appendChild(extraInfo);
    list.appendChild(card);

    // Expandir o card ao clicar (se não estiver travado)
    card.addEventListener('click', function(e) {
      if (e.target.tagName === 'BUTTON') return;
      this.classList.toggle('expanded');
    });
  }

  initDayFilters();
}

// ==========================================
// 3. LÓGICA DO FILTRO DE DIAS
// ==========================================
function initDayFilters() {
  const dayButtons = document.querySelectorAll('.day-btn');
  const cards = document.querySelectorAll('.attraction');

  dayButtons.forEach(button => {
    button.addEventListener('click', () => {
      dayButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      const selectedDay = button.getAttribute('data-day');

      cards.forEach(card => {
        // Se o card estiver votado, não mexemos nele (já está cinza)
        if (card.classList.contains('voted-disabled')) return;

        card.classList.remove('expanded'); // Fecha ao filtrar
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

// Inicia o app
loadAttractions();
