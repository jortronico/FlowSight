const UserModel = require('../models/user.model');

const userController = {
  async getAll(req, res) {
    try {
      const users = await UserModel.findAll();
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo usuarios'
      });
    }
  },

  async getById(req, res) {
    try {
      const user = await UserModel.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo usuario'
      });
    }
  },

  async create(req, res) {
    try {
      const { email } = req.body;

      // Verificar si ya existe
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      const user = await UserModel.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Usuario creado exitosamente',
        data: user
      });
    } catch (error) {
      console.error('Error creando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando usuario'
      });
    }
  },

  async update(req, res) {
    try {
      const user = await UserModel.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const updatedUser = await UserModel.update(req.params.id, req.body);
      
      res.json({
        success: true,
        message: 'Usuario actualizado',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando usuario'
      });
    }
  },

  async delete(req, res) {
    try {
      const user = await UserModel.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // No permitir eliminarse a sí mismo
      if (user.id === req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta'
        });
      }

      await UserModel.delete(req.params.id);
      
      res.json({
        success: true,
        message: 'Usuario eliminado'
      });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando usuario'
      });
    }
  },

  async resetPassword(req, res) {
    try {
      const { newPassword } = req.body;
      const user = await UserModel.findById(req.params.id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      await UserModel.updatePassword(req.params.id, newPassword);
      
      res.json({
        success: true,
        message: 'Contraseña restablecida'
      });
    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error restableciendo contraseña'
      });
    }
  }
};

module.exports = userController;

