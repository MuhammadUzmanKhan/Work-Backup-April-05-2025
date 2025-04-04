import YouTubeDownloaderIcon from "@/icons/youtube-icon";

export default function IntroductionOfYouTubeDownloader() {
  return (
    <div className="flex flex-row px-5 justify-start items-center">
      <div ml-5>
        <YouTubeDownloaderIcon />
      </div>
      <div className="ml-5 flex px-5 justify-start items-start pb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Download YouTube Videos
          </h2>
          <ol className="list-decimal ml-5 text-lg">
            <li>Paste the URL of the YouTube video you want to download.</li>
            <li>Click or press Enter on &quot;Get Video Info&quot;.</li>
            <li>Click on &quot;Get Video Info&quot;.</li>
            <li>
              The video information, including title, author, and duration, will
              be displayed.
            </li>
            <li>Click the download button to start downloading the video.</li>
            <li>
              You will see a notification of success after the download is
              complete.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
