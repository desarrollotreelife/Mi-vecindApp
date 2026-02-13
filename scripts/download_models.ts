import fs from 'fs';
import https from 'https';
import path from 'path';

const MODELS_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
const DEST_DIR = path.join(__dirname, 'admin-dashboard', 'public', 'models');

const files = [
    'ssd_mobilenetv1_model-weights_manifest.json',
    'ssd_mobilenetv1_model-shard1',
    'ssd_mobilenetv1_model-shard2',
    'face_landmark_68_model-weights_manifest.json',
    'face_landmark_68_model-shard1',
    'face_recognition_model-weights_manifest.json',
    'face_recognition_model-shard1',
    'face_recognition_model-shard2'
];

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

const download = (filename) => {
    const url = `${MODELS_URL}/${filename}`;
    const dest = path.join(DEST_DIR, filename);

    if (fs.existsSync(dest)) {
        console.log(`Skipping ${filename} (already exists)`);
        return;
    }

    console.log(`Downloading ${filename}...`);

    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${filename}`);
        });
    }).on('error', (err) => {
        fs.unlink(dest);
        console.error(`Error downloading ${filename}:`, err.message);
    });
};

files.forEach(download);
