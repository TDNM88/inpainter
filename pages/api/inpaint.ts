import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { originalImage, productImage, maskImage } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!originalImage || !maskImage) {
    return res.status(400).json({ error: "Missing required fields: originalImage and maskImage are required" });
  }

  try {
    // Gửi request đến API Tensor.Art (hoặc proxy API)
    const apiUrl = process.env.NEXT_PUBLIC_INPAINTING_API_URL || "https://default-tensor-art-api-url.com/inpaint";
    const apiKey = process.env.TENSOR_ART_API_KEY;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(apiKey && { "Authorization": `Bearer ${apiKey}` }), // Thêm Authorization nếu Tensor.Art yêu cầu
      },
      body: JSON.stringify({
        originalImage,
        productImage: productImage || null, // productImage là tùy chọn, gửi nếu có
        maskImage,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Inpainting API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const output = data.output; // Giả định API trả về { output: "url" } như cqfinal

    if (!output) {
      throw new Error("No output received from inpainting API");
    }

    res.status(200).json({ output });
  } catch (error) {
    console.error("Inpainting error:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Something went wrong" });
  }
}
