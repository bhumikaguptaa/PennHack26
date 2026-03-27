import { NextResponse } from "next/server";
import { PinataSDK } from "pinata";

// Initialize Pinata safely on the server
// Make sure PINATA_JWT and PINATA_GATEWAY are in your .env.local file
console.log("JWT loaded?", !!process.env.PINATA_JWT);
export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: "gray-implicit-dingo-846.mypinata.cloud",
});


export async function POST(request: Request) {
  try {
    // 1. Parse the incoming JSON data from your frontend

    const body = await request.json();

    console.log(body)
    // 2. Upload the data to IPFS via Pinata
    const upload = await pinata.upload.public.json(body);

    // 3. Send the successful IPFS hash back to the frontend
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