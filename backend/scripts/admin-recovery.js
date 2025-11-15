/**
 * Script de Recuperación de Admin
 * UGT-CLM-UGR Granada
 *
 * Uso:
 *   node scripts/admin-recovery.js list          - Listar admins
 *   node scripts/admin-recovery.js create        - Crear nuevo admin
 *   node scripts/admin-recovery.js reset <email> - Resetear contraseña de admin
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// Importar modelo de usuario
const User = require('../src/models/User');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function connectDB() {
    try {
        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            console.error('❌ ERROR: MONGODB_URI no está configurado en las variables de entorno');
            console.log('💡 Crea un archivo .env en /backend con:');
            console.log('   MONGODB_URI=mongodb+srv://...');
            process.exit(1);
        }

        await mongoose.connect(mongoUri);
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error.message);
        process.exit(1);
    }
}

async function listAdmins() {
    console.log('\n📋 Listando usuarios administradores...\n');

    const admins = await User.find({ role: 'admin' }).select('nombre email isActive createdAt lastLogin');

    if (admins.length === 0) {
        console.log('⚠️  No se encontraron usuarios administradores');
        return;
    }

    console.log(`Se encontraron ${admins.length} administrador(es):\n`);

    admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.nombre}`);
        console.log(`   Email: ${admin.email}`);
        console.log(`   Estado: ${admin.isActive ? '✅ Activo' : '❌ Inactivo'}`);
        console.log(`   Creado: ${admin.createdAt.toLocaleDateString()}`);
        console.log(`   Último login: ${admin.lastLogin ? admin.lastLogin.toLocaleDateString() : 'Nunca'}`);
        console.log('');
    });
}

async function createAdmin() {
    console.log('\n🔧 Crear nuevo administrador\n');

    const nombre = await question('Nombre completo: ');
    const email = await question('Email: ');
    const password = await question('Contraseña (mínimo 6 caracteres): ');
    const telefono = await question('Teléfono (opcional): ');

    // Validaciones básicas
    if (!nombre || !email || !password) {
        console.error('❌ Nombre, email y contraseña son obligatorios');
        return;
    }

    if (password.length < 6) {
        console.error('❌ La contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (!email.includes('@')) {
        console.error('❌ Email inválido');
        return;
    }

    // Verificar si el email ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        console.error(`❌ El email ${email} ya está registrado`);
        console.log('💡 Usa el comando "reset" para cambiar la contraseña');
        return;
    }

    // Crear usuario
    try {
        const user = new User({
            nombre,
            email: email.toLowerCase(),
            password, // Se hasheará automáticamente
            telefono: telefono || undefined,
            role: 'admin',
            membershipStatus: 'activo',
            isActive: true
        });

        await user.save();

        console.log('\n✅ Administrador creado exitosamente!');
        console.log(`   Email: ${email}`);
        console.log(`   Contraseña: ${password}`);
        console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro');

    } catch (error) {
        console.error('❌ Error creando administrador:', error.message);
    }
}

async function resetPassword(emailArg) {
    let email = emailArg;

    if (!email) {
        email = await question('Email del administrador: ');
    }

    if (!email) {
        console.error('❌ Email es obligatorio');
        return;
    }

    // Buscar usuario
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        console.error(`❌ No se encontró usuario con email: ${email}`);
        return;
    }

    if (user.role !== 'admin') {
        console.error(`❌ El usuario ${email} no es administrador (role: ${user.role})`);
        console.log('💡 Solo se pueden resetear contraseñas de administradores con este script');
        return;
    }

    console.log(`\n✅ Usuario encontrado: ${user.nombre}`);

    const newPassword = await question('Nueva contraseña (mínimo 6 caracteres): ');

    if (!newPassword || newPassword.length < 6) {
        console.error('❌ La contraseña debe tener al menos 6 caracteres');
        return;
    }

    // Actualizar contraseña
    try {
        user.password = newPassword; // Se hasheará automáticamente
        user.refreshTokens = []; // Invalidar todas las sesiones
        await user.save();

        console.log('\n✅ Contraseña actualizada exitosamente!');
        console.log(`   Email: ${email}`);
        console.log(`   Nueva contraseña: ${newPassword}`);
        console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales en un lugar seguro');
        console.log('💡 Todas las sesiones previas han sido cerradas por seguridad');

    } catch (error) {
        console.error('❌ Error actualizando contraseña:', error.message);
    }
}

async function main() {
    const command = process.argv[2];
    const arg = process.argv[3];

    console.log('🔐 Script de Recuperación de Admin - UGT-CLM-UGR Granada');
    console.log('═══════════════════════════════════════════════════════════\n');

    await connectDB();

    switch (command) {
        case 'list':
            await listAdmins();
            break;

        case 'create':
            await createAdmin();
            break;

        case 'reset':
            await resetPassword(arg);
            break;

        default:
            console.log('📖 Uso:');
            console.log('   node scripts/admin-recovery.js list          - Listar admins');
            console.log('   node scripts/admin-recovery.js create        - Crear nuevo admin');
            console.log('   node scripts/admin-recovery.js reset <email> - Resetear contraseña');
            console.log('\nEjemplos:');
            console.log('   node scripts/admin-recovery.js list');
            console.log('   node scripts/admin-recovery.js create');
            console.log('   node scripts/admin-recovery.js reset admin@ugtclmgranada.org');
    }

    rl.close();
    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
}

main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
});
