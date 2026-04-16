'use client'

import { useEffect } from 'react'
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-webgl2'

export default function HeroAnimation() {
  const { RiveComponent, rive } = useRive({
    src: '/kida_hero.riv',
    autoplay: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  })

  useEffect(() => {
    if (!rive) return
    const sms = rive.stateMachineNames
    if (sms?.length) {
      rive.play(sms[0])
    }
  }, [rive])

  return <RiveComponent className="w-full h-full" />
}
