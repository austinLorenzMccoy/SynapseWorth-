"use client"

import { Zap, Shield, Leaf } from "lucide-react"

const features = [
  {
    title: "Microtransactions",
    description: "Sub-cent transaction fees enable true knowledge micro-payments and granular economic incentives.",
    icon: Zap,
  },
  {
    title: "Immutable Verification",
    description: "Hedera Consensus Service provides tamper-proof audit trails for every AI decision and action.",
    icon: Shield,
  },
  {
    title: "Low-Carbon Ledger",
    description: "Carbon-negative network ensures sustainable scaling for the future of decentralized intelligence.",
    icon: Leaf,
  },
]

export function WhyHederaSection() {
  return (
    <section className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Why Hedera
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            The trust, coordination, and economic layer for verifiable AI
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-lg border border-border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card"
            >
              {/* Icon container */}
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4 transition-colors group-hover:bg-primary/20">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Subtle glow on hover */}
              <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity -z-10 blur-xl" />
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <div className="mt-16 text-center">
          <p className="text-xl md:text-2xl font-semibold text-foreground">
            <span className="text-muted-foreground">SynapseWorth doesn{"'"}t ask you to trust AI</span>
            {" "}—{" "}
            <span className="text-primary">it proves it.</span>
          </p>
        </div>
      </div>
    </section>
  )
}
