const express = require('express');
const {
    createOffer,
    getOffers,
    respondToOffer,
    cancelOffer
} = require('../controllers/offerController');

const router = express.Router();

const { protect } = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(protect);

router.route('/')
    .post(createOffer)
    .get(getOffers);

router.route('/:id/respond')
    .put(respondToOffer);

router.route('/:id')
    .delete(cancelOffer);

module.exports = router;
