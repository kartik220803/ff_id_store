const Product = require('../models/Product');

/**
 * Migration to add social interaction fields to existing products
 */
const addSocialFieldsToProducts = async () => {
    try {
        console.log('Starting social fields migration for products...');

        // Find products that don't have social fields
        const productsToUpdate = await Product.find({
            $or: [
                { likes: { $exists: false } },
                { views: { $exists: false } },
                { viewedBy: { $exists: false } },
                { commentsCount: { $exists: false } }
            ]
        });

        console.log(`Found ${productsToUpdate.length} products that need social fields migration`);

        if (productsToUpdate.length === 0) {
            console.log('No products need social fields migration');
            return;
        }

        // Update products with default social field values
        const updateResult = await Product.updateMany(
            {
                $or: [
                    { likes: { $exists: false } },
                    { views: { $exists: false } },
                    { viewedBy: { $exists: false } },
                    { commentsCount: { $exists: false } }
                ]
            },
            {
                $set: {
                    likes: [],
                    views: 0,
                    viewedBy: [],
                    commentsCount: 0
                }
            }
        );

        console.log(`Successfully updated ${updateResult.modifiedCount} products with social fields`);
        console.log('Social fields migration completed successfully!');

    } catch (error) {
        console.error('Error during social fields migration:', error);
        throw error;
    }
};

module.exports = {
    addSocialFieldsToProducts
};
