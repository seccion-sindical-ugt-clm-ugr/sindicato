/**
 * Generador de Contraseña de Administrador
 * UGT-CLM-UGR Granada
 *
 * Genera una contraseña segura para el panel de administración
 */

const crypto = require('crypto');

console.log('🔐 Generador de Contraseña de Administrador');
console.log('═══════════════════════════════════════════════════════════\n');

// Generar contraseña aleatoria segura
const password = crypto.randomBytes(32).toString('base64');

console.log('✅ Nueva contraseña generada:\n');
console.log('─────────────────────────────────────────────────────────');
console.log(password);
console.log('─────────────────────────────────────────────────────────\n');

console.log('📋 PASOS PARA CONFIGURAR:\n');
console.log('1. Ve a: https://vercel.com/tu-proyecto/settings/environment-variables');
console.log('2. Busca la variable: ADMIN_PASSWORD');
console.log('3. Opciones:');
console.log('   a) Si existe: Click "Edit" → Pega la nueva contraseña → Save');
console.log('   b) Si NO existe: Click "Add" → Name: ADMIN_PASSWORD → Value: [pega la contraseña] → Save');
console.log('4. IMPORTANTE: Después de guardar, haz un nuevo deploy:');
console.log('   - Ve a "Deployments"');
console.log('   - Click en el último deployment');
console.log('   - Click en "⋯" (tres puntos)');
console.log('   - Click "Redeploy"\n');

console.log('⚠️  IMPORTANTE: Guarda esta contraseña en un lugar seguro!');
console.log('   Necesitarás ingresarla en: https://ugtclmgranada.org/admin.html\n');

// También generar una contraseña más simple si se prefiere
const simplePassword = crypto.randomBytes(16).toString('hex');
console.log('💡 Alternativa (contraseña más corta pero segura):');
console.log('─────────────────────────────────────────────────────────');
console.log(simplePassword);
console.log('─────────────────────────────────────────────────────────\n');

console.log('🔍 ¿No tienes acceso a Vercel?');
console.log('   Contacta con el administrador del proyecto en Vercel\n');
