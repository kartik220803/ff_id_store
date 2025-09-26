const mongoose = require('mongoose');
const Product = require('../models/Product');

// Generate random UID for existing products that don't have one
const generateUID = () => {
    // Generate a random 10-digit UID
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const addUIDToExistingProducts = async () => {
    try {
        console.log('Starting UID migration for existing products...');

        // Find all products without UID
        const productsWithoutUID = await Product.find({
            $or: [
                { uid: { $exists: false } },
                { uid: null },
                { uid: '' }
            ]
        });

        console.log(`Found ${productsWithoutUID.length} products without UID`);

        if (productsWithoutUID.length === 0) {
            console.log('All products already have UIDs');
            return;
        }

        // Update each product with a unique UID
        for (const product of productsWithoutUID) {
            let uid;
            let isUnique = false;

            // Generate unique UID
            while (!isUnique) {
                uid = generateUID();
                const existingProduct = await Product.findOne({ uid });
                if (!existingProduct) {
                    isUnique = true;
                }
            }

            // Update product with UID
            await Product.findByIdAndUpdate(product._id, { uid });
            console.log(`Updated product ${product._id} with UID: ${uid}`);
        }

        console.log('UID migration completed successfully!');

    } catch (error) {
        console.error('Error during UID migration:', error);
        throw error;
    }
};

module.exports = { addUIDToExistingProducts };
