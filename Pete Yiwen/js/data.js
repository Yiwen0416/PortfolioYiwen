/* ============================================================
   data.js — Artwork data store + localStorage helpers
   Defines: window.Portfolio.data
   ============================================================ */
window.Portfolio = window.Portfolio || {};

Portfolio.data = (function () {

  const STORAGE_KEY = 'portfolio_artworks';
  const STATEMENT_KEY = 'portfolio_statement';
  const CONTACT_KEY = 'portfolio_contact';

  /* ── Seed data ── */
  const SEED_ARTWORKS = [
    /* ───── Illustrations / Digital ───── */
    {
      id: 'illus-digital-001',
      category: 'illustrations',
      subcategory: 'digital',
      title: 'Threshold',
      year: '2024',
      size: '4000 × 6000 px',
      materials: 'Digital painting, Procreate',
      description: 'A figure stands at the edge of a luminous doorway, caught between two worlds. The composition explores liminality — the in-between spaces where identity is most fluid and most honest. Warm amber light spills forward while the room behind recedes into cool shadow.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A silhouetted figure stands in a glowing doorway. Warm amber light pours through the opening into a cool blue-grey room. The contrast is stark and intimate, suggesting a moment of hesitation at a threshold.',
          altStatus: 'reviewed'
        },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' }
      ],
      process: [
        { type: 'text', content: 'The initial concept came from a recurring dream about doorways and light. I began with rough gesture sketches to establish the figure\'s posture — a slight lean forward, suggesting desire rather than hesitation.' },
        { type: 'image', src: 'assets/placeholder.svg', caption: 'Early gesture sketches, pencil on paper, photographed and imported into Procreate' },
        { type: 'text', content: 'The color palette was resolved in the second pass. I wanted the warm light to feel earned — almost sacred — against the cooler ambient tones of the room behind. Several gradient layers were built up over 3–4 sessions.' }
      ]
    },
    {
      id: 'illus-digital-002',
      category: 'illustrations',
      subcategory: 'digital',
      title: 'Cartography of Forgetting',
      year: '2023',
      size: '5120 × 3840 px',
      materials: 'Digital, Photoshop, custom brushes',
      description: 'An aerial map of a city that does not exist, annotated with handwritten notes that trail into illegibility. The work interrogates how memory reconstructs geography — the places we carry inside us are never quite the places that were.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'An intricate aerial map rendered in muted ochres and blues. Streets and building outlines are densely layered with handwritten annotations that become increasingly illegible toward the edges of the composition.',
          altStatus: 'reviewed'
        }
      ],
      process: [
        { type: 'text', content: 'Research phase involved studying 17th–19th century cartographic conventions — hatching, stippling, the particular grammar of how surveyors marked uncertain territory.' },
        { type: 'image', src: 'assets/placeholder.svg', caption: 'Reference archive of historical map details studied during the research phase' }
      ]
    },

    /* ───── Illustrations / Traditional ───── */
    {
      id: 'illus-trad-001',
      category: 'illustrations',
      subcategory: 'traditional',
      title: 'Study in Accumulation',
      year: '2024',
      size: '18 × 24 in',
      materials: 'Graphite, charcoal on cartridge paper',
      description: 'A dense layering of repetitive marks — each individual stroke is a breath, a blink, a second of ordinary time. Collectively they form a landscape that is simultaneously precise and overwhelming, questioning how we register duration.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A large-format drawing composed entirely of fine graphite marks. The marks accumulate into undulating tonal forms suggesting a horizon and sky. The texture is rich and the overall tone moves from deep black at the base to pale silvery grey above.',
          altStatus: 'reviewed'
        },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' }
      ],
      process: [
        { type: 'text', content: 'Made over 40 hours across 3 weeks. Each session was deliberately short — never more than 90 minutes — to preserve the quality of attention that the work demands.' },
        { type: 'image', src: 'assets/placeholder.svg', caption: 'Detail showing mark variety: 2H, HB, 4B graphite pencils alongside compressed charcoal' },
        { type: 'text', content: 'The compositional structure was loosely planned in advance, but the mark-making itself was entirely intuitive within each session.' }
      ]
    },
    {
      id: 'illus-trad-002',
      category: 'illustrations',
      subcategory: 'traditional',
      title: 'Portrait of Silence',
      year: '2023',
      size: '12 × 16 in',
      materials: 'Ink, white gouache on toned paper',
      description: 'A face observed in stillness, rendered in high-contrast ink with selective highlights drawn from white gouache. The toned ground becomes an active third element — neither shadow nor light, but the space between knowing and not-knowing.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A face rendered in warm black ink against a mid-tone grey paper. White gouache highlights define the bridge of the nose, upper eyelids, and collarbone. The expression is neutral yet deeply interior.',
          altStatus: 'reviewed'
        }
      ],
      process: [
        { type: 'text', content: 'Three sessions: first the broad ink washes establishing shadow masses, then refined linework, finally the gouache highlights applied sparingly with a dry brush.' }
      ]
    },

    /* ───── Illustrations / Mixed Media ───── */
    {
      id: 'illus-mix-001',
      category: 'illustrations',
      subcategory: 'mixed-media',
      title: 'Archive Fever',
      year: '2024',
      size: '20 × 28 in',
      materials: 'Printed collage, watercolour, pen, photographic transfers',
      description: 'Fragments of printed ephemera — receipts, botanical engravings, passport photographs — layered beneath washes of diluted watercolour and tied together with fine pen lines. An image of retrieval itself: the work of pulling meaning from fragments.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A richly layered mixed-media work on paper. Fragments of vintage printed material are visible beneath translucent watercolour washes in dusty rose and sage. Fine black ink lines connect disparate elements across the composition.',
          altStatus: 'reviewed'
        },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' }
      ],
      process: [
        { type: 'image', src: 'assets/placeholder.svg', caption: 'Source material gathered for collage: botanical prints, receipts, topographic fragments' },
        { type: 'text', content: 'The collage layer was constructed first, dry, then sealed before watercolour application. This sequence preserved the printed detail while allowing the colour to unify the surface.' }
      ]
    },

    /* ───── Digital Applications ───── */
    {
      id: 'digapp-001',
      category: 'digital-applications',
      subcategory: null,
      title: 'Murmur',
      year: '2023',
      size: 'Variable (browser-based)',
      materials: 'HTML5 Canvas, Web Audio API, p5.js',
      description: 'An interactive browser work in which the user\'s microphone input is translated into shifting particle formations. Silence produces stillness; speech generates turbulence. The work makes the invisible physicality of voice briefly visible.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A screenshot of a browser-based application showing a dark background with hundreds of small white particles arranged in loosely organic formations. The particle density is higher toward the centre of the composition.',
          altStatus: 'reviewed'
        }
      ],
      process: [
        { type: 'text', content: 'The technical challenge was mapping amplitude and frequency data from the Web Audio API onto visually coherent particle behaviour without the simulation becoming chaotic at high volumes.' },
        { type: 'image', src: 'assets/placeholder.svg', caption: 'Early prototype showing raw frequency visualization before aesthetic refinement' }
      ]
    },
    {
      id: 'digapp-002',
      category: 'digital-applications',
      subcategory: null,
      title: 'Slow Light',
      year: '2024',
      size: 'Variable (iPad / desktop)',
      materials: 'SwiftUI, CoreMotion, custom shaders',
      description: 'A native iPad application that uses device orientation data to simulate the behaviour of light at golden hour. The user holds the device and physically moves through space to change the angle of simulated sunlight across a procedurally generated landscape.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'An iPad screen showing a softly rendered procedural landscape bathed in warm golden-hour light. The horizon is low and the sky grades from deep amber to a pale lemon yellow.',
          altStatus: 'reviewed'
        },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' }
      ],
      process: [
        { type: 'text', content: 'The shader language work — translating atmospheric scattering equations into Metal shaders — took most of the development time. The goal was light behaviour that felt physically plausible without being photorealistic.' },
        { type: 'image', src: 'assets/placeholder.svg', caption: 'Shader iteration comparing Rayleigh scattering approximations at different atmospheric depths' },
        { type: 'text', content: 'User testing with participants who had no technical context shaped the final interface toward near-invisibility: the technology recedes so the experience of light remains central.' }
      ]
    },

    /* ───── Installations ───── */
    {
      id: 'install-001',
      category: 'installations',
      subcategory: null,
      title: 'Weight of Attention',
      year: '2023',
      size: '6 × 4 × 3 m (variable)',
      materials: 'Steel cable, suspended graphite rods, pressure sensors, ambient sound system',
      description: 'One hundred graphite rods are suspended at varying heights throughout a darkened room. Pressure sensors beneath the floor track visitor weight and movement; the rods sway in response, producing faint rhythmic sounds as they contact one another. The room becomes responsive, registering presence.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A darkened room installation. Numerous thin graphite rods hang from the ceiling on fine steel cables at varying heights, creating a forest-like density. Dim spotlights catch the graphite surfaces, producing faint silver reflections.',
          altStatus: 'reviewed'
        },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' }
      ],
      process: [
        { type: 'image', src: 'assets/placeholder.svg', caption: 'Scale model built at 1:20 to test suspension geometry and rod spacing' },
        { type: 'text', content: 'The pressure sensor array required iterative calibration on-site: visitor weight distribution varies significantly and the response mapping needed to feel intuitive rather than mechanical.' }
      ]
    },
    {
      id: 'install-002',
      category: 'installations',
      subcategory: null,
      title: 'Reading Room',
      year: '2024',
      size: '8 × 6 m',
      materials: 'Archival text, thermal paper, custom printer, oak shelving, reading chairs',
      description: 'A functional reading room in which all visible text is replaced with algorithmically generated language that precisely mimics the statistical structure of the source texts without reproducing their content. The room appears comprehensible until close reading reveals illegibility.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A warmly lit reading room with oak shelving lined with identically bound books. Two worn leather reading chairs face a window. The spines of the books bear titles in a typeface that closely resembles familiar script but remains unreadable on closer inspection.',
          altStatus: 'reviewed'
        }
      ],
      process: [
        { type: 'text', content: 'The language model was trained on a corpus of 19th century encyclopaedias, legal texts, and botanical descriptions to produce outputs with high local plausibility and low global coherence.' }
      ]
    },

    /* ───── 3D Models ───── */
    {
      id: '3d-001',
      category: '3d-models',
      subcategory: null,
      title: 'Specimen 01–07',
      year: '2024',
      size: 'Variable (digital files + resin prints, 3–8 cm each)',
      materials: 'ZBrush, KeyShot, resin 3D printing',
      description: 'A series of seven imaginary biological specimens — each modelled with the anatomical rigour of scientific illustration but depicting organisms that do not and could not exist. The prints are displayed alongside typewritten field notes that maintain the fiction of discovery.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A cluster of seven small resin-printed sculptural forms displayed on a white surface. Each form suggests biological structure — exoskeletons, seed pods, bone — rendered in translucent cream-white resin that catches the light softly.',
          altStatus: 'reviewed'
        },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' }
      ],
      process: [
        { type: 'image', src: 'assets/placeholder.svg', caption: 'ZBrush work-in-progress: specimen 04 at the structural detailing stage' },
        { type: 'text', content: 'Each specimen was developed with reference to real biological morphologies — radiolarians, seed dispersal mechanisms, arthropod joints — then systematically deviated from those references to produce something recognisable but unclassifiable.' },
        { type: 'image', src: 'assets/placeholder.svg', caption: 'KeyShot rendering tests: material comparisons across matte, translucent, and shell finishes' },
        { type: 'text', content: 'The resin printing process required supports carefully placed to preserve delicate overhangs. Several specimens required 2–3 reprints to achieve the surface quality needed for the field-specimen fiction.' }
      ]
    },
    {
      id: '3d-002',
      category: '3d-models',
      subcategory: null,
      title: 'Interior (After Hopper)',
      year: '2023',
      size: 'Digital only (4K render series)',
      materials: 'Blender, Cycles renderer, HDRI lighting',
      description: 'A series of five digitally rendered interior spaces that reinterpret the spatial logic of Edward Hopper\'s paintings. Geometry is simplified to near-abstraction; light sources are placed with painterly rather than architectural logic. The renders are printed at large format and presented as photographs.',
      images: [
        {
          src: 'assets/placeholder.svg',
          alt: 'A rendered interior: a sparse room with a large window casting a strong parallelogram of warm light across an otherwise cool floor. Geometry is simplified — walls are smooth planes, shadows are clean. The composition echoes Hopper\'s sense of contained loneliness.',
          altStatus: 'reviewed'
        },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' },
        { src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' }
      ],
      process: [
        { type: 'text', content: 'The challenge was achieving Hopper\'s particular quality of light — warm and directional, with a slight overexposure in the highlight areas — within a physically-based renderer that naturally tends toward verisimilitude.' },
        { type: 'image', src: 'assets/placeholder.svg', caption: 'Blender scene graph showing simplified geometry and light rig for Interior No. 3' }
      ]
    }
  ];

  const SEED_STATEMENT = {
    title: 'Artist Statement',
    body: [
      'My practice moves between drawing, digital tools, and installation — held together not by medium but by a persistent interest in what attention does to a surface, and what surfaces do to attention.',
      'I am drawn to acts of accumulation and the aesthetics of duration: work that carries the visible trace of time spent, whether that time is manifest in graphite marks, code iterations, or hours of fabrication. Precision and labour are not ends in themselves but strategies for arriving at images that resist quick reading.',
      'Across all of the work, I am interested in the line between legibility and illegibility — the moment a system of marks tips from comprehensible to overwhelming, from document to texture. This threshold is where I tend to work.'
    ]
  };

  const SEED_CONTACT = {
    email: 'studio@peteyiwen.com',
    instagram: '@peteyiwen',
    representation: 'Represented by Gallery Name, City',
    inquiries: 'For studio visits, commissions, or exhibition inquiries, please reach out by email. Response time is typically 3–5 working days.'
  };

  /* ── Private state ── */
  let _artworks = null;
  let _statement = null;
  let _contact = null;

  /* ── Load / save ── */
  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      _artworks = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(SEED_ARTWORKS));
    } catch (e) {
      _artworks = JSON.parse(JSON.stringify(SEED_ARTWORKS));
    }
    try {
      const rawS = localStorage.getItem(STATEMENT_KEY);
      _statement = rawS ? JSON.parse(rawS) : JSON.parse(JSON.stringify(SEED_STATEMENT));
    } catch (e) {
      _statement = JSON.parse(JSON.stringify(SEED_STATEMENT));
    }
    try {
      const rawC = localStorage.getItem(CONTACT_KEY);
      _contact = rawC ? JSON.parse(rawC) : JSON.parse(JSON.stringify(SEED_CONTACT));
    } catch (e) {
      _contact = JSON.parse(JSON.stringify(SEED_CONTACT));
    }
  }

  function saveArtworks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(_artworks)); } catch (e) { console.warn('localStorage unavailable', e); }
  }

  function saveStatement() {
    try { localStorage.setItem(STATEMENT_KEY, JSON.stringify(_statement)); } catch (e) {}
  }

  function saveContact() {
    try { localStorage.setItem(CONTACT_KEY, JSON.stringify(_contact)); } catch (e) {}
  }

  function resetToSeed() {
    _artworks  = JSON.parse(JSON.stringify(SEED_ARTWORKS));
    _statement = JSON.parse(JSON.stringify(SEED_STATEMENT));
    _contact   = JSON.parse(JSON.stringify(SEED_CONTACT));
    saveArtworks(); saveStatement(); saveContact();
  }

  /* ── Artwork CRUD ── */
  function getAllArtworks() { return _artworks.slice(); }

  function getArtwork(id) { return _artworks.find(a => a.id === id) || null; }

  function getFiltered({ category = null, subcategory = null } = {}) {
    return _artworks.filter(a => {
      if (category && a.category !== category) return false;
      if (subcategory && a.subcategory !== subcategory) return false;
      return true;
    });
  }

  function addArtwork(partial = {}) {
    const id = 'artwork-' + Date.now();
    const artwork = {
      id,
      category: partial.category || 'illustrations',
      subcategory: partial.subcategory || null,
      title: partial.title || 'Untitled',
      year: partial.year || new Date().getFullYear().toString(),
      size: partial.size || '',
      materials: partial.materials || '',
      description: partial.description || '',
      images: partial.images || [{ src: 'assets/placeholder.svg', alt: '', altStatus: 'draft' }],
      process: partial.process || []
    };
    _artworks.unshift(artwork);
    saveArtworks();
    return artwork;
  }

  function updateArtwork(id, changes) {
    const idx = _artworks.findIndex(a => a.id === id);
    if (idx === -1) return null;
    _artworks[idx] = Object.assign({}, _artworks[idx], changes);
    saveArtworks();
    return _artworks[idx];
  }

  function deleteArtwork(id) {
    _artworks = _artworks.filter(a => a.id !== id);
    saveArtworks();
  }

  function updateImage(artworkId, imageIndex, changes) {
    const artwork = getArtwork(artworkId);
    if (!artwork) return;
    artwork.images[imageIndex] = Object.assign({}, artwork.images[imageIndex], changes);
    updateArtwork(artworkId, { images: artwork.images });
  }

  function addImage(artworkId, imageObj) {
    const artwork = getArtwork(artworkId);
    if (!artwork || artwork.images.length >= 10) return false;
    artwork.images.push(imageObj);
    updateArtwork(artworkId, { images: artwork.images });
    return true;
  }

  function removeImage(artworkId, imageIndex) {
    const artwork = getArtwork(artworkId);
    if (!artwork) return;
    artwork.images.splice(imageIndex, 1);
    updateArtwork(artworkId, { images: artwork.images });
  }

  /* ── Statement / Contact ── */
  function getStatement() { return Object.assign({}, _statement); }
  function updateStatement(changes) { _statement = Object.assign({}, _statement, changes); saveStatement(); }

  function getContact() { return Object.assign({}, _contact); }
  function updateContact(changes) { _contact = Object.assign({}, _contact, changes); saveContact(); }

  /* ── Init ── */
  _load();

  return {
    getAllArtworks,
    getArtwork,
    getFiltered,
    addArtwork,
    updateArtwork,
    deleteArtwork,
    updateImage,
    addImage,
    removeImage,
    saveArtworks,
    getStatement,
    updateStatement,
    getContact,
    updateContact,
    resetToSeed
  };
}());
