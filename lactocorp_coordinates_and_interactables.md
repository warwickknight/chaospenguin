# LactoCorp Facility: Master World Coordinates & Interactive Elements Directory

> **Coordinate System Overview:**
> * **X-Axis:** East $(+)$ / West $(-)$. Outer facility limits: `[-60, +60]`.
> * **Z-Axis:** South $(+)$ / North $(-)$. Outer facility limits: `[-136, +96]`.
> * **Progression:** Moves from South (`Z: +80`, Zone 1 Receiving) to North (`Z: -125`, Zone 5 Penthouse).

---

## 1. Zone Layouts & Spatial Boundaries

| Zone | ID | Bounds (X) | Bounds (Z) | Floor Material / Theme | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Zone 1** | `zone_1` | `[-60, +60]` | `[+42, +96]` | Sky Blue Pastel (`#7dd3fc`) | Receiving dock, delivery tankers, vats & cheese wheels |
| **Zone 2** | `zone_2` | `[-60, +60]` | `[-16, +42]` | Warm Orange / Peach (`#fdba74`) | Pasteurization steam boiler engine room & pipe network |
| **Zone 3** | `zone_3` | `[-60, 0]` | `[-78, -16]` | Mint Green (`#6ee7b7`) | Fermentation lab, culture vats & centrifuge launcher |
| **Zone 4** | `zone_4` | `[0, +60]` | `[-78, -16]` | Packaging Yellow (`#fde047`) | Conveyor maze, box packing & pneumatic label stamper |
| **Zone 5** | `zone_5` | `[-60, +60]` | `[-136, -78]`| Golden Vault (`#fcd34d`) | Aged cheese racks, vault tumbler & Dairy Baron penthouse |

---

## 2. Escape Gates & Puzzle Chains

### Gate 1: Sub-Zero Blast Door (`gate_1`) & East Service Archway
* **Location:** `(x: 0, y: 0, z: 42)` (Width: 8.0, Height: 4.5).
* **Connects:** Zone 1 $\rightarrow$ Zone 2.
* **Open Bypass Route:** An open East Service Archway connects Zone 1 directly to Zone 2 at `(x: 22 to 30, z: 42)` with industrial steel hazard framing, allowing immediate exploration between Zone 1 and Zone 2 without solving Gate 1 first!
* **Key Entities & Positions:**
  * **Parked Milk Tanker:** Starts at `(x: 0, z: 66)`. Rolls North when released.
  * **Wheel Chocks (2):** Left at `(x: -2.4, z: 66)`, Right at `(x: +2.4, z: 66)`.
* **Mechanic:** Slap both yellow rubber chocks $\rightarrow$ tanker rolls down incline $\rightarrow$ impacts blast door at `Z: 43.5` $\rightarrow$ bursts open with cold mist, unlocks Gate 1, removes the truck collision, and converts corridor `(Z: 38 to 46)` into slick ice.

### Gate 2: Biometric Turnstiles (`gate_2`)
* **Location:** `(x: 0, y: 0, z: -16)` (Width: 9.0, Height: 3.5).
* **Connects:** Zone 2 $\rightarrow$ Zones 3 & 4.
* **Key Entities & Positions:**
  * **Steam Valve 1:** `(x: -14, y: 1.6, z: 24)`.
  * **Steam Valve 2:** `(x: 0, y: 1.6, z: 30)`.
  * **Steam Valve 3:** `(x: +14, y: 1.6, z: 22)`.
  * **High-Voltage Breaker Box:** `(x: -6, y: 3.2, z: -15.5)`.
* **Mechanic:** Slap each red valve 3 times to over-pressurize $(3/3)$ $\rightarrow$ overhead cream pipe bursts onto breaker $\rightarrow$ electrical fire short-circuits magnetic locks $\rightarrow$ turnstiles drop lasers and freewheel.

### Gate 3: Retractable Whey Bridge (`gate_3`)
* **Location:** `(x: 0, y: 0, z: -46)` (Spans Width: 12.0 between `x: -6` and `x: +6`).
* **Connects:** Zone 3 (West) $\longleftrightarrow$ Zone 4 (East).
* **Key Entities & Positions:**
  * **Industrial Centrifuge Pit:** `(x: -32, y: 0.9, z: -48)` (Radius: 3.6).
  * **Emergency Drawbridge Lever:** `(x: -7.5, y: 3.2, z: -45.5)` (Accessible on Zone 3 shoreline).
  * **Boiling Whey Chasm:** Centered at `(x: 0, z: -46)` (Width: 12, Depth: 20).
* **Mechanic:** Walk up to shoreline lever and slap it (or build orbital velocity in centrifuge and launch across) $\rightarrow$ drawbridge lowers down to span the chasm.

### Gate 4: 3-Wheel Pressure Vault (`gate_4`)
* **Location:** `(x: 0, y: 0, z: -78)` (Width: 10.0, Height: 5.0).
* **Connects:** Zones 3/4 $\rightarrow$ Zone 5 (The Vault & Penthouse).
* **Key Entities & Positions (Located in the shared Vault Antechamber south of Gate 4):**
  * **Rolling Cheese Wheel 1:** `(x: -12, z: -66)`.
  * **Rolling Cheese Wheel 2:** `(x: +4, z: -63)`.
  * **Rolling Cheese Wheel 3:** `(x: +14, z: -66)`.
  * **Recessed Floor Pads (3):** Pad Left `(x: -6, z: -73.5)`, Pad Center `(x: 0, z: -73.5)`, Pad Right `(x: +6, z: -73.5)`.
* **Mechanic:** Slap heavy cheese wheels to roll them across the butter oil floor into all 3 floor pads $\rightarrow$ vault lock disengages $\rightarrow$ bank-style circular gold door with spoked wheel handle rolls open.

---

## 3. Kinetic Conveyor Belt System

| Conveyor Line | Location $(X, Z)$ | Dimensions | Direction | Belts & Contents |
| :--- | :--- | :--- | :--- | :--- |
| **Zone 1 Lower Line** | `(-7.5, 87.0)` | Length: 12, Width: 2.4 | Forward ($+1$) | Gable-top blue/white milk cartons framing splash zone |
| **Zone 1 Upper Line** | `(+7.5, 69.0)` | Length: 11, Width: 2.4 | Reverse ($-1$) | Glass bottles & cartons heading to staging docks |
| **Zone 4 Track A (West)** | `(+20.0, -35.0)` | Length: 24, Width: 2.4 | Forward ($+1$) | Sorting lane with slap-able overdrive speed switch |
| **Zone 4 Track B (Center)** | `(+32.0, -45.0)` | Length: 24, Width: 2.4 | Reverse ($-1$) | Sorting lane with slap-able overdrive speed switch |
| **Zone 4 Track C (East)** | `(+44.0, -35.0)` | Length: 24, Width: 2.4 | Forward ($+1$) | Sorting lane with slap-able overdrive speed switch |

* **Overdrive Lever:** Slapping the red switch at each belt flips speed from $4.0\text{ m/s} \rightarrow 16.0\text{ m/s}$ (launches cartons airborne).

---

## 4. Slapstick Mischief Challenges

| Mischief Name | Key | Coordinates $(X, Y, Z)$ | Trigger / Interactive Action | Reward |
| :--- | :--- | :--- | :--- | :--- |
| **10-Tier Crate Tower** | `crateTower` | `(x: -5.5, z: 56)` | Belly-slide or slap bottom crates $\rightarrow$ topples pyramid | $+300$ Chaos, bowls over forklifts |
| **Forklift Bowling** | — | Loops in Z1 `(18-28, 54-75)` & Z4 `(10-52, -20 to -64)` | Slap driver or chassis $\rightarrow$ 3.5s spinout | $+120$ Chaos |
| **Pressure Milk Cannon**| `milkCannon` | `(x: -14, z: 80)` | Slap CO2 pressure valve $\rightarrow$ 1s violent wobble $\rightarrow$ explosion + organic milk lake | $+350$ Chaos, knocks down nearby staff |
| **Rocket Extinguisher** | `rocketExtinguisher` | Trolleys at `(14, 88)`, `(-16, 38)`, `(22, 20)` | Slap valve $\rightarrow$ 4.5s wild rocket flight with foam jet & wall rebounds | $+150$ Chaos, bowls over guards |
| **Clipboard Flutter** | `clipboard` | Supervisors in Z2 `(-6, 25)` & `(10, 15)` | Slap 3 supervisor clipboards in under 30s | $+250$ Chaos |
| **Disguised Courier** | `disguisedBox` | Cardboard boxes at `(14, -30)` & `(38, -44)` | Slap box to climb inside; travel 50m unseen | $+300$ Chaos, guards ignore box |
| **Certified Dairy** | `certifiedDairy` | Label Stamper Gantry at `(32, 0, -22)` | Belly-slide through open gantry tunnel when head stamps down | $+250$ Chaos, Golden Chest Badge |
| **Factory Broadcast** | `broadcastSquawk`| Penthouse Desk Mic at `(0, 1.4, -124.5)` | Slap intercom microphone $\rightarrow$ factory-wide squawk | $+350$ Chaos, stuns all staff for 6s |
| **Hot Wax Armor** | — | Dip Tank at `(-14, 0, -118)` | Belly-slide through red molten wax | 12s invulnerability against guards |

---

## 5. Liquid & Friction Surface Patches

| Surface Type | Center $(X, Z)$ | Dimensions $(W \times D)$ | Friction $(\mu)$ | Handling Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **Comic Milk Splat (Spawn)** | `(0, 78)` | $11 \times 13$ | $\mu = 0.20$ | Organic multi-lobed puddle with satellite droplets; high drift |
| **Secondary Milk Spill** | `(7, 58)` | $12 \times 10$ | $\mu = 0.20$ | High drift near parked milk tanker |
| **Sub-Zero Ice Slabs** | `(-24, 70)` | $16 \times 22$ | $\mu = 0.05$ | Near-zero friction; preserves slide momentum |
| **Heavy Cream Leak** | `(0, 10)` | $16 \times 14$ | $\mu = 0.08$ | Ultra slick; $80\%$ angular velocity bounce off walls |
| **Culture / Yogurt Sludge**| `(-32, -48)` | $16 \times 16$ | $\mu = 1.20$ | Mud-like sludge; immediately brakes sliding to a crawl |
| **Vault Butter Floor** | `(0, -105)` | $22 \times 22$ | $\mu = 0.08$ | Slick polished butter oil for cheese wheel puzzle |

---

## 6. NPC Spawn Locations

* **Player Spawn:** `(x: 0, y: 0, z: 80)` (Facing North in Zone 1).
* **Security Guards:**
  * Guard 1 (Zone 1 Receiving): `(x: 14, z: 65)`
  * Guard 2 (Zone 2 Boilers): `(x: -12, z: 10)`
  * Guard 3 (Zone 4 Packaging): `(x: 35, z: -55)`
* **Factory Workers / Supervisors:**
  * Worker 1 (Zone 1 Staging): `(x: -8, z: 65)`
  * Supervisor 1 (Zone 2 Clipboard): `(x: -6, z: 25)`
  * Supervisor 2 (Zone 2 Clipboard): `(x: 10, z: 15)`
  * Worker 2 (Zone 3 Bio-dairy): `(x: -36, z: -38)`
  * Worker 3 (Zone 4 Conveyors): `(x: 28, z: -38)`
  * Penthouse Manager (Zone 5 Executive Suite): `(x: 0, z: -118)`

---

## 7. Major Scenic Props & Landmarks

* **Zone 1 Silo Vats (3):** Upper-left wall at `(-10.5, 73)`, `(-10.5, 65)`, and `(-10.5, 57)` with connecting manifold pipe at `Y: 5.2`.
* **Zone 1 Swiss Cheese Wheels (3):** Bottom-right foreground at `(13.0, 88.0)`, `(17.5, 83.0)`, and `(16.5, 93.0)`.
* **Zone 2 Pasteurization Boilers (2):** Massive cylindrical boilers with tripod legs at `(-18, 12)` and `(+18, 12)`.
* **Zone 4 Packaging Frames:** Structural conveyor frames at `x: 16, 26, 36, 46` along `z: -48`.
* **Zone 5 Giant Cheese Shelves:** 4-tier cedar racks at `(-22, -100)` and `(+22, -100)`.
* **Dairy Baron Executive Desk:** Polished mahogany desk at `(0, 0.7, -125)`.

