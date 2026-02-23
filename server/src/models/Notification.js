const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "L'utilisateur est requis"],
    },
    type: {
      type: String,
      enum: {
        values: ['info', 'success', 'warning', 'error'],
        message: 'Le type "{VALUE}" n\'est pas valide',
      },
      default: 'info',
    },
    title: {
      type: String,
      required: [true, 'Le titre est requis'],
      trim: true,
      maxlength: [200, 'Le titre ne peut pas depasser 200 caracteres'],
    },
    message: {
      type: String,
      required: [true, 'Le message est requis'],
      trim: true,
      maxlength: [1000, 'Le message ne peut pas depasser 1000 caracteres'],
    },
    link: {
      type: String,
      trim: true,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour les requetes frequentes : notifications d'un utilisateur, non lues, triees par date
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
