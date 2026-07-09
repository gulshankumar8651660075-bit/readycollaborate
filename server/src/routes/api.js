const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

const { register, login, getMe } = require('../controllers/authController');
const { createDocument, getDocuments, getDocument, deleteDocument } = require('../controllers/documentController');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const { getDashboardStats } = require('../controllers/dashboardController');

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authMiddleware, getMe);

// Document routes
router.post('/documents', authMiddleware, createDocument);
router.get('/documents', authMiddleware, getDocuments);
router.get('/documents/:id', authMiddleware, getDocument);
router.delete('/documents/:id', authMiddleware, deleteDocument);

// Task routes
router.get('/tasks', authMiddleware, getTasks);
router.post('/tasks', authMiddleware, createTask);
router.put('/tasks/:id', authMiddleware, updateTask);
router.delete('/tasks/:id', authMiddleware, deleteTask);

// Dashboard stats route
router.get('/dashboard/stats', authMiddleware, getDashboardStats);

module.exports = router;
