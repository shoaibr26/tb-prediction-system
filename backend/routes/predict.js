const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

router.post('/', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'pdf', maxCount: 1 }]), (req, res) => {
    try {
        const imageFile = req.files['image'] ? req.files['image'][0] : null;
        const pdfFile = req.files['pdf'] ? req.files['pdf'][0] : null;
        const symptoms = req.body.symptoms || '';

        if (!imageFile || !pdfFile) {
            return res.status(400).json({ error: 'Both Image and PDF are required.' });
        }

        const imagePath = path.resolve(imageFile.path);
        const pdfPath = path.resolve(pdfFile.path);
        const pythonScriptPath = path.resolve(__dirname, '../../ml-pipeline/predict.py');
        const venvPythonPath = path.resolve(__dirname, '../../ml-pipeline/venv/Scripts/python.exe');

        const pythonProcess = spawn(venvPythonPath, [pythonScriptPath, imagePath, pdfPath, symptoms]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                console.error("Python Error:", errorString);
                return res.status(500).json({ error: 'Error processing prediction pipeline.' });
            }
            try {
                // Ignore any tensorflow verbose logs safely printed to stdout if any
                const jsonStart = dataString.indexOf('{');
                const cleanJson = dataString.substring(jsonStart);
                const result = JSON.parse(cleanJson);
                res.json(result);
            } catch (err) {
                console.error("Failed to parse ML output:", dataString);
                res.status(500).json({ error: 'Invalid output from ML pipeline.' });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
