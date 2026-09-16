const SUPABASE_URL = 'https://svlllemeaoglofgkjwqy.supabase.co';

const SUPABASE_KEY = 'sb_publishable_awG6lCJsMGP7n35B2yV20w_h46ATS9L';

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function loadAttractions() {
  const { data, error } = await db
    .from('attractions')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao carregar atrações:', error);
    return;
  }

  console.log('Atrações carregadas:', data);
}

loadAttractions();
