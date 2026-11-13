import { Blockquote } from '@n3wth/ui/primitives'
import { Beat } from '../kit/Beat'
import { ToggleCompare } from '../kit/ToggleCompare'
import { FlowDiagram } from '../kit/FlowDiagram'
import { MarginNote } from '../kit/MarginNote'
import type { FlowEdge, FlowNode } from '../kit/FlowDiagram'

/* No stage numbers — this is an argument, not a build log, except for the
   one specimen where the content really is a pipeline: a leak sensor
   reporting through a hub to an actuator. That chain is real (my own
   Home Assistant setup, per household/infra-home-assistant), so the
   FlowDiagram is doing honest work, not decoration. The toggle swaps the
   whole chain between "battery healthy" and "battery at 20%, about to go
   dark" — reusing the shared FlowDiagram twice inside ToggleCompare rather
   than building a bespoke SVG, since the node/edge shape is genuinely the
   same structure in both states, just with different activity. */

const HEALTHY_NODES: FlowNode[] = [
  { id: 'sensor', label: 'Leak sensor reports', x: 70, y: 110, active: true },
  { id: 'hub', label: 'Hub evaluates the rule', x: 340, y: 110, active: true },
  { id: 'actuator', label: 'Valve shuts and sends alert', x: 610, y: 110, active: true },
]
const LOW_BATTERY_NODES: FlowNode[] = [
  { id: 'sensor', label: 'Sensor battery at 20%', x: 70, y: 110 },
  { id: 'hub', label: 'Hub receives no report', x: 340, y: 110 },
  { id: 'actuator', label: 'Nothing fires', x: 610, y: 110 },
]
const CHAIN_EDGES: FlowEdge[] = [
  { from: 'sensor', to: 'hub' },
  { from: 'hub', to: 'actuator' },
]

export default function HomeAutomation() {
  return (
    <div>
      <p className="max-w-[62ch] text-base leading-relaxed md:text-lg" style={{ color: 'var(--ink-dim)' }}>
        A house full of automation looks like magic from the doorway. Lights adjust, a valve
        shuts, a notification lands before you've noticed anything wrong. From inside, it's
        arbitration plumbing: sensors that report, a hub that decides, actuators that act — and
        every one of those three roles fails differently.
      </p>

      <Beat
        prose={
          <>
            The chain has three roles and I try to keep them separate in my head, because they
            fail in different places. A sensor's only job is to report a condition — moisture,
            motion, a door left open. A hub's job is to evaluate a rule against that report. An
            actuator's job is to act on the result: a valve, a lock, a light. My leak sensor sits
            under the kitchen sink on Z-Wave. When it detects moisture, the hub checks the rule and
            fires downstream — a notification, sometimes a shutoff. Three roles, three distinct
            ways for the chain to break, and only one of them looks anything like a bug.
          </>
        }
      />

      <Beat
        prose={
          <>
            The actual engineering problem isn't any single sensor or actuator. It's that Z-Wave,
            Zigbee, Hue, and plain Wi-Fi don't talk to each other natively. The hub's real job is
            translation — getting a Zigbee motion sensor and a Z-Wave water sensor and a Wi-Fi plug
            to act on the same rule without knowing the others exist. My hub is a Home Assistant
            Yellow, run local, no cloud dependency, tracking around 1,280 entities across the
            house. It's worth more for what it understands across those protocols than for
            anything it directly controls.
          </>
        }
        margin={
          <MarginNote
            href="/thinking/setting-up-my-smart-home"
            title="Setting Up My Smart Home"
            description="The fuller writeup of the stack this piece is about — Home Assistant as hub, Zigbee and Z-Wave underneath, Hue and Sonos on top."
          />
        }
      />

      <Beat
        prose={
          <>
            The failure I keep coming back to involves that same leak sensor. Diagnostics show its
            battery at 20 percent. It hasn't missed a report yet, which is exactly the problem — a
            dying sensor doesn't announce a threshold crossing. It just goes quiet one day, with no
            error and no flag, and the hub has no way to distinguish "no leak" from "no sensor."
            The reliability of the whole chain is bounded by whichever part is cheapest and least
            watched, not by the hub that cost real money and sits in a closet running fine.
          </>
        }
      >
        <ToggleCompare
          beforeLabel="battery healthy"
          afterLabel="battery at 20%"
          before={
            <div className="h-64 w-full max-w-3xl sm:h-72">
              <FlowDiagram nodes={HEALTHY_NODES} edges={CHAIN_EDGES} width={780} height={220} />
            </div>
          }
          after={
            <div className="h-64 w-full max-w-3xl sm:h-72">
              <FlowDiagram nodes={LOW_BATTERY_NODES} edges={CHAIN_EDGES} width={780} height={220} />
            </div>
          }
          caption="same wiring, same rule — the chain breaks at the first link, silently, with nothing downstream able to tell the difference."
        />
      </Beat>

      <Beat
        prose={
          <>
            That's the part worth sitting with. Every entity in the chain is a potential quiet
            failure, and the expensive, visible parts are almost never the ones that go first. It's
            the cheap sensor under the sink, the one you forget exists until diagnostics happen to
            surface its battery level. Monitoring the hub tells you the hub is fine. It tells you
            nothing about the sensor that stopped whispering.
          </>
        }
      />

      <Beat
        prose={
          <>
            I made a deliberate trade the other direction. I pulled local voice control — speech
            recognition and speech output — off the hub. It was a real convenience and it was also
            a resource drain on the same box running the rule evaluation I actually care about.
            Convenience lost, stability of the core pipeline gained. I'd make that trade again.
          </>
        }
      />

      <Blockquote className="mt-4 max-w-[48ch]">
        The next layer isn't more sensors. It's software that can take a stated intent — going to
        bed — and turn it into the right sequence across actuators that already exist, in the
        right order, checking the right conditions first. The plumbing is mostly built. What's
        missing is the layer that speaks in intent instead of rules.
      </Blockquote>
    </div>
  )
}
