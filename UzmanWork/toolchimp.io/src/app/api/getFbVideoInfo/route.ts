import { NextRequest, NextResponse } from "next/server";
import getFbVideoInfo from "fb-downloader-scrapper";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const videoInfo = await getFbVideoInfo(url);
    return NextResponse.json(videoInfo, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch video info" },
      { status: 500 }
    );
  }
}
