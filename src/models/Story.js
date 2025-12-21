const mongoose = require('mongoose');

const MIN_BODY_LENGTH = 500;

const StorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
      validate: {
        validator: function (value) {
          return typeof value === 'string' && value.length >= MIN_BODY_LENGTH;
        },
        message: `El cuerpo de la historia debe tener al menos ${MIN_BODY_LENGTH} caracteres`,
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

module.exports = mongoose.model('Story', StorySchema);
