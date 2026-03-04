import sharp from 'sharp';

export class ImageCompressor {
    /**
     * Compresses a base64 image and returns a buffer or base64
     * @param base64Data Raw base64 data (with or without prefix)
     * @param options Compression settings
     */
    static async compress(
        base64Data: string,
        options: {
            quality?: number;
            lossless?: boolean;
            maxWidth?: number;
        } = {}
    ): Promise<Buffer> {
        // Clean base64 prefix
        const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');

        let pipeline = sharp(buffer);

        // Apply resizing only if maxWidth is provided (Zero-Sacrifice policy usually keeps it full)
        if (options.maxWidth) {
            pipeline = pipeline.resize({
                width: options.maxWidth,
                withoutEnlargement: true,
                fit: 'inside'
            });
        }

        // Convert to WebP with high-fidelity settings
        return pipeline
            .webp({
                quality: options.quality || 90,
                lossless: options.lossless || false,
                effort: 6, // Max CPU effort for best compression ratio
                smartSubsample: true
            })
            .toBuffer();
    }
}
