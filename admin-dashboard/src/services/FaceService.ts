import * as faceapi from 'face-api.js';

class FaceService {
    private modelsLoaded = false;

    async loadModels() {
        if (this.modelsLoaded) return;

        // Ensure absolute path to avoid issues with nested routes
        const MODEL_URL = window.location.origin + '/models';

        try {
            console.log('Loading Face API models from:', MODEL_URL);
            await Promise.all([
                faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
            ]);
            this.modelsLoaded = true;
            console.log('Face API models loaded successfully');
        } catch (error) {
            console.error('Error loading Face API models:', error);
            throw new Error(`Failed to load face models from ${MODEL_URL}. Check if files exist in /public/models.`);
        }
    }

    async getFaceDescriptor(imageOrVideo: HTMLImageElement | HTMLVideoElement): Promise<Float32Array | undefined> {
        if (!this.modelsLoaded) await this.loadModels();

        // Detect single face with landmarks and descriptor
        const detection = await faceapi.detectSingleFace(imageOrVideo)
            .withFaceLandmarks()
            .withFaceDescriptor();

        return detection?.descriptor;
    }

    createMatcher(labeledDescriptors: faceapi.LabeledFaceDescriptors[]) {
        return new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 distance threshold
    }
}

export const faceService = new FaceService();
