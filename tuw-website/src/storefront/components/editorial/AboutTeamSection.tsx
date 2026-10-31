'use client';

import React from 'react';
import Image from 'next/image';

export interface TeamMember {
  name: string;
  role: string;
  imageSrc: string;
}

export interface AboutTeamSectionProps {
  title?: string;
  eyebrow?: string;
  subtitle?: string;
  members?: TeamMember[];
  className?: string;
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    name: 'Urvil Kargathala',
    role: 'Founder & Creative Director',
    imageSrc: '/images/about/urvilkargathala.png',
  },
  {
    name: 'Meet Rabadiya',
    role: 'Head of Design & Digital Experience',
    imageSrc: '/images/about/meetrabadiya.png',
  },
  {
    name: 'Dharmil Gajjar',
    role: 'Head of Platform & Systems Infrastructure',
    imageSrc: '/images/about/dharmil-gajjar.png',
  },
];

export default function AboutTeamSection({
  title = 'Meet Our Team',
  eyebrow = 'The Collective',
  subtitle = 'The visionary leadership, digital artisans, and platform architects behind every architectural silhouette.',
  members = DEFAULT_MEMBERS,
  className = '',
}: AboutTeamSectionProps) {
  if (!members || members.length === 0) return null;

  return (
    <section className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 ${className}`}>
      {/* Section Header */}
      <div className="max-w-2xl mb-12 sm:mb-16 space-y-3">
        <span className="text-xs uppercase font-semibold tracking-luxury text-store-gold block">
          {eyebrow}
        </span>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-medium tracking-tight text-store-charcoal leading-tight">
          {title}
        </h2>
        <p className="text-sm sm:text-base text-store-text-secondary leading-relaxed font-sans">
          {subtitle}
        </p>
      </div>

      {/* Team Member Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {members.map((member) => (
          <div
            key={member.name}
            className="group flex flex-col space-y-4 rounded-2xl bg-store-surface p-3 border border-store-card-border shadow-2xs transition-all duration-200 hover:shadow-xs"
          >
            <div className="relative aspect-3/4 w-full rounded-xl overflow-hidden bg-store-cream border border-store-card-border">
              <Image
                src={member.imageSrc}
                alt={`${member.name} - ${member.role} at The Unplugged Wear`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-104"
              />
            </div>

            <div className="space-y-1 px-1 pb-2">
              <h3 className="text-base font-heading font-medium text-store-charcoal group-hover:text-store-action-primary transition-colors">
                {member.name}
              </h3>
              <p className="text-xs uppercase tracking-luxury text-store-muted font-medium">
                {member.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

