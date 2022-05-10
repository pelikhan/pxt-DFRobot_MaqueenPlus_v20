//% deprecated
namespace DFRobotMaqueenPlusV2 { }

// disable Jacdac single wire serial on pin 12
// as neopixel are already mounted on this pin
namespace userconfig { export const PIN_JACK_TX = 0xdead }

namespace modules {
    /**
     * maqueen motors
     */
    //% fixedInstance whenUsed block="maqueen motors"
    export const maqueenMotors = new DualMotorsClient("maqueen motors?dev=self")

    /**
     * maqueen back LEDs
     */
    //% fixedInstance whenUsed block="maqueen back leds"
    export const maqueenBackLeds = new LedClient("maqueen back LEDs?dev=self&num_pixels=4&variant=Stick&srvo=0")

    /**
     * maqueen front LEDs
     */
    //% fixedInstance whenUsed block="maqueen front leds"
    export const maqueenFrontLeds = new LedClient("maqueen front LEDs?dev=self&num_pixels=2&variant=Stick&srvo=1")

    /**
     * L1 line detector
     */
    //% fixedInstance whenUsed block="maqueen line L1"
    export const maqueenLineL1 = new ReflectedLightClient("maqueen line L1?dev=self&variant=InfraredDigital&svro=0&name=L1")

    /**
     * L2 line detector
     */
    //% fixedInstance whenUsed block="maqueen line L2"
    export const maqueenLineL2 = new ReflectedLightClient("maqueen line L2?dev=self&variant=InfraredDigital&svro=1&name=L2")

    /**
     * R1 line detector
     */
    //% fixedInstance whenUsed block="maqueen line R1"
    export const maqueenLineR1 = new ReflectedLightClient("maqueen line R1?dev=self&variant=InfraredDigital&svro=2&name=L3")

    /**
     * R2 line detector
     */
    //% fixedInstance whenUsed block="maqueen line R2"
    export const maqueenLineR2 = new ReflectedLightClient("maqueen line R2?dev=self&variant=InfraredDigital&svro=3&name=L4")

    /**
     * M line detector
     */
    //% fixedInstance whenUsed block="maqueen line M"
    export const maqueenLineM = new ReflectedLightClient("maqueen line M?dev=self&variant=InfraredDigital&svro=4&name=M")

    /**
     * Sonar sensor
     */
    //% fixedInstance whenUsed block="maqueen sonar"
    export const maqueenSonar = new DistanceClient("maqueen sonar?dev=self&variant=sonar")
}

namespace servers {
    class DualMotorsServer extends jacdac.Server {
        speed: number[]
        enabled: boolean

        constructor() {
            super(jacdac.SRV_DUAL_MOTORS, {
                intensityPackFormat: jacdac.DualMotorsRegPack.Enabled,
                statusCode: jacdac.SystemStatusCodes.Initializing
            })
            this.on(jacdac.CHANGE, () => this.sync())
        }

        handlePacket(pkt: jacdac.JDPacket) {
            this.handleRegValue(pkt, jacdac.DualMotorsReg.Reversible, jacdac.DualMotorsRegPack.Reversible, true)

            this.enabled = this.handleRegValue(pkt, jacdac.DualMotorsReg.Enabled, jacdac.DualMotorsRegPack.Enabled, this.enabled)
            this.speed = this.handleRegFormat(pkt, jacdac.DualMotorsReg.Speed, jacdac.DualMotorsRegPack.Speed, this.speed)
        }

        sync() {
            if (!this.enabled) {
                DFRobotMaqueenPlusV2.controlMotorStop(MyEnumMotor.eAllMotor)
                return
            }

            const speed1 = Math.round((this.speed[0] || 0) * 0xff)
            const speed2 = Math.round((this.speed[1] || 0) * 0xff)

            DFRobotMaqueenPlusV2.controlMotor(MyEnumMotor.eLeftMotor, speed1 < 0 ? MyEnumDir.eBackward : MyEnumDir.eForward, Math.abs(speed1))
            DFRobotMaqueenPlusV2.controlMotor(MyEnumMotor.eRightMotor, speed2 < 0 ? MyEnumDir.eBackward : MyEnumDir.eForward, Math.abs(speed2))
        }
    }

    function start() {
        jacdac.productIdentifier = 0x3e7671fa
        jacdac.deviceDescription = "DFRobot Maqueen"
        jacdac.startSelfServers(() => {
            const servers: jacdac.Server[] = [
                new DualMotorsServer(),
                new jacdac.LedServer(2, jacdac.LedPixelLayout.RgbRgb,
                    (pixels, brightness) => {
                        DFRobotMaqueenPlusV2.controlLED(MyEnumLed.eLeftLed, pixels[0] * brightness > 0 ? MyEnumSwitch.eOpen : MyEnumSwitch.eClose)
                        DFRobotMaqueenPlusV2.controlLED(MyEnumLed.eRightLed, pixels[1] * brightness > 0 ? MyEnumSwitch.eOpen : MyEnumSwitch.eClose)
                    },
                    {
                        variant: jacdac.LedVariant.Stick,
                        statusCode: jacdac.SystemStatusCodes.Initializing
                    }
                ),
                new jacdac.LedServer(4, jacdac.LedPixelLayout.RgbGrb,
                    (pixels, brightness) =>
                        light.sendWS2812BufferWithBrightness(pixels, DigitalPin.P15, brightness)
                    ,
                    {
                        variant: jacdac.LedVariant.Stick,
                        statusCode: jacdac.SystemStatusCodes.Initializing
                    }
                )
            ]
            const lineSensors: jacdac.Server[] = [
                { sensor: MyEnumLineSensor.eL1, name: "L1" },
                { sensor: MyEnumLineSensor.eL2, name: "L2" },
                { sensor: MyEnumLineSensor.eM, name: "M" },
                { sensor: MyEnumLineSensor.eR1, name: "R1" },
                { sensor: MyEnumLineSensor.eR2, name: "R1" },
            ]
                .map(r => jacdac.createSimpleSensorServer(jacdac.SRV_REFLECTED_LIGHT,
                    jacdac.ReflectedLightRegPack.Brightness,
                    () => DFRobotMaqueenPlusV2.readLineSensorState(r.sensor) ? 1 : 0,
                    {
                        variant: jacdac.ReflectedLightVariant.InfraredDigital,
                        streamingInterval: 100,
                        instanceName: r.name
                    }))
            servers.concat(lineSensors)
            servers.push(jacdac.createSimpleSensorServer(jacdac.SRV_DISTANCE,
                jacdac.DistanceRegPack.Distance,
                () => DFRobotMaqueenPlusV2.readUltrasonic(DigitalPin.P13, DigitalPin.P14), {
                variant: jacdac.DistanceVariant.Ultrasonic,
                streamingInterval: 100
            }
            ))

            control.runInBackground(() => {
                DFRobotMaqueenPlusV2.I2CInit()
                for (const server of servers)
                    server.setStatusCode(jacdac.SystemStatusCodes.Ready)
            })

            return servers
        })
    }
    start()
}