
import { loadEnvFile, getCompanyNews } from './simple-tiingo.js';

async function test() {
  // Load environment variables, just like the original script's main() does
  await loadEnvFile();

  console.log("Testing modular import of getCompanyNews for 'MSFT'...");
  try {
    const news = await getCompanyNews('MSFT', { limit: 3 });
    console.log('✅ Success! Got news:', JSON.stringify(news, null, 2));
  } catch (error) {
    console.error('❌ Failed to get news:', error.message);
  }
}

test();
