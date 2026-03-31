const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: { type: String, required: true },
    prediction: {
        class: { type: String, required: true },
        confidence: { type: Number, required: true },
        is_cancerous: { type: Boolean, required: true }
    },
    metadata: {
        raw_label: String,
        patient_id: String,
        timestamp: { type: Date, default: Date.now }
    }
});

module.exports = mongoose.model('Scan', ScanSchema);
