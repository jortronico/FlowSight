const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const JWT_SECRET = process.env.JWT_SECRET || 'flowsight_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Buscar usuario
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar contraseña
      const isValidPassword = await UserModel.validatePassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Verificar cuenta activa
      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Cuenta desactivada. Contacte al administrador.'
        });
      }

      // Generar token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },

  async register(req, res) {
    try {
      const { email, password, name } = req.body;

      // Verificar si el email ya existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // Crear usuario
      const user = await UserModel.create({ email, password, name, role: 'viewer' });

      // Generar token
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token,
          user
        }
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },

  async me(req, res) {
    try {
      const user = await UserModel.findById(req.user.id);
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await UserModel.findByEmail(req.user.email);

      // Verificar contraseña actual
      const isValidPassword = await UserModel.validatePassword(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      // Actualizar contraseña
      await UserModel.updatePassword(req.user.id, newPassword);

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }
};

module.exports = authController;

