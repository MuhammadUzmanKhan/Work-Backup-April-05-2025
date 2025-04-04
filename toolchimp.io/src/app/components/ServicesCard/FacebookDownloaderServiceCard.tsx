import { ServicesFeatureCard } from "../common/ServicesFeatureCard";

export default function FacebookDownloaderServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center">
        <ServicesFeatureCard
          icon="🔗"
          title="Easy URL Input"
          description="Simply paste the URL of the Facebook video you want to download."
        />
        <ServicesFeatureCard
          icon="⚡"
          title="Fast and Efficient"
          description="Our downloader quickly fetches video information and initiates the download process."
        />
        <ServicesFeatureCard
          icon="📂"
          title="Download in MP4"
          description="Download Facebook videos in MP4 format for easy playback on any device."
        />
        <ServicesFeatureCard
          icon="🆓"
          title="Completely Free"
          description="ToolChimp's Facebook Video Downloader is free to use with no hidden charges or subscriptions."
        />
        <ServicesFeatureCard
          icon="🔍"
          title="Get Video Info"
          description="View detailed video information including title, author, and duration before downloading."
        />
        <ServicesFeatureCard
          icon="🌐"
          title="Accessible Anytime"
          description="Access the downloader anytime from anywhere without the need for any software installation."
        />
      </div>
    </div>
  );
}
