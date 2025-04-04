import React from "react";
import { ServicesFeatureCard } from "../common/ServicesFeatureCard";

export default function FlipACoinServiceCard() {
  return (
    <div className="container">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-centers">
        <ServicesFeatureCard
          icon="🤲"
          title="Quick and Simple"
          description="Our online coin toss simulator is incredibly easy to use; no instructions needed! See results instantly with each flip."
        />
        <ServicesFeatureCard
          icon="💰"
          title="Free to Use"
          description="ToolChimp's virtual coin flipper is completely free, available for unlimited use whenever you need it."
        />
        <ServicesFeatureCard
          icon="📊"
          title="Track Results"
          description="Keep track of your coin flips with our 'Heads or Tails' app, ensuring accurate tallies of heads and tails."
        />
        <ServicesFeatureCard
          icon="👍"
          title="Always Accessible"
          description="No more searching for spare change! ToolChimp's virtual coin is always just a click away, ready for use anytime."
        />
        <ServicesFeatureCard
          icon="👤"
          title="No Login Required"
          description="Skip the hassle of logging in for quick decisions. Just visit our app, click 'Flip a Coin,' and you're done."
        />
        <ServicesFeatureCard
          icon="🌐"
          title="Fully Online"
          description="Enjoy ToolChimp's virtual coin without any downloads. Simply visit our website, access the tool, and leave the decision to chance!"
        />
      </div>
    </div>
  );
}
