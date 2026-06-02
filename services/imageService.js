import sharp from "sharp";
import axios from "axios";
import fs from "fs";

const addLogoToImage = async (imageUrl, filename) => {
  try {

    const response = await axios({
      url: imageUrl,
      responseType: "arraybuffer"
    });

    const imageBuffer = Buffer.from(response.data);

    if (!fs.existsSync("uploads")) {
      fs.mkdirSync("uploads");
    }

    const outputPath = `uploads/${filename}.jpg`;

    await sharp(imageBuffer)
  .resize(1200, 700)
  .composite([
    {
      input: await sharp("./assets/logo.png")
        .resize({ width: 180 }) // logo chhota kar do
        .png()
        .toBuffer(),
      gravity: "northwest"
    }
  ])
  .jpeg({ quality: 90 })
  .toFile(outputPath);

    return `http://localhost:5000/${outputPath}`;

  } catch (error) {

    console.log("LOGO ERROR:", error.message);

    return imageUrl;

  }
};

export default addLogoToImage;