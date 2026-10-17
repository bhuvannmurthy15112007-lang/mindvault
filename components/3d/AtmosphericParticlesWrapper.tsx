'use client';

import dynamic from 'next/dynamic';
import React from 'react';

export const DynamicAtmosphericParticles = dynamic(
  () => import('./AtmosphericParticles').then((mod) => mod.AtmosphericParticles),
  { ssr: false }
);

export default DynamicAtmosphericParticles;
