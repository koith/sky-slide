# SKY SLIDE — immutable gameplay baseline

## Target
- iPhone Safari, portrait-first, WebGL/Three.js.
- Cloud-hosted; no home PC dependency.
- Reference-first reverse engineering before differentiation.

## Non-negotiable behavior
- Third-person chase camera; rider low in frame with long forward visibility.
- Narrow U-shaped slide; reference-like human/slide ratio (~4.3–5x shoulder width).
- Bands perpendicular to travel direction.
- Long course with sharp corners, steep descents and climbs, extreme altitude/void/cloud depth.
- Rider is prone, never standing.
- LEFT moves visually left; RIGHT visually right.
- Straight + no input: no spontaneous outward force.
- Curves: outward acceleration scales with curvature × speed².
- Cross-section is physical: bottom -> wall climb -> lip -> airborne. Never fail from an arbitrary x-width threshold.
- Grade drives speed: downhill faster, uphill slower.
- Water spray grows with speed/contact.
- Failure UI appears promptly once fall is certain: exactly 실패! / 재도전 할까요? / 재도전. One button only.
- No feature creep until reference feel is matched.

## QA gate before user testing
- App loads without permanent LOADING state.
- WebGL canvas renders.
- Progress increases after start.
- LEFT/RIGHT signs correct.
- Straight/no-input lateral drift test.
- Failure UI has one retry button and retry resumes.
- User is responsible for subjective feel and real-device UX only; obvious functional defects are developer QA failures.
