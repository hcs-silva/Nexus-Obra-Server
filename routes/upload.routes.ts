import { Router } from "express";
import crypto from "crypto";
import isAuthenticated from "../middlewares/authMiddleware";

const router = Router();

router.post("/cloudinary/signature", isAuthenticated, (req, res) => {
  const resourceType = req.body?.resourceType === "raw" ? "raw" : "image";

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({
      message: "Cloudinary configuration is missing on the server.",
    });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder =
    resourceType === "raw"
      ? process.env.CLOUDINARY_RAW_FOLDER || "nexus-obra/raw"
      : process.env.CLOUDINARY_IMAGE_FOLDER || "nexus-obra/images";

  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(`${paramsToSign}${apiSecret}`)
    .digest("hex");

  return res.status(200).json({
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
    resourceType,
  });
});

export default router;
