forever(() => {
    modules.maqueenFrontLeds.setAll(0xff0000)
    modules.maqueenBackLeds.setAll(0)
    pause(500)
    modules.maqueenFrontLeds.setAll(0)
    modules.maqueenBackLeds.setAll(0x00f000)
    pause(500)
})

forever(() => {
    if (modules.maqueenLineL1.brightness() > 0)
        led.plot(0, 0)
    else led.unplot(0, 0)
    if (modules.maqueenLineL2.brightness() > 0)
        led.plot(1, 0)
    else
        led.unplot(1, 0)
    if (modules.maqueenLineR1.brightness() > 0)
        led.plot(0, 1)
    else
        led.unplot(0, 1)
    if (modules.maqueenLineR2.brightness() > 0)
        led.plot(1, 1)
    else
        led.unplot(1, 1)
    if (modules.maqueenLineM.brightness() > 0)
        led.plot(0, 2)
    else
        led.unplot(0, 2)
})

forever(() => {
    const dist = modules.maqueenSonar.distance() * 100
    for(let i = 0; i < 5; ++i)
        led.unplot(4, i)
    if (dist > 1)
        led.plot(4, 0)
    if (dist > 2)
        led.plot(4, 1)
    if (dist > 5)
        led.plot(4, 2)
    if (dist > 15)
        led.plot(4, 3)
    if (dist > 40)
        led.plot(4, 4)
})