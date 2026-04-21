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

        const imagePath = imageFile ? path.resolve(imageFile.path) : "None";
        const pdfPath = pdfFile ? path.resolve(pdfFile.path) : "None";
        const pythonScriptPath = path.resolve(__dirname, '../../ml-pipeline/predict.py');
        
        // Auto-detect Python path based on OS (Windows local vs Linux HuggingFace)
        const isWindows = process.platform === "win32";
        const venvPythonPath = isWindows 
            ? path.resolve(__dirname, '../../ml-pipeline/venv/Scripts/python.exe')
            : "python3";

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
