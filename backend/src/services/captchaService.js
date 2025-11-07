/**
 * Servicio CAPTCHA Simple
 * UGT-CLM-UGR Granada
 * Implementación básica de CAPTCHA matemático
 */

const crypto = require('crypto');

/**
 * Generar un nuevo CAPTCHA
 */
function generateCaptcha() {
    // Generar dos números aleatorios entre 1 y 10
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    // Generar ID único para este CAPTCHA
    const captchaId = crypto.randomBytes(16).toString('hex');
    
    // Calcular respuesta
    const answer = num1 + num2;
    
    // Tiempo de expiración (5 minutos)
    const expiresAt = Date.now() + (5 * 60 * 1000);
    
    // Almacenar en memoria (en producción usar Redis)
    if (!global.captchaStore) {
        global.captchaStore = new Map();
    }
    
    global.captchaStore.set(captchaId, {
        answer,
        expiresAt,
        attempts: 0
    });
    
    // Liminar CAPTCHAs expirados periódicamente
    cleanupExpiredCaptchas();
    
    return {
        captchaId,
        question: `¿Cuánto es ${num1} + ${num2}?`,
        expiresAt
    };
}

/**
 * Verificar respuesta del CAPTCHA
 */
function verifyCaptcha(captchaId, userAnswer) {
    if (!global.captchaStore) {
        return { valid: false, message: 'Sistema CAPTCHA no disponible' };
    }
    
    const captcha = global.captchaStore.get(captchaId);
    
    if (!captcha) {
        return { valid: false, message: 'CAPTCHA inválido o expirado' };
    }
    
    // Verificar si ha expirado
    if (Date.now() > captcha.expiresAt) {
        global.captchaStore.delete(captchaId);
        return { valid: false, message: 'CAPTCHA expirado' };
    }
    
    // Verificar número de intentos (máximo 3)
    if (captcha.attempts >= 3) {
        global.captchaStore.delete(captchaId);
        return { valid: false, message: 'Demasiados intentos. Genera un nuevo CAPTCHA' };
    }
    
    // Incrementar intentos
    captcha.attempts++;
    
    // Verificar respuesta
    const isValid = parseInt(userAnswer) === captcha.answer;
    
    if (isValid) {
        // Eliminar CAPTCHA después de uso exitoso
        global.captchaStore.delete(captchaId);
        return { valid: true };
    } else {
        return { 
            valid: false, 
            message: `Respuesta incorrecta. Intento ${captcha.attempts}/3`,
            remainingAttempts: 3 - captcha.attempts
        };
    }
}

/**
 * Limpiar CAPTCHAs expirados
 */
function cleanupExpiredCaptchas() {
    if (!global.captchaStore) return;
    
    const now = Date.now();
    for (const [id, captcha] of global.captchaStore.entries()) {
        if (now > captcha.expiresAt) {
            global.captchaStore.delete(id);
        }
    }
}

/**
 * Obtener estadísticas del CAPTCHA
 */
function getCaptchaStats() {
    if (!global.captchaStore) {
        return { active: 0, totalGenerated: 0 };
    }
    
    const active = global.captchaStore.size;
    const now = Date.now();
    let validCount = 0;
    
    for (const captcha of global.captchaStore.values()) {
        if (now <= captcha.expiresAt) {
            validCount++;
        }
    }
    
    return {
        active: validCount,
        totalStored: active
    };
}

/**
 * Middleware para verificar CAPTCHA en requests
 */
function requireCaptcha(req, res, next) {
    const { captchaId, captchaAnswer } = req.body;
    
    if (!captchaId || !captchaAnswer) {
        return res.status(400).json({
            error: 'CAPTCHA requerido',
            message: 'Debes completar el CAPTCHA para continuar'
        });
    }
    
    const verification = verifyCaptcha(captchaId, captchaAnswer);
    
    if (!verification.valid) {
        return res.status(400).json({
            error: 'CAPTCHA inválido',
            message: verification.message,
            remainingAttempts: verification.remainingAttempts
        });
    }
    
    // CAPTCHA válido, continuar
    next();
}

module.exports = {
    generateCaptcha,
    verifyCaptcha,
    requireCaptcha,
    getCaptchaStats,
    cleanupExpiredCaptchas
};
