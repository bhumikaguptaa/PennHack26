import { NextResponse } from "next/server";
import { pinata } from "@/pinataProvider";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Upload the file to IPFS via Pinata
    const upload = await pinata.upload.public.file(file);

    // Send the successful IPFS hash back to the frontend
    return NextResponse.json(
      { success: true, ipfsHash: upload.cid },
      { status: 200 }
    );
  } catch (error) {
    console.error("Pinata Upload Error:", error);
    
    // Return a 500 error if something goes wrong
    return NextResponse.json(
      { success: false, error: "Failed to upload to IPFS" },
      { status: 500 }
    );
  }
}
