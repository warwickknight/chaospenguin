# LactoCorp Dairy Facility: Map Architecture & Interaction Design

## 1. Game Overview & Core Experience
* **Platform:** Mobile (Native Portrait Orientation).
* **View:** Top-Down 3D / Isometric (Slight tilt for depth, camera tracks player smoothly).
* **Controls:** 
  * Single Dynamic Virtual Joystick (Left thumb / screen drag) for directional waddling and slide steering.
  * **Button A:** Slap (Quick flipper swipe; interacts with switches, knocks over items, stuns NPCs).
  * **Button B:** Belly Slide (Toggles slide mode; converts momentum into sliding friction physics).

---

## 2. Macro Map Architecture & Zone Graph

The facility operates as an interconnected sandbox structured around **progressive escape-room gates**. Players begin at the lower delivery bays and unlock permanent shortcuts and paths spiraling upward toward the executive vault.

```
                  ┌───────────────────────────────┐
                  │      ZONE 5: THE VAULT        │
                  │   (Aged Cheeses & Penthouse)  │
                  └──────────────┬────────────────┘
                                 ▲
                     [Gate 4: 3-Wheel Pressure Lock]
                                 │
     ┌───────────────────────────┴───────────────────────────┐
     │                                                       │
┌────┴──────────────────────────┐         ┌──────────────────┴────────────┐
│      ZONE 3: FERMENTATION     │         │       ZONE 4: PACKAGING       │
│     & CULTURE LAB (VATS)      │◄───────►│      & SORTING CONVEYORS      │
└────┬──────────────────────────┘         └──────────────────┬────────────┘
     ▲                                                       ▲
     │              [Gate 3: Retractable Bridge]             │
     └───────────────────────────┬───────────────────────────┘
                                 │
                     [Gate 2: Turnstile Breaker]
                                 │
                  ┌──────────────┴────────────────┐
                  │      ZONE 2: THE MAIN FLOOR   │
                  │       (Pasteurization Hub)    │
                  └──────────────┬────────────────┘
                                 ▲
                     [Gate 1: Rammed Blast Door]
                                 │
                  ┌──────────────┴────────────────┐
                  │      ZONE 1: RECEIVING DOCK   │
                  │      (Cold Storage & Trucks)  │
                  └───────────────────────────────┘
                                 │
             [Underground Drainage Bypass (Secret Loop)]
```

---

## 3. Surface Physics & Liquid Friction System

Liquid dynamics alter the penguin's handling model dynamically:

| Surface Type | Friction Value ($\mu$) | Top Slide Speed | Handling Characteristics |
| :--- | :--- | :--- | :--- |
| **Standard Tile / Concrete** | $0.60$ | Baseline ($1.0\times$) | Standard waddle traction; slide decays rapidly within 2.5 seconds. |
| **Ice Patch / Cold Runoff** | $0.05$ | $2.2\times$ | Near-zero friction; slide retains momentum until hitting obstacles. |
| **Skim Milk Spill** | $0.20$ | $1.5\times$ | High drift; sharp turns result in wide skids. |
| **Heavy Cream / Butter Oil** | $0.08$ | $2.5\times$ | Ultra slick; bouncing off walls preserves $80\%$ angular velocity. |
| **Yogurt / Curds** | $1.20$ | $0.4\times$ | Mud-like sludge; slows sliding to an immediate halt; footsteps leave sticky residue. |

---

## 4. Detailed Zone Layouts & Escape Gates

### Zone 1: Receiving Bay & Cold Storage
*The industrial entry depot loaded with delivery tankers, frozen staging areas, and forklift traffic.*

* **Layout:**
  * **South:** Truck loading bays with gentle metal ramps.
  * **Center:** Open pallet storage holding stacked crate towers.
  * **North:** The primary exit blocked by the Sub-Zero Blast Door.
  * **West Alcove:** Cold Storage Locker with icy floor slabs and hanging meat hooks.
* **Key Interactive Entities:**
  * **Milk Crate Pyramids:** 10-crate high stacks. Belly-sliding into the base dislodges the structure, sending plastic crates flying into workers.
  * **Parked Tanker Truck:** Parked on a $5^\circ$ concrete incline, held in place by two yellow rubber wheel chocks.
  * **Plastic Flap Curtains:** Parting curtains that flap violently and snap workers in the face when passed through at high speed.
  * **Drain Grate (Secret Bypass):** Slap loose the bolt to open a slide chute leading to the underground pipe crawl space (bypasses Zone 2 to Zone 4).
* **Escape Gate 1: Sub-Zero Blast Door**
  * *Obstacle:* Locked steel door with an unreachable overhead keypad.
  * *Puzzle Chain:* Slap both wheel chocks off the parked milk tanker $\rightarrow$ Tanker rolls backwards down the slope $\rightarrow$ Rear bumper crushes the door release lever and buckles the door open.
  * *Reward:* Cold mist floods outward, turning the access corridor into an ice speedway leading straight into Zone 2.

---

### Zone 2: Pasteurization Hub & Utility Catwalks
*A multi-tiered industrial engine room with massive steam boilers, pressurized brass pipes, and elevated walkways.*

* **Layout:**
  * **Ground Level:** Hot-pipe grid with roaming floor supervisors holding clipboards.
  * **Upper Catwalks:** Narrow mesh pathways accessed via climbable wall ladders or ramp slides.
  * **North Perimeter:** Biometric employee turnstiles blocking access to the sorting halls.
* **Key Interactive Entities:**
  * **High-Pressure Steam Wheels:** Slap to turn clockwise. At 3 turns, the needle enters the red danger zone.
  * **Overhead Cream Pipeline:** Runs directly above the wall-mounted high-voltage circuit breaker box.
  * **Floor Inspector AI:** Wandering NPCs. Slapping them scatters clipboard papers; inspectors drop to their knees to retrieve them, creating temporary stepping stones or slide ramps.
* **Escape Gate 2: Biometric Turnstiles**
  * *Obstacle:* Turnstiles locked electronically; badge reader out of reach.
  * *Puzzle Chain:* Over-pressurize 3 separate steam valves along the pipeline $\rightarrow$ Pressure gauge spikes $\rightarrow$ The cream pipe bursts directly overhead $\rightarrow$ Liquid cream enters the breaker box, triggering a high-voltage short circuit $\rightarrow$ Factory fail-safe protocol disengages the magnetic locks, setting turnstiles to freewheel.

---

### Zone 3: Fermentation & Culture Lab
*A high-tech bio-dairy chamber with open vats of bubbling curd, yeast incubation tanks, and high-speed centrifuges.*

* **Layout:**
  * **Perimeter:** Racks of glass petri dishes and bacterial cultures.
  * **Center:** Giant open industrial centrifuges spinning continuously.
  * **East Boundary:** A wide vat of boiling whey separating Zone 3 from Zone 4, with a retracted steel drawbridge.
* **Key Interactive Entities:**
  * **Industrial Centrifuges:** Open-topped spinning tubs. Belly-sliding inside pulls the penguin into circular orbit physics, rapidly building radial acceleration.
  * **Glowing Culture Jars:** Slapping knocks them from shelves, covering the floor in fluorescent green and purple goo that tracks glowing footprints.
  * **Emergency Eyewash Pedals:** Slapping releases continuous pressurized water jets that launch the penguin across slick tiles.
* **Escape Gate 3: Retractable Whey Bridge**
  * *Obstacle:* Drawbridge is raised; manual winch is on the far wall across the boiling vat.
  * *Puzzle Chain:* Enter the high-speed centrifuge $\rightarrow$ Build max orbital velocity $\rightarrow$ Time the slide exit along the launch ramp $\rightarrow$ Air-launch across the whey chasm $\rightarrow$ Mid-air slap the oversized yellow emergency lever on the opposite pillar $\rightarrow$ Drawbridge drops down, permanently bridging Zones 3 and 4.

---

### Zone 4: Packaging & Sorting Conveyor Maze
*A noisy, kinetic labyrinth of fast-moving belts, mechanical sorting arms, and cardboard flat-pack stations.*

* **Layout:**
  * **Conveyor Grid:** 4 parallel conveyor belts moving at alternating directions and velocities.
  * **Packaging Nodes:** Automated robotic arms and label-stamping pistons.
* **Key Interactive Entities:**
  * **Cardboard Packing Boxes:** Open boxes resting on belts. Sliding into one places the penguin inside the box; workers ignore the disguised box until it bursts open.
  * **Label Stamper Pistons:** Timed pneumatic presses. Sliding under while active stamps the penguin with a collectible badge (*"Grade A Dairy"*).
  * **Belt Diverter Levers:** Slap levers to redirect conveyor tracks, steering pallets and workers into automated boxing chutes.

---

### Zone 5: The Cheese Vault & Executive Suite
*A climate-controlled cathedral of towering cedar racks holding massive wheels of aged cheese, culminating in the penthouse office of the Dairy Baron.*

* **Layout:**
  * **Vault Chamber:** 4-story high shelving holding hundreds of 80 lb cheese wheels.
  * **The Vault Gate:** A circular bank-grade vault with 3 depressed pressure pads on the floor.
  * **Penthouse Office:** Expansive polished mahogany room overlooking the entire factory floor.
* **Key Interactive Entities:**
  * **Aged Cheese Wheels:** Knockable rolling physics objects. Once pushed off shelves, they roll continuously down ramps like bowling balls.
  * **Executive Intercom Console:** Slap the desk microphone to broadcast a massive penguin squawk over the entire factory PA system, causing all NPCs across all zones to freeze in panic.
  * **Hot Wax Dip Tanks:** Sliding through coats the penguin in bright red protective wax, granting temporary invulnerability against being picked up or chased by security.
* **Escape Gate 4: The Triple-Wheel Tumbler**
  * *Obstacle:* Bank vault door locked with three massive recessed floor plates.
  * *Puzzle Chain:* Climb catwalk ladders to the upper cheese racks $\rightarrow$ Slap 3 distinct heavy cheese wheels off their supports $\rightarrow$ Guide/belly-bump the rolling wheels into the three recessed floor pads $\rightarrow$ Internal counterweights shift $\rightarrow$ Vault door rolls open, giving access to the Executive Suite.

---

## 5. Master Objective & Secret Mischief Tracker

### Zone Progression (Escape Gates)
- [ ] **Ram the Sub-Zero Blast Door** (Dislodge tanker chocks in Zone 1)
- [ ] **Short-Circuit the Security Turnstiles** (Overpressure pipe onto breaker in Zone 2)
- [ ] **Centrifuge Cannonball** (Launch across whey chasm to drop the bridge in Zone 3)
- [ ] **Crack the Vault Combination** (Seat 3 cheese wheels onto floor plates in Zone 5)

### Slapstick Mischief (Sandbox Discovery)
- [ ] **Topple the 10-Tier Crate Tower** (Bowl over at least 1 forklift driver)
- [ ] **Clipboard Flutter** (Slap 3 supervisors' clipboards in under 30 seconds)
- [ ] **Disguised Courier** (Travel 50 meters inside a cardboard box without being spotted)
- [ ] **Certified Dairy** (Slide under the automatic label stamper)
- [ ] **Factory Broadcast** (Squawk into the Executive Intercom to stun all staff)
- [ ] **Drain Diver** (Discover the secret underground maintenance pipe shortcut)