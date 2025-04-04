interface ServicesFeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function ServicesFeatureCard({
  icon,
  title,
  description,
}: ServicesFeatureCardProps) {
  return (
    <div className="grid-container-flip-coin">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p>{description}</p>
    </div>
  );
}
