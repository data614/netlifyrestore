import { mkdir, cp, access, copyFile } from 'fs/promises';
import { join } from 'path';

async function build() {
  console.log('🔨 Building netlifyrestore...');
  
  try {
    // Create build directory
    await mkdir('build', { recursive: true });
    console.log('✅ Created build directory');
    
    // Copy HTML files if they exist
    const filesToCopy = [
      'index.html',
      'home.html', 
      'ai-analyst.html',
      'quant-screener.html',
      'api-test.html',
      'professional-desk.html',
      'valuation-lab.html',
      'complete-australian-test.html',
      'load-charts.html',
      'test-australian-stocks.html'
    ];
    
    for (const file of filesToCopy) {
      try {
        await access(file);
        await copyFile(file, join('build', file));
        console.log(`✅ Copied ${file}`);
      } catch (error) {
        console.log(`⚠️  ${file} not found, skipping...`);
      }
    }
    
    // Copy CSS files if they exist
    const cssFiles = [
      'style.css',
      'app.css',
      'ai-analyst.css'
    ];
    
    for (const file of cssFiles) {
      try {
        await access(file);
        await copyFile(file, join('build', file));
        console.log(`✅ Copied ${file}`);
      } catch (error) {
        console.log(`⚠️  ${file} not found, skipping...`);
      }
    }
    
    // Copy JavaScript files if they exist
    const jsFiles = [
      'app.js',
      'ai-analyst.js',
      'quant-screener.js',
      'ai-analyst-batch-table.js',
      'live-australian-test.js',
      'test-australian-stocks.js'
    ];
    
    for (const file of jsFiles) {
      try {
        await access(file);
        await copyFile(file, join('build', file));
        console.log(`✅ Copied ${file}`);
      } catch (error) {
        console.log(`⚠️  ${file} not found, skipping...`);
      }
    }
    
    // Copy data directory if it exists
    try {
      await access('data');
      await cp('data', 'build/data', { recursive: true });
      console.log('✅ Copied data directory');
    } catch (error) {
      console.log('⚠️  Data directory not found, skipping...');
    }
    
    // Copy utils directory if it exists - CRITICAL FOR ES6 MODULE IMPORTS!
    try {
      await access('utils');
      await cp('utils', 'build/utils', { recursive: true });
      console.log('✅ Copied utils directory - ESSENTIAL FOR ES6 MODULES!');
    } catch (error) {
      console.log('❌ CRITICAL: Utils directory not found - ES6 imports will fail!');
      console.log('   Make sure utils/ directory exists for browser-cache.js, frontend-errors.js, etc.');
    }
    
    // Copy professional directory if it exists
    try {
      await access('professional');
      await cp('professional', 'build/professional', { recursive: true });
      console.log('✅ Copied professional directory');
    } catch (error) {
      console.log('⚠️  Professional directory not found, skipping...');
    }
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();