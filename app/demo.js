// Fictional, offline resources. These records never enter the library IPC.
(function () {
 const creators = [
  'Orrava Works', 'Mivren Studio', 'Velune Type', 'Tessune Objects',
  'Brindlefern Press', 'Nuvori Atelier', 'Serevo Sound', 'Pellora Systems',
  'Dovren Motion', 'Kelmora Foundry', 'Ivrune Editions', 'Hushvale Lab',
  'Tavren Tools', 'Wovelle Paper'
 ];
 const products = [
  {
   id: 'demo-01', name: 'Morroway UI Kit', creator: creators[0], category: 'UI & web design', format: 'Figma',
   art: 'interface', mark: 'Morroway', subtitle: 'A calmer workspace', palette: 0, saved: true,
   description: 'A workspace interface with 84 screens for projects, messages, and team planning. Components include compact navigation, accessible forms, and flexible reporting layouts. Light and dark variants share the same spacing system.',
   summary: 'A cohesive starting point for a project-management interface. Paired themes and reusable dashboard sections help explore several product directions.',
   uses: ['Sketch a client portal', 'Build a dashboard prototype', 'Compare light and dark screens'],
   suggestedUse: 'Use the overview screen to pitch a quieter client workspace.',
   notes: 'Try the compact navigation for the client portal. Keep the activity feed on the right.'
  },
  {
   id: 'demo-02', name: 'Pellune Packaging Mockups', creator: creators[1], category: 'Mockups', format: 'Photoshop',
   art: 'packaging', mark: 'pellune', subtitle: 'Paper goods, considered', palette: 1, saved: true,
   description: 'Twelve studio compositions feature folding cartons, paper sleeves, and small cylindrical containers. Editable artwork areas and separate shadows make it easy to test a packaging family. Neutral backgrounds leave room for presentation copy.',
   summary: 'A coordinated packaging set for small retail identities. Separate surface and shadow layers support quick color studies across consistent compositions.',
   uses: ['Present a packaging identity', 'Compare label colorways', 'Create a retail launch board'],
   suggestedUse: 'Place the same identity on the carton and cylinder to show a cohesive family.',
   notes: 'The tall carton would work well on the opening pitch slide.'
  },
  {
   id: 'demo-03', name: 'Vellune Serif Font Family', creator: creators[2], category: 'Typography & fonts', format: 'OTF / WOFF2',
   art: 'type', mark: 'Vellune', subtitle: 'Soft edges. Clear voice.', palette: 2, saved: true,
   description: 'An editorial serif family with six weights, matching italics, and expressive display capitals. Small-size cuts keep long passages comfortable to read. Specimen pages explore magazine spreads, labels, and cultural programs.',
   summary: 'An expressive serif with range for titles and body copy. The specimens help compare quiet text styles with sculptural display weights.',
   uses: ['Set an editorial headline', 'Explore a wordmark', 'Pair display and reading text'],
   suggestedUse: 'Try the medium italic for an opening statement in a brand presentation.',
   notes: 'Pair the regular cut with generous leading. Save the italic for pull quotes.'
  },
  {
   id: 'demo-04', name: 'Stillroom Conservatory Scene', creator: creators[3], category: 'Blender scenes & projects', format: 'Blender',
   art: 'scene', mark: 'Stillroom', subtitle: 'An afternoon under glass', palette: 3, saved: true,
   description: 'A sunlit conservatory scene with curved windows, broad-leaf plants, and a low display plinth. The project includes three camera positions and two lighting setups. Objects are grouped by room element for easy rearrangement.',
   summary: 'A small interior for practicing daylight and composition. The open plinth also offers a natural place for a product render.',
   uses: ['Practice interior lighting', 'Stage a product render', 'Study warm daylight shadows'],
   suggestedUse: 'Start with the side camera and move the plinth closer to the window.',
   notes: 'Weekend study. Compare the morning and late-afternoon light rigs.'
  },
  {
   id: 'demo-05', name: 'Avenfold Brand Identity Kit', creator: creators[0], category: 'Branding kits', format: 'Figma / PDF',
   art: 'identity', mark: 'avenfold', subtitle: 'Identity in full bloom', palette: 4, saved: true,
   description: 'A flexible identity kit built around a fictional flower shop. It includes wordmark layouts, a color system, stationery, and a concise guideline document. Applications use editable type and simple geometric artwork.',
   summary: 'A complete identity example that connects strategy with everyday applications. It shows how a small palette and repeatable motif can hold a brand together.',
   uses: ['Structure a brand presentation', 'Explore a color system', 'Plan consistent stationery'],
   suggestedUse: 'Use the guideline sequence as a reference for presenting a visual identity.',
   notes: 'Keep the palette page close to the stationery examples in the pitch.'
  },
  {
   id: 'demo-06', name: 'Bramblewax Brush Set', creator: creators[5], category: 'Brushes', format: 'Procreate',
   art: 'brush', mark: 'Bramblewax', subtitle: 'Dry pigment, lively marks', palette: 5,
   description: 'Thirty-two drawing brushes explore wax rubbings, dry pigment, and broken ink. The set includes broad fillers, scratchy pencils, and soft edge blenders. A swatch sheet shows each pressure range.',
   summary: 'A tactile drawing set for illustrations with visible handwork. Broad and narrow marks support loose color blocking and expressive details.',
   uses: ['Draw a textured illustration', 'Add rough lettering accents', 'Build layered color studies'],
   suggestedUse: 'Block in a still life with the broad wax brush, then add pencil detail.'
  },
  {
   id: 'demo-07', name: 'Rainhollow Foley Sound Pack', creator: creators[6], category: 'Audio & sound effects', format: 'WAV / 24-bit',
   art: 'wave', mark: 'Rainhollow', subtitle: 'Small sounds, close up', palette: 6,
   description: 'A collection of 146 close-recorded paper movements, ceramic taps, fabric shifts, and room tones. Each sound includes a dry version with labeled variations. Short tails make the recordings easy to place under quick edits.',
   summary: 'Detailed everyday sounds for quiet scenes. The dry recordings suit intimate product films and subtle interface-motion studies.',
   uses: ['Layer tactile product sounds', 'Add detail to a short film', 'Build a quiet ambient bed'],
   suggestedUse: 'Layer a paper movement beneath a packaging reveal and keep the room tone low.'
  },
  {
   id: 'demo-08', name: 'Dayweft Project Planner', creator: creators[7], category: 'Templates & planners', format: 'Notion',
   art: 'planner', mark: 'Dayweft', subtitle: 'Room for the work ahead', palette: 7, saved: true,
   description: 'A project workspace with weekly planning, a resource shelf, and a decision log. Linked views connect briefs, milestones, and meeting notes. Example entries take a small creative project from idea to handoff.',
   summary: 'A lightweight structure for project decisions and next steps. The resource shelf helps plan work around an existing asset library.',
   uses: ['Plan a client project', 'Keep a weekly creative routine', 'Track decisions and feedback'],
   suggestedUse: 'Create a weekend study project and attach the resources you want to explore.',
   notes: 'Use one weekly view for client work and a second for personal studies.'
  },
  {
   id: 'demo-09', name: 'Liltglass Device Mockups', creator: creators[1], category: 'Mockups', format: 'Photoshop',
   art: 'device', mark: 'Liltglass', subtitle: 'Screens with breathing room', palette: 8, saved: true,
   description: 'Nine unbranded phone and tablet compositions have softly reflective surfaces. Screen layers stay separate from frame highlights and background shadows. Portrait and landscape scenes offer space for a headline beside the device.',
   summary: 'A restrained screen-presentation set with flexible framing. Generous negative space supports case-study covers and app feature slides.',
   uses: ['Present a mobile interface', 'Build a case-study cover', 'Compose a feature announcement'],
   suggestedUse: 'Place one key screen in the upright phone composition for a clear pitch opener.'
  },
  {
   id: 'demo-10', name: 'Softkiln Material Library', creator: creators[3], category: 'Materials & shaders', format: 'Blender',
   art: 'spheres', mark: 'Softkiln', subtitle: 'Glaze, clay, and soft stone', palette: 9, saved: true,
   description: 'Twenty-four procedural surfaces explore glazed ceramics, chalky stone, and fine sand. Each material exposes scale, roughness, and color controls. A lighting stage compares finishes on the same object.',
   summary: 'A material study library focused on subtle surface variation. A consistent stage helps evaluate roughness and color before shading a larger scene.',
   uses: ['Shade a ceramic object', 'Compare tactile finishes', 'Explore soft studio lighting'],
   suggestedUse: 'Apply the satin glaze to a vessel and test it under a large area light.'
  },
  {
   id: 'demo-11', name: 'Ravelight Title Projects', creator: creators[8], category: 'After Effects projects', format: 'After Effects',
   art: 'motion', mark: 'Ravelight', subtitle: 'Titles with a gentle rhythm', palette: 10,
   description: 'Eighteen editable title compositions offer measured wipes, shifting letter spacing, and soft line reveals. Timing controls make entrances and exits easy to adjust. Each layout includes wide, square, and vertical compositions.',
   summary: 'A title set for short editorial films. Measured pacing and multiple aspect ratios help carry one visual language across delivery sizes.',
   uses: ['Open a short film', 'Introduce a speaker', 'Build a vertical title sequence'],
   suggestedUse: 'Use the line reveal to introduce the first chapter of a launch film.',
   notes: 'Try the slower entrance for the launch opening. Leave a full beat before the next cut.'
  },
  {
   id: 'demo-12', name: 'Pebblemint Outline Icons', creator: creators[9], category: 'Graphics & icons', format: 'SVG / Figma',
   art: 'icons', mark: 'Pebblemint', subtitle: '240 everyday symbols', palette: 11,
   description: 'A set of 240 outline symbols covers navigation, files, communication, and creative tools. Rounded joins and optical spacing keep small symbols readable. Editable strokes support compact and spacious interfaces.',
   summary: 'A practical symbol set with a consistent drawing language. Coverage of everyday actions supports wireframes and small utility interfaces.',
   uses: ['Label navigation actions', 'Build a settings screen', 'Create a feature list'],
   suggestedUse: 'Choose one stroke weight and use the same symbol size throughout a prototype.'
  },
  {
   id: 'demo-13', name: 'The Quiet Layout Handbook', creator: creators[10], category: 'Books & references', format: 'PDF / EPUB',
   art: 'book', mark: 'The Quiet Layout', subtitle: 'A handbook for visual rhythm', palette: 12, saved: true,
   description: 'A 96-page handbook about spacing, grouping, and visual rhythm in editorial projects. Annotated spreads compare approaches to the same content. Short exercises use the reader’s own text and images.',
   summary: 'A concise reference for deliberate layout decisions. Annotated comparisons help review hierarchy and spacing in a presentation or publication.',
   uses: ['Study editorial hierarchy', 'Review a presentation layout', 'Practice spacing exercises'],
   suggestedUse: 'Work through the grouping exercise before refining a client proposal.',
   notes: 'Return to the spacing chapter before the next case-study layout.'
  },
  {
   id: 'demo-14', name: 'Ambermere Film LUTs', creator: creators[11], category: 'Effects & presets', format: 'DaVinci Resolve / CUBE',
   art: 'landscape', mark: 'Ambermere', subtitle: 'Warm light, open shadows', palette: 13, saved: true,
   description: 'Twelve color looks combine warm highlights, soft greens, and gentle contrast. Each includes a neutral-strength version for careful adjustment. Comparison stills show interiors, landscapes, and product footage.',
   summary: 'A warm grading collection for cohesive short edits. Lower-strength variants offer a subtle starting point for a shared mood.',
   uses: ['Unify a product film', 'Explore a warm landscape grade', 'Compare highlight treatments'],
   suggestedUse: 'Start with a neutral balance, then lower the look strength to suit the footage.'
  },
  {
   id: 'demo-15', name: 'Tessara Tableware 3D Models', creator: creators[3], category: '3D models & assets', format: 'Blender / OBJ',
   art: 'vessels', mark: 'Tessara', subtitle: 'Objects for the everyday table', palette: 14, saved: true,
   description: 'A family of bowls, tumblers, plates, and serving vessels has gently irregular profiles. The 28 objects share a coherent scale. Separate surface assignments make ceramic and glass finishes easy to explore.',
   summary: 'A coordinated object family for tabletop compositions. Varied heights and simple forms support balanced still-life scenes and material experiments.',
   uses: ['Compose a tabletop still life', 'Practice ceramic shading', 'Build a dining-room vignette'],
   suggestedUse: 'Pair a low bowl with the tallest vessel to create a clear focal point.'
  },
  {
   id: 'demo-16', name: 'Lighting Small Worlds Course', creator: creators[10], category: 'Courses & tutorials', format: 'MP4 / PDF',
   art: 'lesson', mark: 'Small worlds', subtitle: 'Six studies in light', palette: 15, saved: true,
   description: 'Six video lessons explore light direction, source size, bounce, and reflective surfaces. Each builds a tabletop scene from a few geometric objects. Worksheets provide space to record observations between studies.',
   summary: 'A focused lighting introduction through repeatable experiments. Simple scenes make shadow softness and reflection changes easy to observe.',
   uses: ['Practice light placement', 'Study reflection and bounce', 'Plan a tabletop lighting exercise'],
   suggestedUse: 'Repeat the first scene with three source sizes and compare the shadow edges.',
   notes: 'Learning queue. Finish the bounce-light exercise before moving to reflections.'
  },
  {
   id: 'demo-17', name: 'Orrisel Grotesk Typeface', creator: creators[2], category: 'Typography & fonts', format: 'OTF / WOFF2',
   art: 'sans-type', mark: 'Orrisel', subtitle: 'A steady voice in nine weights', palette: 16,
   description: 'A nine-weight sans serif has open counters, compact headings, and tabular numerals. Matching obliques include alternate letterforms. Specimens cover signage, data tables, and long-form reading.',
   summary: 'A versatile sans family for information-rich work. Tabular numerals and open shapes suit layouts that mix text, measurements, and small labels.',
   uses: ['Set a clear data table', 'Design wayfinding studies', 'Build a compact type hierarchy'],
   suggestedUse: 'Pair the medium weight with tabular numerals for a tidy project dashboard.'
  },
  {
   id: 'demo-18', name: 'Marginpath Budget Template', creator: creators[7], category: 'Templates & planners', format: 'Excel',
   art: 'sheet', mark: 'Marginpath', subtitle: 'A clearer view of project costs', palette: 17,
   description: 'A workbook estimates creative projects, tracks expenses, and compares planned and actual costs. Separate sheets cover time, suppliers, and monthly totals. Sample figures illustrate formulas and can be replaced for a new project.',
   summary: 'A budgeting workbook for small creative projects. Planned-versus-actual views help identify drift in time and expenses.',
   uses: ['Estimate a project budget', 'Track production expenses', 'Review monthly costs'],
   suggestedUse: 'Duplicate the estimate sheet for each proposed scope before choosing a direction.'
  },
  {
   id: 'demo-19', name: 'Wovelle Paper Textures', creator: creators[13], category: 'Textures', format: 'PNG / 6000 px',
   art: 'paper', mark: 'Wovelle', subtitle: 'Fibers, folds, and quiet grain', palette: 18,
   description: 'Forty-eight paper surfaces show visible fibers, soft folds, and subtle tonal variation. Light and dark scans are organized by surface weight. Seamless alternatives cover larger backgrounds.',
   summary: 'A quiet surface collection for depth in flat layouts. Restrained tones work beneath typography and simple illustrations.',
   uses: ['Add depth to a poster', 'Create an editorial background', 'Layer a paper finish'],
   suggestedUse: 'Use a pale fiber scan at low opacity beneath an editorial spread.'
  },
  {
   id: 'demo-20', name: 'Lettergrove Stationery Mockups', creator: creators[13], category: 'Mockups', format: 'Photoshop',
   art: 'stationery', mark: 'Lettergrove', subtitle: 'Notes worth keeping', palette: 19,
   description: 'A stationery set includes folded notes, envelopes, business cards, and a slim letterhead. Each scene has editable paper tones and separate cast shadows. Close crops highlight print details while wide views show the family.',
   summary: 'A paper-goods set for presenting a small identity system. Close and wide compositions move from print detail to a complete stationery overview.',
   uses: ['Present a stationery family', 'Explore paper colors', 'Show a business-card detail'],
   suggestedUse: 'Place the wide envelope composition beside a close crop of the card.'
  },
  {
   id: 'demo-21', name: 'Veyra Portfolio Website Kit', creator: creators[0], category: 'UI & web design', format: 'Framer / Webflow',
   art: 'website', mark: 'Veyra', subtitle: 'Selected work, thoughtfully shown', palette: 20,
   description: 'A portfolio website kit includes project indexes, image-led case studies, and a studio page. Responsive layouts offer spacious and compact gallery options. Content blocks can be rearranged for a solo practice or a team.',
   summary: 'An image-first portfolio structure with space for project context. Flexible sections show finished work alongside the decisions behind it.',
   uses: ['Structure a portfolio', 'Present a project case study', 'Explore responsive galleries'],
   suggestedUse: 'Start with three contrasting projects and connect them through the compact index.'
  },
  {
   id: 'demo-22', name: 'Mosskin 3D Character Set', creator: creators[9], category: '3D characters', format: 'Blender / FBX',
   art: 'character', mark: 'Mosskin', subtitle: 'Little companions, big gestures', palette: 21,
   description: 'Eight original rounded characters have expressive silhouettes and simple joint controls. Each includes standing and seated poses. Interchangeable accessories help build small narrative scenes.',
   summary: 'A playful character family with readable poses. Simple forms suit approachable illustrations and short character studies.',
   uses: ['Create a friendly scene', 'Practice expressive posing', 'Illustrate an onboarding moment'],
   suggestedUse: 'Choose two contrasting poses to show a small exchange between characters.'
  },
  {
   id: 'demo-23', name: 'Hearthwave Ambient Audio Loops', creator: creators[6], category: 'Audio & sound effects', format: 'Ableton / WAV',
   art: 'wave', mark: 'Hearthwave', subtitle: 'Slow tones for open spaces', palette: 22,
   description: 'Twenty seamless audio beds combine muted keys, airy tones, and low pulses. Each loop has isolated layers and a tempo note. Arrangements leave space for narration and environmental sounds.',
   summary: 'A restrained ambient set for spacious films. Isolated layers make it easy to reduce density around speech and detailed sound effects.',
   uses: ['Support a narrated film', 'Build a quiet listening loop', 'Score a product reveal'],
   suggestedUse: 'Start with the airy layer, then bring in the low pulse for the final reveal.'
  },
  {
   id: 'demo-24', name: 'Orenvale Brand Guidelines Kit', creator: creators[4], category: 'Branding kits', format: 'Figma / PDF',
   art: 'identity', mark: 'orenvale', subtitle: 'A field-grown visual identity', palette: 23,
   description: 'A fictional grower identity combines a modular emblem, earthy palette, and clear application rules. The kit includes 32 pages of guidelines and editable packaging studies. Diagrams explain spacing, scale, and color combinations.',
   summary: 'An example of turning an identity into usable guidance. Application diagrams help document a small visual system.',
   uses: ['Plan a guideline document', 'Explore an emblem system', 'Document identity applications'],
   suggestedUse: 'Study the spacing diagrams before preparing a compact identity handoff.'
  },
  {
   id: 'demo-25', name: 'Moonwell Reading Room Scene', creator: creators[11], category: 'Blender scenes & projects', format: 'Blender',
   art: 'scene', mark: 'Moonwell', subtitle: 'A room after dusk', palette: 24,
   description: 'A compact reading room has arched shelving, a low chair, and pools of warm light. Object groups make the room easy to rearrange. Lighting variations explore dusk, lamp light, and an overcast afternoon.',
   summary: 'An atmospheric interior for controlled light and a limited palette. Its small footprint makes camera placement easy to experiment with.',
   uses: ['Study a dusk interior', 'Explore practical lighting', 'Compose a reading corner'],
   suggestedUse: 'Compare the lamp-only view with the dusk setup using the same camera.'
  },
  {
   id: 'demo-26', name: 'Dewmere Portrait Presets', creator: creators[5], category: 'Effects & presets', format: 'Lightroom / XMP',
   art: 'portrait', mark: 'Dewmere', subtitle: 'Soft color, honest light', palette: 25,
   description: 'Ten portrait looks offer gentle contrast, muted backgrounds, and warm midtones. Daylight and indoor variations suit different lighting conditions. An adjustment sheet explains exposure and white-balance refinements.',
   summary: 'A soft portrait collection for careful image-by-image adjustment. Lighting variants help maintain a shared mood across an editorial series.',
   uses: ['Unify a portrait set', 'Explore softer contrast', 'Compare midtone treatments'],
   suggestedUse: 'Apply the daylight look to a balanced image, then fine-tune white balance.'
  },
  {
   id: 'demo-27', name: 'Inkthicket Wash Brushes', creator: creators[5], category: 'Brushes', format: 'Photoshop / ABR',
   art: 'brush', mark: 'Inkthicket', subtitle: 'Pools, edges, and dry trails', palette: 26,
   description: 'Twenty-six wash brushes create pooling ink, dry edges, and uneven pigment trails. Broad washes sit alongside fine branch-like strokes and speckled accents. Example studies demonstrate monochrome and two-color compositions.',
   summary: 'An expressive wash set with irregular edges and pooled color. Broad and fine brushes layer into large shapes and delicate details.',
   uses: ['Paint a botanical study', 'Add an ink-wash background', 'Create monochrome marks'],
   suggestedUse: 'Build a pale wash first, then layer fine dark strokes near the focal point.'
  },
  {
   id: 'demo-28', name: 'Loopfern Animation Assets', creator: creators[8], category: 'Animation assets', format: 'SVG / MP4',
   art: 'orbit', mark: 'Loopfern', subtitle: 'Shapes finding their rhythm', palette: 27,
   description: 'Thirty looping animations explore folding lines, orbiting dots, and elastic rings. Transparent exports sit over a simple background. Static companion frames support matching still graphics.',
   summary: 'A cohesive motion-shape collection for editorial accents. Companion stills connect an animated sequence with its cover image and supporting slides.',
   uses: ['Add a chapter transition', 'Build a looping accent', 'Pair motion with a still'],
   suggestedUse: 'Use one orbit loop between chapters and match its color to the next scene.'
  },
  {
   id: 'demo-29', name: 'Foldhaven Apparel Mockups', creator: creators[1], category: 'Mockups', format: 'Photoshop',
   art: 'apparel', mark: 'Foldhaven', subtitle: 'Everyday shapes, ready for print', palette: 28, archived: true,
   description: 'Unbranded folded shirts, hanging tops, and woven-label closeups form a coordinated set. Editable print areas follow garment folds. Independent fabric and backdrop colors support quick collection studies.',
   summary: 'An apparel set for comparing prints and garment colors. Woven-label views extend an identity into small finishing details.',
   uses: ['Present a garment print', 'Compare fabric colors', 'Show a woven-label treatment'],
   suggestedUse: 'Pair a full garment view with a label closeup for a collection board.',
   notes: 'Archived after the summer collection study. Revisit for a print-led project.'
  },
  {
   id: 'demo-30', name: 'Wallmere Poster Mockups', creator: creators[13], category: 'Mockups', format: 'Photoshop',
   art: 'poster', mark: 'Wallmere', subtitle: 'Print in a little daylight', palette: 29,
   description: 'Eight poster scenes feature simple rails, window shadows, and uncoated paper. Portrait and landscape artwork areas cover common ratios. Background and paper tones are separately editable.',
   summary: 'A daylight poster set that gives the artwork room. Varied ratios help present an exhibition or event series.',
   uses: ['Present an event poster', 'Build a print case study', 'Compare layout ratios'],
   suggestedUse: 'Use matching paper tones across two scenes to connect a poster series.'
  },
  {
   id: 'demo-31', name: 'Gridmoss Spacing Plugin', creator: creators[12], category: 'Plugins', format: 'Figma',
   art: 'grid', mark: 'Gridmoss', subtitle: 'Find a steadier rhythm', palette: 30,
   description: 'A spacing utility groups nearby distances into an editable scale. A preview lists suggested adjustments before application. Selection-based controls work through one layout section at a time.',
   summary: 'A focused utility for examining inconsistent spacing. Its preview supports a deliberate review of proposed adjustments.',
   uses: ['Review a spacing scale', 'Tidy a repeated layout', 'Compare gaps in a selection'],
   suggestedUse: 'Select one section and review the proposed scale before applying adjustments.'
  },
  {
   id: 'demo-32', name: 'Nestline Layer Automation Scripts', creator: creators[12], category: 'Scripts & automation', format: 'Photoshop / JSX',
   art: 'layers', mark: 'Nestline', subtitle: 'A tidier working file', palette: 31,
   description: 'A script collection names layers, sorts export groups, and creates consistent document folders. Each operation uses the current selection. Preview mode shows proposed names before changes are applied.',
   summary: 'A toolkit for repetitive layer housekeeping. Selection-based operations and naming previews suit careful cleanup before handoff.',
   uses: ['Normalize layer names', 'Organize export groups', 'Prepare a document handoff'],
   suggestedUse: 'Preview a naming pass on one group before applying it to the full file.'
  },
  {
   id: 'demo-33', name: 'Pellora Desktop Application', creator: creators[7], category: 'Applications', format: 'Standalone desktop',
   art: 'application', mark: 'Pellora', subtitle: 'A small desk for loose ideas', palette: 32,
   description: 'A fictional desktop notebook arranges notes and color swatches on project boards. Boards can be grouped by project and exported as an image. A compact reading view keeps reference notes close while working.',
   summary: 'A visual notebook concept for gathering project context. Board exports capture an early creative direction for review.',
   uses: ['Gather a project mood', 'Arrange reference notes', 'Share a visual direction board'],
   suggestedUse: 'Start a board with three reference colors and a few project observations.'
  },
  {
   id: 'demo-34', name: 'Pitchweave Presentation Mockups', creator: creators[4], category: 'Mockups', format: 'Figma',
   art: 'slides', mark: 'Pitchweave', subtitle: 'Make space for the idea', palette: 33,
   description: 'A presentation set has floating slides, stacked pages, and angled widescreen boards. Compositions use unbranded frames and editable backgrounds. Single-slide and multi-slide views cover both an opener and a fuller overview.',
   summary: 'A display set for showing the structure of a deck. Multi-slide compositions suggest a larger story within a cover image.',
   uses: ['Show a pitch-deck overview', 'Present an editorial system', 'Compose a slide-design case study'],
   suggestedUse: 'Place the cover on the front board and contrasting content slides behind it.'
  },
  {
   id: 'demo-35', name: 'Fernlet Desk Objects 3D Models', creator: creators[9], category: '3D models & assets', format: 'Blender / OBJ',
   art: 'objects', mark: 'Fernlet', subtitle: 'A desk with a little character', palette: 34,
   description: 'Thirty-six desk objects include trays, lamps, pencil cups, and rounded bookends. They share a consistent scale and simple surface assignments. Grouped arrangements provide starting points for still-life compositions.',
   summary: 'A small-object library for workspace scenes. Coordinated proportions help build believable arrangements with minimal rescaling.',
   uses: ['Dress a workspace scene', 'Build a desk still life', 'Practice object composition'],
   suggestedUse: 'Arrange three objects of different heights around a clear focal point.'
  },
  {
   id: 'demo-36', name: 'Veilstone Glaze Shaders', creator: creators[11], category: 'Materials & shaders', format: 'Blender',
   art: 'spheres', mark: 'Veilstone', subtitle: 'Experiments in translucent glaze', palette: 35, hidden: true,
   description: 'Eighteen experimental glazes explore cloudy translucency, fine crackle, and soft iridescence. Controls adjust tint and apparent surface depth. A scene places each finish beside a neutral ceramic reference.',
   summary: 'An experimental surface collection for close-up studies. Its comparison scene reveals how tint and translucency affect perceived thickness.',
   uses: ['Explore translucent finishes', 'Create a surface study', 'Compare glaze depth and tint'],
   suggestedUse: 'Reveal the preview and compare a pale glaze with the neutral reference.'
  },
  {
   id: 'demo-37', name: 'Dustloom Grain Textures', creator: creators[13], category: 'Textures', format: 'PNG / TIFF',
   art: 'paper', mark: 'Dustloom', subtitle: 'A study in printed grain', palette: 36, archived: true,
   description: 'Sixty overlays combine fine speckle, soft dust, and uneven print density. Files include transparent and grayscale versions. A comparison sheet shows surfaces over light and dark artwork.',
   summary: 'A print-inspired overlay set for controlled surface variation. Comparison sheets help select grain that preserves small text and illustration detail.',
   uses: ['Add a print finish', 'Break up flat color', 'Compare grain density'],
   suggestedUse: 'Test a fine overlay on a copy of finished artwork and compare at export size.'
  },
  {
   id: 'demo-38', name: 'Cairnleaf Editorial Website Kit', creator: creators[0], category: 'UI & web design', format: 'Figma',
   art: 'website', mark: 'Cairnleaf', subtitle: 'Stories with room to unfold', palette: 37, archived: true,
   description: 'An editorial website kit includes feature stories, contributor pages, and a reading list. Layouts combine generous margins with flexible image sequences. Mobile variants keep captions and navigation close to the story.',
   summary: 'A reading-focused structure for a small publication. Image sequences and contributor layouts support visual and written context.',
   uses: ['Plan an online publication', 'Explore article layouts', 'Design a contributor index'],
   suggestedUse: 'Test one short feature story across screen sizes to compare the reading rhythm.'
  },
  {
   id: 'demo-39', name: 'Ribbonwake Transition Projects', creator: creators[8], category: 'After Effects projects', format: 'After Effects',
   art: 'motion', mark: 'Ribbonwake', subtitle: 'A soft turn between scenes', palette: 38, archived: true,
   description: 'Sixteen transition compositions use folded bands, sliding panes, and gentle masks. Timing and color controls shape each transition. Short and extended versions support different edit rhythms.',
   summary: 'A transition set with broad, readable shapes. Adjustable timing helps connect chapters within the pace of a short film.',
   uses: ['Connect film chapters', 'Create a color-led scene change', 'Explore a slower edit rhythm'],
   suggestedUse: 'Match the band color to an object in the outgoing shot for a connected handoff.'
  },
  {
   id: 'demo-40', name: 'Hushvale Studio Selection', creator: creators[11], category: 'Uncategorized', format: 'Mixed digital files',
   art: 'selection', mark: 'Hushvale', subtitle: 'Collected fragments, new directions', palette: 39, hidden: true,
   description: 'A private selection contains abstract studies, color experiments, and unfinished layout fragments from a fictional studio. Files are grouped by mood and motif. A contact sheet gives an overview of the collection.',
   summary: 'An open-ended collection for early visual exploration. Mixed contents support mood gathering before a project settles into a direction.',
   uses: ['Explore a visual mood', 'Collect color combinations', 'Start an abstract composition'],
   suggestedUse: 'Reveal the contact sheet and choose three fragments with a shared visual rhythm.'
  }
 ];

 // Coordinated grounds, inks, and highlights. The second cycle reverses ground and ink.
 const palettes = [
  ['#dde9e8', '#193f46', '#b4d47e'], ['#f0ddd0', '#733e44', '#d38e75'],
  ['#ece3cb', '#374e49', '#b7c99c'], ['#d8e2ce', '#335852', '#edc187'],
  ['#e2dced', '#4b4063', '#b4c7e2'], ['#f0d8d7', '#733e5c', '#bc8e47'],
  ['#243b4a', '#dce9e5', '#91bbb4'], ['#e1e8d8', '#3e5949', '#adc1a5'],
  ['#d8e3f0', '#394d70', '#aba4d0'], ['#eadacc', '#634c4b', '#bd847b'],
  ['#303b59', '#e5ddeb', '#e9b4a1'], ['#e2e8dc', '#34594f', '#a8c6a3'],
  ['#eaded4', '#6c444e', '#cda390'], ['#e8dbc7', '#4f6254', '#c99572'],
  ['#d9e5e1', '#375b58', '#a5bbb0'], ['#dce0ed', '#4a476b', '#c8b6d8'],
  ['#edd9cd', '#733e43', '#c39583'], ['#dce7e2', '#315953', '#a2bbb0'],
  ['#e8e2d9', '#665c56', '#b9a894'], ['#dfdfec', '#494d70', '#afb7cf']
 ];
 const escape = value => String(value).replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'}[char]));

 function coverArt(product) {
  const colors = palettes[product.palette % palettes.length];
  const [ground, ink, accent] = product.palette < palettes.length ? colors : [colors[1], colors[0], colors[2]];
  const rect = (x, y, width, height, fill, radius = 0, extra = '') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" fill="${fill}" ${extra}/>`;
  const circle = (x, y, radius, fill, extra = '') => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" ${extra}/>`;
  const text = (x, y, value, size = 20, extra = '', fill = ink) => `<text x="${x}" y="${y}" fill="${fill}" font-size="${size}" ${extra}>${escape(value)}</text>`;
  const panelInk = colors[1];
  const line = (x, y, width) => rect(x, y, width, 5, ink, 2, 'opacity=".18"');
  const panel = (x, y, width, height) => rect(x, y, width, height, '#ffffff', 12, 'fill-opacity=".88"');
  const orb = (x, y, radius) => `<ellipse cx="${x}" cy="${y + radius * .9}" rx="${radius * .9}" ry="${radius * .13}" fill="${ink}" opacity=".15"/>` + circle(x, y, radius, 'url(#glaze)');
  let drawing = '';
  switch (product.art) {
   case 'interface':
   case 'application':
    drawing = panel(116, 100, 422, 218) + rect(116, 100, 84, 218, ink, 12) + circle(141, 126, 6, accent);
    for (let row = 0; row < 5; row++) drawing += rect(134, 153 + row * 26, 45 - row * 3, 5, ground, 2, 'opacity=".65"');
    drawing += text(220, 133, product.art === 'interface' ? 'Project overview' : 'Ideas on the desk', 16, '', panelInk);
    for (let column = 0; column < 3; column++) drawing += rect(220 + column * 98, 153, 84, 51, column === 1 ? accent : ground, 8) + line(232 + column * 98, 169, 37) + line(232 + column * 98, 184, 51);
    drawing += rect(220, 220, 182, 78, ground, 8) + rect(418, 220, 100, 78, accent, 8) + `<path d="M234 279 261 260 284 267 312 239 337 249 380 230" fill="none" stroke="${ink}" stroke-width="4"/>`;
    break;
   case 'packaging':
    drawing = `<ellipse cx="340" cy="301" rx="180" ry="17" fill="${ink}" opacity=".12"/>` + rect(178, 132, 130, 162, '#fff5e7') + `<path d="m308 132 30-18v161l-30 19z" fill="${accent}"/><path d="m178 132 30-18h130l-30 18z" fill="#fffaf0"/>` + text(193, 199, product.mark, 23, 'font-family="Georgia,serif"') + line(195, 218, 70) + rect(378, 171, 106, 123, accent, 7) + `<ellipse cx="431" cy="171" rx="53" ry="13" fill="#fff5e7"/>` + circle(431, 224, 28, ground) + text(410, 230, 'p.', 25, 'font-family="Georgia,serif"');
    break;
   case 'type':
   case 'sans-type': {
    const family = product.art === 'type' ? 'Georgia,serif' : 'Arial,sans-serif';
    drawing = text(125, 232, product.art === 'type' ? 'Aa' : 'Ag', 164, `font-family="${family}" letter-spacing="-12"`) + text(365, 146, 'Regular', 20) + text(365, 182, 'Medium', 22, 'font-weight="500"') + text(365, 223, 'Bold', 28, 'font-weight="700"') + text(130, 291, 'abcdefghijklm  0123456789', 25, 'letter-spacing="2"');
    break;
   }
   case 'scene':
    drawing = `<path d="M90 281 319 204 565 277 338 337Z" fill="${accent}" opacity=".5"/><path d="M112 278V152a77 77 0 0 1 154 0v88" fill="${ink}" opacity=".2" stroke="${ink}" stroke-width="5"/><path d="M189 78v174m-76-90h152" stroke="${ground}" stroke-width="5"/>` + rect(293, 210, 96, 79, ground, 6) + `<ellipse cx="341" cy="211" rx="48" ry="17" fill="#ffffff" fill-opacity=".8"/>` + rect(450, 234, 37, 64, accent, 9) + `<path d="M467 241v-93m0 41q-64-51-42-65 43 6 42 65m0 25q63-53 47-65-45 12-47 65" fill="${ink}"/>`;
    break;
   case 'identity':
    drawing = panel(111, 116, 220, 175) + rect(347, 103, 179, 102, ink, 3) + rect(347, 218, 179, 82, accent, 3) + circle(221, 177, 30, accent) + `<path d="M197 177h48m-24-24v48" stroke="${panelInk}" stroke-width="7"/>` + text(137, 245, product.mark, 30, 'font-family="Georgia,serif"', panelInk) + `<path d="M397 151q39-58 37 1-39 58-37-1" fill="${ground}"/>` + rect(368, 239, 34, 40, ground) + rect(410, 239, 34, 40, ink) + rect(452, 239, 53, 40, '#faf1df');
    break;
   case 'brush':
    for (let stroke = 0; stroke < 4; stroke++) drawing += `<path d="M${118 + stroke * 9} ${137 + stroke * 47}q94-43 166-7t210-11" fill="none" stroke="${stroke % 2 ? ink : accent}" stroke-width="${24 - stroke * 3}" stroke-linecap="round" opacity="${.85 - stroke * .12}" stroke-dasharray="${stroke === 2 ? '9 3 22 2' : '170 3 140'}"/>`;
    for (let dot = 0; dot < 45; dot++) drawing += circle(117 + (dot * 67) % 402, 109 + (dot * 31) % 203, 1 + dot % 3, ink, 'opacity=".24"');
    break;
   case 'wave':
    drawing = circle(320, 205, 111, accent, 'opacity=".15"');
    for (let bar = 0; bar < 67; bar++) {
     const height = 12 + Math.abs(Math.sin(bar * .61 + product.palette) * Math.cos(bar * .17)) * 140;
     drawing += rect(108 + bar * 6.4, 205 - height / 2, 3, height, bar % 4 ? ink : accent, 2, 'opacity=".85"');
    }
    drawing += text(115, 306, product.palette < 20 ? 'Paper / ceramic / cloth' : 'Air / keys / low pulse', 16);
    break;
   case 'planner':
   case 'sheet':
    drawing = panel(119, 100, 402, 220) + text(143, 137, product.art === 'planner' ? 'This week' : 'Project estimate', 21) + line(144, 152, 325);
    for (let row = 0; row < 4; row++) drawing += rect(143, 171 + row * 31, 160, 22, row % 2 ? ground : accent, 4, 'opacity=".7"') + line(319, 179 + row * 31, 67) + line(413, 179 + row * 31, 73);
    break;
   case 'device':
    drawing = rect(133, 136, 264, 168, ink, 15, 'transform="rotate(-8 265 220)"') + rect(143, 146, 244, 148, accent, 8, 'transform="rotate(-8 265 220)"') + rect(369, 95, 114, 220, ink, 22, 'transform="rotate(8 426 205)"') + rect(377, 104, 98, 202, '#f5f0e7', 16, 'transform="rotate(8 426 205)"') + circle(425, 182, 31, accent) + rect(395, 234, 65, 6, ground, 3) + rect(395, 250, 47, 6, ground, 3);
    break;
   case 'spheres':
    drawing = orb(221, 217, 74) + orb(390, 177, 55) + orb(443, 276, 34) + text(137, 317, 'Surface studies', 17, 'letter-spacing="2"');
    break;
   case 'motion':
    drawing = `<path d="M113 284q63-204 179-98t241-58" fill="none" stroke="${accent}" stroke-width="62"/><path d="M113 284q63-204 179-98t241-58" fill="none" stroke="${ground}" stroke-width="3" opacity=".6"/>` + text(147, 235, product.palette < 20 ? 'Move gently.' : 'Turn the page.', 46, 'font-style="italic" font-family="Georgia,serif"') + rect(149, 295, 255, 3, ink, 1, 'opacity=".3"') + circle(253, 296, 7, ink);
    break;
   case 'icons':
    for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
     const x = 127 + col * 66, y = 111 + row * 68;
     drawing += rect(x, y, 51, 51, ink, 12, 'fill-opacity=".06"');
     const symbols = [
      `<path d="m${x + 13} ${y + 25} 12-11 12 11v14h-24z"/>`,
      `<circle cx="${x + 25}" cy="${y + 23}" r="11"/><path d="m${x + 33} ${y + 31} 7 7"/>`,
      `<rect x="${x + 13}" y="${y + 14}" width="24" height="24" rx="5"/><path d="M${x + 13} ${y + 23}h24"/>`,
      `<path d="M${x + 16} ${y + 13}h18v27l-9-6-9 6z"/>`,
      `<circle cx="${x + 25}" cy="${y + 25}" r="12"/><path d="M${x + 25} ${y + 17}v16m-8-8h16"/>`,
      `<path d="M${x + 13} ${y + 18}h25v20h-25zm0 0v-5h10l4 5"/>`
     ];
     drawing += `<g fill="none" stroke="${ink}" stroke-width="2" stroke-linejoin="round">${symbols[(col + row) % symbols.length]}</g>`;
    }
    break;
   case 'book':
    drawing = rect(230, 103, 209, 222, ink, 3, 'opacity=".2"') + rect(219, 91, 209, 228, ink, 3) + rect(225, 91, 6, 228, accent) + `<text x="250" y="145" fill="${ground}" font-family="Georgia,serif" font-size="35"><tspan x="250">The Quiet</tspan><tspan x="250" dy="39">Layout</tspan></text><path d="M253 245h142m-142 14h110m-110 14h126" stroke="${accent}" stroke-width="3"/>`;
    break;
   case 'landscape':
    drawing = rect(113, 104, 414, 211, '#d2b7a6', 4) + circle(416, 153, 31, '#f6dfb8') + `<path d="m113 229 104-68 121 100 83-46 106 54v46H113Z" fill="${accent}"/><path d="m113 276 111-58 136 50 167-20v67H113Z" fill="${ink}"/><path d="m338 215-24 100h62z" fill="${ground}" opacity=".5"/>`;
    break;
   case 'vessels':
   case 'objects':
    drawing = `<ellipse cx="327" cy="295" rx="194" ry="18" fill="${ink}" opacity=".12"/><path d="M164 206h121q-2 73-60 73t-61-73" fill="${accent}"/><ellipse cx="224" cy="206" rx="61" ry="14" fill="${ink}" opacity=".3"/><path d="M359 128h48l-6 48q46 21 39 75-4 40-56 40t-54-40q-7-54 36-75z" fill="url(#glaze)"/>` + rect(467, 205, 35, 82, accent, 8) + `<ellipse cx="484" cy="205" rx="18" ry="7" fill="${ink}" opacity=".5"/>`;
    if (product.art === 'objects') drawing += `<path d="M181 169v-43h63" fill="none" stroke="${ink}" stroke-width="7"/><path d="m217 147 27-33 28 33z" fill="${ink}"/>`;
    break;
   case 'lesson':
    drawing = panel(125, 104, 390, 215) + rect(125, 104, 244, 215, ink, 12) + orb(226, 210, 59) + `<path d="m276 270 46-80 32 80z" fill="${accent}"/>` + circle(398, 140, 12, accent) + line(389, 172, 100) + line(389, 190, 79) + line(389, 208, 88) + circle(446, 268, 22, ink) + `<path d="m441 257 15 11-15 11z" fill="${ground}"/>`;
    break;
   case 'paper':
    drawing = rect(160, 114, 210, 183, '#f8efe0', 2, 'transform="rotate(-11 265 205)"') + rect(275, 125, 200, 177, accent, 2, 'transform="rotate(9 375 213)"');
    for (let fiber = 0; fiber < 110; fiber++) drawing += `<path d="m${154 + (fiber * 47) % 328} ${132 + (fiber * 17) % 148} 9-2" stroke="${ink}" opacity=".18" stroke-width="${fiber % 3 ? 1 : 2}"/>`;
    drawing += text(187, 225, product.mark, 33, 'font-family="Georgia,serif" transform="rotate(-11 265 205)"', panelInk);
    break;
   case 'stationery':
    drawing = rect(144, 111, 206, 188, '#f9f5eb', 2, 'transform="rotate(-8 247 205)"') + line(172, 191, 139) + line(172, 208, 105) + rect(297, 195, 209, 110, accent, 2, 'transform="rotate(8 400 250)"') + `<path d="m305 207 88 62 105-36" fill="none" stroke="${ink}" stroke-width="2" opacity=".3"/>` + rect(374, 116, 134, 77, ink, 2) + `<text x="390" y="160" fill="${ground}" font-family="Georgia,serif" font-size="23">Lg.</text>`;
    break;
   case 'website':
    drawing = panel(112, 103, 416, 216) + text(130, 130, product.mark.toLowerCase(), 17, 'font-family="Georgia,serif"', panelInk) + line(400, 123, 40) + line(455, 123, 50) + text(130, 179, product.palette < 30 ? 'Work with a point of view.' : 'A place for longer stories.', 23, 'font-family="Georgia,serif"', panelInk) + rect(130, 199, 176, 102, accent, 3) + rect(320, 199, 190, 102, ground, 3) + circle(218, 250, 36, ink, 'opacity=".65"') + `<path d="m337 283 63-65 90 65z" fill="${ink}" opacity=".6"/>`;
    break;
   case 'character':
    drawing = `<ellipse cx="324" cy="306" rx="128" ry="15" fill="${ink}" opacity=".12"/>` + rect(257, 168, 133, 112, accent, 50) + rect(265, 256, 43, 49, ink, 18) + rect(341, 256, 43, 49, ink, 18) + circle(324, 145, 65, 'url(#glaze)') + circle(302, 143, 5, ink) + circle(341, 143, 5, ink) + `<path d="M311 164q14 12 27-1m-76 46-39 35m162-35 37 30" fill="none" stroke="${ink}" stroke-width="12" stroke-linecap="round"/>`;
    break;
   case 'portrait':
    drawing = rect(158, 96, 319, 228, accent, 4) + circle(324, 169, 48, '#e8bd9e') + `<path d="M274 159q-8-82 54-70 61 2 49 80l-28-50-31 27z" fill="${ink}"/><path d="M219 324q4-111 102-108 102-2 106 108" fill="${ink}"/>` + circle(307, 166, 3, ink) + circle(343, 166, 3, ink) + `<path d="M316 191q10 5 21-1" fill="none" stroke="${ink}" stroke-width="2"/>`;
    break;
   case 'orbit':
    drawing = `<g fill="none" stroke="${ink}" stroke-width="10"><ellipse cx="321" cy="208" rx="193" ry="71" transform="rotate(-26 321 208)"/><ellipse cx="321" cy="208" rx="173" ry="81" transform="rotate(29 321 208)"/></g>` + circle(320, 208, 63, accent) + circle(470, 131, 22, ink) + circle(167, 259, 16, accent);
    break;
   case 'apparel':
    drawing = `<path d="m210 119 70-28q37 36 74 0l74 28 65 72-57 40-36-34v119H239V197l-34 34-57-40z" fill="${accent}"/><path d="M282 94q35 53 72 0" fill="none" stroke="${ink}" stroke-width="7" opacity=".3"/>` + text(273, 208, 'fold', 38, 'font-family="Georgia,serif"') + text(277, 231, 'a little everyday', 13);
    break;
   case 'poster':
    drawing = rect(192, 97, 250, 222, ink, 2) + rect(202, 103, 230, 208, ground, 1) + circle(318, 193, 65, accent) + `<path d="m254 250 66-115 67 115z" fill="${ink}"/>` + text(224, 285, 'A gathering of shapes', 20, 'font-family="Georgia,serif"') + rect(186, 92, 261, 7, accent, 2) + `<path d="M213 100v209m48-209v209" stroke="#ffffff" stroke-width="21" opacity=".15"/>`;
    break;
   case 'grid':
   case 'layers':
    for (let layer = 0; layer < 4; layer++) drawing += rect(164 + layer * 35, 106 + layer * 32, 240, 98, layer % 2 ? accent : ground, 9, `stroke="${ink}" stroke-opacity=".4" transform="rotate(-8 320 210)"`) + line(190 + layer * 35, 132 + layer * 32, 96);
    drawing += circle(472, 134, 30, ink) + `<path d="m459 134 9 9 17-20" fill="none" stroke="${ground}" stroke-width="4"/>`;
    break;
   case 'slides':
    drawing = rect(114, 112, 254, 151, accent, 5, 'transform="rotate(-9 241 187)"') + rect(285, 161, 250, 151, ground, 5, `stroke="${ink}" stroke-opacity=".25" transform="rotate(6 410 236)"`) + text(141, 178, 'An idea takes shape.', 25, 'font-family="Georgia,serif" transform="rotate(-9 241 187)"') + circle(422, 233, 43, ink) + line(316, 278, 67);
    break;
   case 'selection':
    drawing = rect(130, 104, 114, 91, accent) + circle(187, 150, 30, ink) + rect(258, 104, 115, 91, ground, 0, `stroke="${ink}" stroke-opacity=".3"`) + `<path d="m270 185 45-70 47 70z" fill="${accent}"/>` + rect(387, 104, 114, 91, ink, 0, 'fill-opacity=".13"') + rect(130, 210, 243, 104, accent, 0, 'fill-opacity=".35"') + `<path d="M143 281q46-88 92-12t123-15" fill="none" stroke="${ink}" stroke-width="13"/>` + rect(387, 210, 114, 104, accent) + circle(443, 263, 39, ground);
    break;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><radialGradient id="glaze" cx=".3" cy=".25" r=".8"><stop stop-color="#ffffff"/><stop offset=".35" stop-color="${accent}"/><stop offset="1" stop-color="${ink}"/></radialGradient></defs><rect width="640" height="400" fill="${ground}"/><g font-family="Arial,sans-serif">${text(34, 49, product.mark, 26, 'font-weight="600" letter-spacing="-.6"')}${drawing}${text(34, 372, product.subtitle, 17)}${text(606, 372, product.format, 12, 'text-anchor="end" opacity=".7"')}</g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
 }

 window.demoProducts = products.map((product, index) => {
  const thumbnail = coverArt(product);
  return {
   saved: false, archived: false, hidden: false, notes: '', ...product,
   thumbnail, images: [thumbnail], sourceUrl: '', publicUrl: '', creatorUrl: '',
   detailState: 'complete', descriptionSource: 'demo', purchaseOrder: index, analysisSource: 'AI review (demo)',
   seenAt: new Date(Date.UTC(2026, 9, 24, 12) - index * 86400000).toISOString()
  };
 });

 // Same membership shape as lib/collections.cjs. Every member is saved.
 window.demoCollections = [
  {id: 'demo-client-pitch', name: 'Client pitch kit', productIds: ['demo-01', 'demo-02', 'demo-03', 'demo-05', 'demo-09']},
  {id: 'demo-weekend-3d', name: 'Weekend 3D', productIds: ['demo-04', 'demo-10', 'demo-14', 'demo-15']},
  {id: 'demo-brand-refresh', name: 'Brand refresh', productIds: ['demo-01', 'demo-02', 'demo-03', 'demo-05']},
  {id: 'demo-learning', name: 'Learning queue', productIds: ['demo-04', 'demo-08', 'demo-13', 'demo-16']}
 ];

 // Only built-in artwork can be rendered through the demo-only image path.
 const covers = new Map(window.demoProducts.map(product => [product.id, product.thumbnail]));
 window.demoCover = id => covers.get(id) || '';
})();
