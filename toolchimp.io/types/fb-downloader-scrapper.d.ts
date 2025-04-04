declare module "fb-downloader-scrapper" {
  interface VideoInfo {
    title: string;
    description: string;
    url: string;
    thumbnail: string;
    // add any other properties that the `fb-downloader-scrapper` returns
  }

  function getFbVideoInfo(url: string): Promise<VideoInfo>;

  export = getFbVideoInfo;
}
