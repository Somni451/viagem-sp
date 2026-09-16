const SUPABASE_URL = 'https://svlllemeaoglofgkjwqy.supabase.co';
const SUPABASE_KEY = 'COLOQUE_SUA_PUBLISHABLE_KEY_AQUI';

const { createClient } = supabase;

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
  const { data, error } = await db
    .from('attractions')
    .select('*');

  if (error) {
    console.error('Erro ao conectar:', error);
    return;
  }

  console.log('Atrações encontradas:', data);
}

testConnection();
