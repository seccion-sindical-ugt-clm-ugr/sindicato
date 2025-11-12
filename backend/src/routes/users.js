const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Importar modelos y middleware
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validators');

/**
 * Configuración de Multer para upload de fotos
 * Almacenamiento en memoria para procesamiento
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // Validar tipos de archivo permitidos
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipo de archivo no permitido. Solo se aceptan JPEG, PNG, GIF y WebP.'), false);
    }
};

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    },
    fileFilter
});

/**
 * @route   GET /api/users/profile
 * @desc    Obtener perfil del usuario actual
 * @access  Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        // Preparar respuesta completa del perfil
        const profileData = {
            _id: user._id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            department: user.department,
            member: user.member,
            notifications: user.notifications,
            publicProfile: user.publicProfile,
            profilePhoto: user.profilePhoto,
            role: user.role,
            status: user.status,
            registrationDate: user.registrationDate,
            lastLogin: user.lastLogin,
            loginCount: user.loginCount || 0,
            registeredFrom: user.registeredFrom
        };

        console.log(`📋 Perfil obtenido: ${user.email}`);

        res.json({
            success: true,
            user: profileData
        });

    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el perfil'
        });
    }
});

/**
 * @route   PUT /api/users/update
 * @desc    Actualizar perfil de usuario
 * @access  Private
 */
router.put('/update', authenticateToken, validateProfileUpdate, async (req, res) => {
    try {
        const userId = req.userId;
        const {
            name,
            phone,
            department,
            notifications,
            publicProfile
        } = req.body;

        console.log(`✏️ Actualización de perfil: ${req.user.email}`);

        // Preparar datos para actualizar
        const updateData = {
            updatedAt: new Date()
        };

        // Añadir solo campos proporcionados
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (department !== undefined) updateData.department = department;
        if (notifications !== undefined) updateData.notifications = notifications;
        if (publicProfile !== undefined) updateData.publicProfile = publicProfile;

        // Actualizar usuario en la base de datos
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Preparar respuesta
        const profileData = {
            _id: updatedUser._id,
            email: updatedUser.email,
            name: updatedUser.name,
            phone: updatedUser.phone,
            department: updatedUser.department,
            member: updatedUser.member,
            notifications: updatedUser.notifications,
            publicProfile: updatedUser.publicProfile,
            profilePhoto: updatedUser.profilePhoto,
            role: updatedUser.role,
            registrationDate: updatedUser.registrationDate,
            lastLogin: updatedUser.lastLogin
        };

        console.log(`✅ Perfil actualizado: ${updatedUser.email}`);

        res.json({
            success: true,
            user: profileData,
            message: 'Perfil actualizado correctamente'
        });

    } catch (error) {
        console.error('Error al actualizar perfil:', error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos',
                details: Object.values(error.errors).map(err => ({
                    field: err.path,
                    message: err.message
                }))
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al actualizar el perfil'
        });
    }
});

/**
 * @route   POST /api/users/upload-photo
 * @desc    Subir foto de perfil
 * @access  Private
 */
router.post('/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
    try {
        const userId = req.userId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No se ha proporcionado ninguna foto'
            });
        }

        console.log(`📸 Subida de foto: ${req.user.email}`);

        // Convertir imagen a base64
        const base64Image = req.file.buffer.toString('base64');
        const mimeType = req.file.mimetype;
        const photoUrl = `data:${mimeType};base64,${base64Image}`;

        // Actualizar usuario con la nueva foto
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                profilePhoto: photoUrl,
                photoUploadedAt: new Date()
            },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        console.log(`✅ Foto subida: ${updatedUser.email}`);

        res.json({
            success: true,
            photoURL: photoUrl,
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                name: updatedUser.name,
                profilePhoto: updatedUser.profilePhoto
            },
            message: 'Foto de perfil subida correctamente'
        });

    } catch (error) {
        console.error('Error al subir foto:', error);

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    error: 'El archivo es demasiado grande. Máximo 5MB.'
                });
            }
        }

        if (error.message.includes('Tipo de archivo no permitido')) {
            return res.status(400).json({
                success: false,
                error: error.message
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al subir la foto de perfil'
        });
    }
});

/**
 * @route   DELETE /api/users/delete-photo
 * @desc    Eliminar foto de perfil
 * @access  Private
 */
router.delete('/delete-photo', authenticateToken, async (req, res) => {
    try {
        const userId = req.userId;

        console.log(`🗑️ Eliminar foto: ${req.user.email}`);

        // Verificar si el usuario tiene foto
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        if (!user.profilePhoto) {
            return res.status(400).json({
                success: false,
                error: 'El usuario no tiene foto de perfil'
            });
        }

        // Eliminar foto del perfil
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                profilePhoto: null,
                photoUploadedAt: null
            },
            { new: true }
        ).select('-password');

        console.log(`✅ Foto eliminada: ${updatedUser.email}`);

        res.json({
            success: true,
            user: {
                _id: updatedUser._id,
                email: updatedUser.email,
                name: updatedUser.name,
                profilePhoto: null
            },
            message: 'Foto de perfil eliminada correctamente'
        });

    } catch (error) {
        console.error('Error al eliminar foto:', error);
        res.status(500).json({
            success: false,
            error: 'Error al eliminar la foto de perfil'
        });
    }
});

/**
 * @route   GET /api/users/public/:userId
 * @desc    Obtener perfil público de un usuario
 * @access  Public
 */
router.get('/public/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Buscar usuario
        const user = await User.findById(userId).select(
            'name department publicProfile registrationDate'
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        // Verificar si el perfil es público
        if (!user.publicProfile) {
            return res.status(403).json({
                success: false,
                error: 'Este perfil es privado'
            });
        }

        // Preparar datos públicos
        const publicData = {
            _id: user._id,
            name: user.name,
            department: user.department,
            registrationDate: user.registrationDate
        };

        res.json({
            success: true,
            user: publicData
        });

    } catch (error) {
        console.error('Error al obtener perfil público:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener el perfil público'
        });
    }
});

/**
 * @route   GET /api/users/stats
 * @desc    Obtener estadísticas del usuario (para dashboard)
 * @access  Private
 */
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const user = req.user;

        // Aquí puedes añadir estadísticas adicionales
        const stats = {
            memberSince: user.registrationDate,
            lastLogin: user.lastLogin,
            loginCount: user.loginCount || 0,
            hasProfilePhoto: !!user.profilePhoto,
            profileCompleted: !!(user.name && user.phone && user.department),
            notificationsEnabled: user.notifications
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

module.exports = router;