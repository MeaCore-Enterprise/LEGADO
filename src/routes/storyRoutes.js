const express = require('express');
const storyController = require('../controllers/storyController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, storyController.upsertDraft);
router.get('/me', auth, storyController.getMyStory);
router.post('/publish', auth, storyController.publishMyStory);
router.get('/public/:slug', storyController.getPublicStoryBySlug);

module.exports = router;
