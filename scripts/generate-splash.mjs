import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Source Icon (Must be high res, e.g., 512x512)
const SOURCE_ICON = 'public/icon.png';
const OUTPUT_DIR = 'public/splash';

// iOS Splash Screen Sizes (Width x Height)
const SPLASH_SIZES = [
    { w: 2048, h: 2732, dev: 'iPad Pro 12.9"' },
    { w: 1668, h: 2388, dev: 'iPad Pro 11"' },
    { w: 1536, h: 2048, dev: 'iPad Mini / Air' },
    { w: 1668, h: 2224, dev: 'iPad 10.5"' },
    { w: 1620, h: 2160, dev: 'iPad 10.2"' },
    { w: 1290, h: 2796, dev: 'iPhone 15 Pro Max' },
    { w: 1179, h: 2556, dev: 'iPhone 15 Pro' },
    { w: 1284, h: 2778, dev: 'iPhone 14 Plus' },
    { w: 1170, h: 2532, dev: 'iPhone 14' },
    { w: 1125, h: 2436, dev: 'iPhone X/XS' },
    { w: 1242, h: 2688, dev: 'iPhone XS Max' },
    { w: 828, h: 1792, dev: 'iPhone XR' },
    { w: 1242, h: 2208, dev: 'iPhone 8 Plus' },
    { w: 750, h: 1334, dev: 'iPhone 8' },
    { w: 640, h: 1136, dev: 'iPhone SE' },
];

async function generateSplashScreens() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`🎨 Generating ${SPLASH_SIZES.length} Splash Screens from ${SOURCE_ICON}...`);

    for (const size of SPLASH_SIZES) {
        // We create portraits (Width x Height)
        // AND landscapes (Height x Width) usually, but iOS PWA often prioritizes portraits.
        // We will generate both sets to be safe? 
        // For simplicity and common PWA use: Portrait is key. Landscape is optional but nice.
        // Let's stick to Portrait first to cover 95% of use cases.
        
        const fileName = `apple-splash-${size.w}-${size.h}.png`;
        const outputPath = path.join(OUTPUT_DIR, fileName);

        // Logic: 
        // 1. Create a white background canvas of target size.
        // 2. Composite the icon in the center.
        // 3. Icon size should be reasonably visible (e.g., 20% of width? or fixed 192px?)
        // Apple specs say icon should not be scaled too huge. 192px or 256px is standard.
        const iconSize = Math.min(size.w * 0.4, 300); // 40% of width, max 300px

        try {
            // Resize icon first
            const iconBuffer = await sharp(SOURCE_ICON)
                .resize(Math.round(iconSize))
                .toBuffer();

            // Create blank white canvas
            await sharp({
                create: {
                    width: size.w,
                    height: size.h,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            })
            .composite([{ input: iconBuffer, gravity: 'center' }])
            .toFile(outputPath);

            console.log(`✅ Generated: ${fileName} (${size.dev})`);
        } catch (error) {
            console.error(`❌ Error generating ${fileName}:`, error);
        }
    }

    // Also generate Landscape versions (Swap W and H)
     for (const size of SPLASH_SIZES) {
        const w = size.h;
        const h = size.w;
        const fileName = `apple-splash-${w}-${h}.png`; // Landscape naming
        const outputPath = path.join(OUTPUT_DIR, fileName);
        const iconSize = Math.min(w * 0.4, 300);

         try {
            const iconBuffer = await sharp(SOURCE_ICON)
                .resize(Math.round(iconSize))
                .toBuffer();

            await sharp({
                create: {
                    width: w,
                    height: h,
                    channels: 4,
                    background: { r: 255, g: 255, b: 255, alpha: 1 }
                }
            })
            .composite([{ input: iconBuffer, gravity: 'center' }])
            .toFile(outputPath);
             console.log(`✅ Generated Landscape: ${fileName}`);

         } catch (e) {
             console.error(`❌ Error Landscape ${fileName}`, e);
         }
     }

    console.log(`✨ Done! ${SPLASH_SIZES.length * 2} images created.`);
}

generateSplashScreens();
