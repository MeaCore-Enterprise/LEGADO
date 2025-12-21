require('dotenv').config();

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const storyRoutes = require('./routes/storyRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares básicos
app.use(express.json());
app.use(cookieParser());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Conexión a la base de datos
connectDB();

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/stories', storyRoutes);

// Ruta para lectura pública de historias por slug
app.get('/s/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'story.html'));
});

// Placeholder simple para verificar que el servidor arranca
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Servidor LEGADO escuchando en puerto ${port}`);
});
