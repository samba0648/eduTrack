import * as faceapi from 'face-api.js';
import path from 'path';
import { createCanvas, loadImage, Canvas, Image, ImageData } from 'canvas';

// Create a dummy canvas instance
const canvas = createCanvas(224, 224);
const ctx = canvas.getContext('2d');

// Properly configure face-api.js for Node.js
faceapi.env.monkeyPatch({
  Canvas: Canvas as unknown as any, // Fix: Cast Canvas to match expected type
  Image: Image as unknown as any,
  ImageData: ImageData as unknown as any,
});

class FaceRecognitionService {
  private modelsLoaded: boolean = false;

  constructor() {
    this.loadModels();
  }

  private async loadModels() {
    const MODEL_PATH = path.join(__dirname, '../models');

    try {
      await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODEL_PATH);
      await faceapi.nets.faceLandmark68Net.loadFromDisk(MODEL_PATH);
      await faceapi.nets.faceRecognitionNet.loadFromDisk(MODEL_PATH);
      this.modelsLoaded = true;
      console.log('Face recognition models loaded successfully');
    } catch (error) {
      console.error('Error loading face recognition models:', error);
    }
  }

  async extractFaceEncoding(imageBuffer: Buffer): Promise<number[] | null> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }

    try {
      // Load image from buffer
      const img = await loadImage(imageBuffer);
      
      // Draw image onto canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);

      // Convert the Node.js `Canvas` to a compatible format
      const detections = await faceapi.detectSingleFace(canvas as unknown as any)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detections) {
        return null;
      }

      return Array.from(detections.descriptor); // Convert Float32Array to array for MongoDB storage
    } catch (error) {
      console.error('Error extracting face encoding:', error);
      return null;
    }
  }

  async extractMultipleFaceEncodings(imageBuffer: Buffer): Promise<number[][]> {
    if (!this.modelsLoaded) {
      await this.loadModels();
    }
  
    try {
      const img = await loadImage(imageBuffer);
      // Draw image onto canvas
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, img.width, img.height);
      const detections = await faceapi.detectAllFaces(canvas as unknown as any)
        .withFaceLandmarks()
        .withFaceDescriptors();
  
      if (!detections || detections.length === 0) {
        return [];
      }
  
      return detections.map(det => Array.from(det.descriptor));
    } catch (error) {
      console.error("Error extracting multiple face encodings:", error);
      return [];
    }
  }
  

  async compareFaces(storedEncoding: number[], currentEncoding: number[]): Promise<number> {
    const stored = new Float32Array(storedEncoding);
    const current = new Float32Array(currentEncoding);
    return faceapi.euclideanDistance(stored, current);
  }

  async verifyFace(storedEncoding: number[], currentEncoding: number[]): Promise<boolean> {
    const THRESHOLD = 0.6;
    const distance = await this.compareFaces(storedEncoding, currentEncoding);
    return distance < THRESHOLD;
  }
}

export default new FaceRecognitionService();
