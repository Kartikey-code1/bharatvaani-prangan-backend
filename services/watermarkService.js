import sharp from 'sharp';
export async function addLogoWatermark(imagePath, logoPath, outputPath){
  // Places logo top-left. Call this after upload when logo exists.
  await sharp(imagePath).composite([{input:logoPath, top:20, left:20}]).toFile(outputPath);
  return outputPath;
}
