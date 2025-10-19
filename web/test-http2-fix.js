#!/usr/bin/env node

/**
 * Script de test rapide pour valider la correction HTTP/2
 * Usage: node test-http2-fix.js [URL] [SIZE]
 * 
 * Exemples:
 * - node test-http2-fix.js http://localhost:3000 25
 * - node test-http2-fix.js https://etat-administratif-app-production.up.railway.app 100
 */

const https = require('https');
const http = require('http');

const DEFAULT_URL = 'http://localhost:3000';
const DEFAULT_SIZE = 25;

async function testHttp2Fix(url = DEFAULT_URL, testSize = DEFAULT_SIZE) {
  console.log(`🧪 Test de correction HTTP/2`);
  console.log(`📍 URL: ${url}`);
  console.log(`📊 Taille: ${testSize} SIRETs`);
  console.log(`⏰ Début: ${new Date().toISOString()}`);
  console.log('─'.repeat(60));

  const startTime = Date.now();
  let requestCount = 0;
  let errorCount = 0;
  let lastProgress = 0;

  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const postData = JSON.stringify({ testSize });
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: '/api/test-stream',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    };

    const req = client.request(options, (res) => {
      console.log(`📡 Status: ${res.statusCode} ${res.statusMessage}`);
      console.log(`📋 Headers:`, res.headers);
      console.log('─'.repeat(60));

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        return;
      }

      let buffer = '';
      
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Garder la ligne incomplète

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              requestCount++;
              
              if (data.type === 'progress') {
                const progress = Math.round((data.current / data.total) * 100);
                if (progress !== lastProgress && progress % 10 === 0) {
                  console.log(`📈 ${progress}% - ${data.current}/${data.total} - ${data.message}`);
                  lastProgress = progress;
                }
              } else if (data.type === 'result') {
                if (data.result.error) {
                  errorCount++;
                  console.log(`❌ Erreur SIRET ${data.result.siret}: ${data.result.error}`);
                }
              } else if (data.type === 'complete') {
                const duration = Date.now() - startTime;
                console.log('─'.repeat(60));
                console.log(`✅ Test terminé avec succès !`);
                console.log(`⏱️  Durée: ${Math.round(duration / 1000)}s`);
                console.log(`📊 Requêtes: ${requestCount}`);
                console.log(`❌ Erreurs: ${errorCount}`);
                console.log(`📈 Taux de succès: ${Math.round(((requestCount - errorCount) / requestCount) * 100)}%`);
                console.log(`📋 Stats:`, data.stats);
                
                if (errorCount === 0) {
                  console.log(`🎉 Aucune erreur HTTP/2 détectée !`);
                } else {
                  console.log(`⚠️  ${errorCount} erreurs détectées`);
                }
                
                resolve({
                  success: true,
                  duration,
                  requestCount,
                  errorCount,
                  stats: data.stats
                });
              } else if (data.type === 'error') {
                console.log(`💥 Erreur fatale: ${data.message}`);
                reject(new Error(data.message));
              } else if (data.type === 'heartbeat') {
                console.log(`💓 Heartbeat: ${data.message}`);
              }
            } catch (e) {
              console.warn(`⚠️  Erreur parsing: ${e.message}`);
            }
          }
        }
      });

      res.on('end', () => {
        console.log('📡 Stream fermé');
        if (requestCount === 0) {
          reject(new Error('Aucune donnée reçue'));
        }
      });

      res.on('error', (err) => {
        console.error(`💥 Erreur stream: ${err.message}`);
        reject(err);
      });
    });

    req.on('error', (err) => {
      console.error(`💥 Erreur requête: ${err.message}`);
      reject(err);
    });

    req.on('timeout', () => {
      console.error(`⏰ Timeout de la requête`);
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.setTimeout(300000); // 5 minutes max
    req.write(postData);
    req.end();
  });
}

// Gestion des arguments
const args = process.argv.slice(2);
const url = args[0] || DEFAULT_URL;
const testSize = parseInt(args[1]) || DEFAULT_SIZE;

// Validation
if (testSize < 1 || testSize > 1000) {
  console.error('❌ Taille de test invalide. Utilisez entre 1 et 1000.');
  process.exit(1);
}

// Lancement du test
testHttp2Fix(url, testSize)
  .then((result) => {
    console.log('─'.repeat(60));
    console.log(`🎯 Test réussi !`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('─'.repeat(60));
    console.error(`💥 Test échoué: ${error.message}`);
    process.exit(1);
  });
