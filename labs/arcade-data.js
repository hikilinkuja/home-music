/* dados do catalogo para os laboratorios; gerado a partir do e03 (nao editar a mao) */
const BLOCKS = {
  morning:   { label: "MORNING PROGRAMME",   range: "06:00 - 13:00", accent: "#ffb12b",
               genres: ["reggae","dub","ska_rocksteady","lofi","ambient","ambient_techno","dub_techno"] },
  afternoon: { label: "AFTERNOON PROGRAMME", range: "13:00 - 20:00", accent: "#41d9c8",
               genres: ["lofi_house","liquid","intelligent_dnb","atmospheric_jungle","breakbeat"] },
  night:     { label: "NIGHT PROGRAMME",     range: "20:00 - 06:00", accent: "#e8392c",
               genres: ["hypnotic_techno","deep_house","dub_techno","ragga_jungle","oldskool_hardcore","dubstep"] }
};
const GENRES = {
  reggae: { name: "Roots Reggae", w: "https://en.wikipedia.org/wiki/Roots_reggae", note: "Kingston, the eternal downbeat. Roots reggae is church for people whose church has a bassline: one drop drums, bubbling organ, singers testifying about Babylon while the sun climbs. Island Records sold it to the world in the seventies; the world has been trying to slow down to it ever since. Morning coffee was never more righteous." },
  dub: { name: "Dub", w: "https://en.wikipedia.org/wiki/Dub_music", note: "Dub is the song taken apart and reassembled as weather. Around 1973 King Tubby and Lee Perry discovered the mixing desk was an instrument: drop the vocal, drown the drums in echo, let the bass walk around the room like it pays rent. Every remix in existence descends from these board rides. Breathe in the smoke." },
  lofi: { name: "Lo-fi Beats", w: "https://en.wikipedia.org/wiki/Lofi_hip-hop", note: "The beat tape as comfort food. Dilla taught the drums to limp, Nujabes taught them to pray, and twenty years of bedroom producers taught them to loop forever under rain sounds and anime stills. The hiss is the point, the wobble is the point, your homework is optional. This is music that holds your hand." },
  ambient: { name: "Ambient", w: "https://en.wikipedia.org/wiki/Ambient_music", note: "Music to disappear into. Eno named it in an airport, Japan perfected it in the bubble years, Aphex made it weep. No drums to chase, no chorus to wait for, just air pressure arranged beautifully. Let it run while the kettle does its thing. If you think nothing is happening, listen closer: everything is." },
  ambient_techno: { name: "Ambient Techno", w: "https://en.wikipedia.org/wiki/Ambient_techno", note: "Early nineties Britain: the rave is over, the sun is rising, and nobody wants the machines to stop. So the machines learn to whisper. Warp called it electronic listening music; bedrooms called it coming down safely. 303s floating in reverb, breakbeats wrapped in cotton. The dancefloor, remembered from your sofa." },
  lofi_house: { name: "Lo-fi House", w: "https://en.wikipedia.org/wiki/Lo-fi_house", note: "House music filmed on VHS. Mid 2010s: producers run their drum machines through tape mud, name themselves after sitcoms, and upload it all with one weird thumbnail. The YouTube algorithm falls in love. Underneath the hiss it is pure longing, pianos and pitched vocals asking if 1992 can come back. It can't. Press play anyway." },
  liquid: { name: "Liquid Drum & Bass", w: "https://en.wikipedia.org/wiki/Liquid_drum_and_bass", note: "Drum and bass after a hot shower. The breaks still sprint at 170 but everything on top is silk: seventh chords, soul vocals, basslines that glide instead of bite. Bukem drew the blueprint, Fabio named it liquid funk, and whole record shops smelled of incense for a decade. Rolling, always rolling." },
  intelligent_dnb: { name: "Intelligent Drum & Bass", w: "https://en.wikipedia.org/wiki/Drum_and_bass", note: "The mid-nineties moment when jungle put on headphones and got cosmic. It shed the ragga shouts, kept the breaks, added Detroit chords and whale-song pads. The name was always a bit much; the music mostly earned it. Metalheadz and Good Looking ran the school, and the homework was atmosphere." },
  atmospheric_jungle: { name: "Atmospheric Jungle", w: "https://en.wikipedia.org/wiki/Jungle_music", note: "Jungle with its eyes closed. The Amen break still tears through the mix, but above it: oceans, choirs, synth pads the size of weather systems. Made for the 4am drive home while the rave still rings in your coat. Good Looking and Moving Shadow pressed the classics; the sunrise did the mastering." },
  breakbeat: { name: "Breakbeat", w: "https://en.wikipedia.org/wiki/Breakbeat", note: "The straight kick is a tyranny and breakbeat never signed up. Funk drummers chopped into new shapes, basslines with a smirk, the sound of Britain discovering sampling and immediately misbehaving. From chill-out tents to car chases, it swaggers where house merely walks. All breaks, no brakes." },
  hypnotic_techno: { name: "Hypnotic Techno", w: "https://en.wikipedia.org/wiki/Minimal_techno", note: "Techno stripped to pulse and intent. Detroit minimal, Berlin dub, one loop examined under laboratory light until it starts to breathe. Nothing drops; everything deepens. Night-shift music: for driving, for coding, for staring at the city feeling like the main character. Trust the loop." },
  deep_house: { name: "Deep House", w: "https://en.wikipedia.org/wiki/Deep_house", note: "Chicago, after hours. Larry Heard put jazz chords inside a drum machine in 1986 and accidentally invented introspection at 120 BPM. Deep house is slow-burning, warm-blooded, slightly melancholy, the sound of a room where everyone dances facing inward. Lights low, drinks sweating, feelings imminent." },
  ragga_jungle: { name: "Ragga Jungle", w: "https://en.wikipedia.org/wiki/Jungle_music", note: "1994, London pirate radio, air-raid sirens. Jungle splices dancehall vocals onto double-time Amen breaks and the city loses its mind. MCs chat over telephone noises, rewinds every thirty seconds, moral panic in the tabloids, pure joy in the dance. The most energy ever pressed to vinyl. Brace." },
  dubstep: { name: "Dubstep", w: "https://en.wikipedia.org/wiki/Dubstep", note: "South London, early 2000s: garage slowed down, hollowed out, and sent to the basement. Croydon record shops, FWD at Plastic People, sub-bass you feel in your sternum before you hear it. Space is the instrument; the silence between the hits is where the dread lives. Meditate at 140." },
  dub_techno: { name: "Dub Techno", w: "https://en.wikipedia.org/wiki/Dub_techno", note: "Berlin hears King Tubby through a concrete wall. Basic Channel, 1993: two engineers press techno until only the echo remains, chords surfacing like weather fronts, hiss as holy as the kick. Every record sounds like the same gray ocean and that is the discipline. Detroit gave it pulse, Jamaica gave it space, Berlin gave it patience." },
  oldskool_hardcore: { name: "Oldskool Hardcore", w: "https://en.wikipedia.org/wiki/Breakbeat_hardcore", note: "Britain 1992, a generation discovers the pitch control. Breakbeats sped past reason, pianos stabbing at heaven, toytown samples and air horns, all mixed on a borrowed Amiga. The tabloids panicked, the fields filled, and for about thirty months every record sounded like the best night of your life. Jungle was being born in here. Hold tight." },
  ska_rocksteady: { name: "Ska & Rocksteady", w: "https://en.wikipedia.org/wiki/Rocksteady", note: "Kingston before the bass slowed the world down. Ska walks fast on the offbeat, horns gleaming, Studio One in its sunday best; then the hot summer of 1966 cools the tempo and rocksteady arrives, basslines suddenly singing, rude boys suddenly sentimental. Two or three golden years that every reggae record since has been quoting. The original good mood." }
};
const TRACKS = [
  /* ---- morning : reggae ---- */
  { g:"reggae", a:"Bob Marley & The Wailers", t:"Natural Mystic", y:1977, v:"2U91ELKMNlE", s:"https://open.spotify.com/track/2QRq65qC4nVZ0NTmtc0IYO", w:"https://en.wikipedia.org/wiki/Natural_Mystic",
    b:"It fades in like it was always playing somewhere and you only now tuned in. Opens Exodus, the album Time magazine named best of the 20th century; Greil Marcus called this its finest song." },
  { g:"reggae", a:"Burning Spear", t:"Marcus Garvey", y:1975, v:"FROI6bS5Nvg", s:"https://open.spotify.com/track/0z69RArvZ1pPBRrkmPKDmW", w:"https://en.wikipedia.org/wiki/Marcus_Garvey_(album)",
    b:"History class called to order over strutting horns. Spear's first recording with producer Jack Ruby, backed by the Black Disciples with Robbie Shakespeare on bass; meant as a sound-system exclusive, it became an instant hit." },
  { g:"reggae", a:"Horace Andy", t:"Skylarking", y:1972, v:"hLUm-mU7bN0", s:"https://open.spotify.com/track/6RFSlrSkBhdLB0C2XoIFqf", w:"https://en.wikipedia.org/wiki/Skylarking_%28Horace_Andy_album%29",
    b:"A voice that flutters like curtains in an open window, singing about idling your day away. Cut at Studio One for Coxsone Dodd, it topped the Jamaican chart and named Andy's debut album. Obey it." },
  { g:"reggae", a:"The Congos", t:"Fisherman", y:1977, v:"mFTxmDy74LI", s:"https://open.spotify.com/track/00m6N23ZTNEtsg65N1WcDV", w:"https://en.wikipedia.org/wiki/Heart_of_the_Congos",
    b:"The most haunted vocal blend Lee Perry ever caught at the Black Ark, opening Heart of the Congos. The original Jamaican pressing reportedly ran to a few hundred copies; the world caught up decades later." },
  { g:"reggae", a:"Gregory Isaacs", t:"Night Nurse", y:1982, v:"k7A6Ugs0NFw", s:"https://open.spotify.com/track/7HfpyMo4GIIkVUBZrrbtwm", w:"https://en.wikipedia.org/wiki/Night_Nurse_(Gregory_Isaacs_song)",
    b:"The Cool Ruler writing a love song disguised as a medical emergency, with the Roots Radics behind him and Wally Badarou on synth. Britain later borrowed it to advertise actual cold medicine. The song survived." },

  /* ---- morning : dub ---- */
  { g:"dub", a:"Augustus Pablo", t:"King Tubbys Meets Rockers Uptown", y:1976, v:"ICBcCDPWocg", s:"https://open.spotify.com/track/0Mx3BZtH58ASK4XFg9TKWB", w:"https://en.wikipedia.org/wiki/King_Tubby_Meets_Rockers_Uptown_%28song%29",
    b:"Jacob Miller's 'Baby I Love You So' dismantled at Tubby's desk until only bass, smoke and melodica remain. Rolling Stone ranks it among the 500 greatest songs ever recorded, which for a dub B-side is a coup." },
  { g:"dub", a:"Lee \"Scratch\" Perry & The Upsetters", t:"Disco Devil", y:1977, v:"vjC2WT7VOyE", s:"https://open.spotify.com/track/6vX22fwRmM4bI0WpWtAvuJ", w:null,
    b:"Scratch drags Max Romeo's 'Chase the Devil' back through the Black Ark, adds three backing singers and mostly new lyrics, and taunts the devil for seven minutes. Decades on, it soundtracks a radio station inside Grand Theft Auto V." },
  { g:"dub", a:"Scientist", t:"Dance of the Vampires", y:1981, v:"iCpPaTeL2BE", s:"https://open.spotify.com/track/3y3aIscR4N87VEtlUFYxyB", w:"https://en.wikipedia.org/wiki/Scientist_Rids_the_World_of_the_Evil_Curse_of_the_Vampires",
    b:"A dub of Michael Prophet's 'You Are a No Good', rhythms by the Roots Radics at Channel One. The sleeve claims the album was mixed at King Tubby's at midnight on Friday 13 June 1981. The echo does the biting." },
  { g:"dub", a:"King Tubby & The Aggrovators", t:"Dub Fi Gwan", y:1977, v:"qu3RXnGFQa8", s:"https://open.spotify.com/track/2F5xURcnbtkzmeIwRhcc3I", w:null,
    b:"Bunny Lee production, 1977, riding the 'Keep On Moving' rhythm: Tubby strips the riddim to its skeleton and makes the skeleton skank. Later canonized on Blood and Fire's Dub Gone Crazy collection." },

  /* ---- morning : lofi ---- */
  { g:"lofi", a:"Nujabes", t:"Feather", y:2005, v:"hQ5x8pHoIPA", s:"https://open.spotify.com/track/2s6J8fjaiJRhZJ1eZIeBDt", w:"https://en.wikipedia.org/wiki/Modal_Soul",
    b:"The opener of Modal Soul, on his own Hydeout label, with Cise Starr and Akin of CYNE floating over a piano hook lifted from Yusef Lateef. They call Nujabes the godfather of lo-fi hip hop; this is the sermon." },
  { g:"lofi", a:"J Dilla", t:"Time: The Donut of the Heart", y:2006, v:"0vmhgotEByc", s:"https://open.spotify.com/track/7oeWitA7Lu8O76NrmhfgZ8", w:"https://en.wikipedia.org/wiki/Donuts_(album)",
    b:"The Jackson 5 slowed to half speed until sweetness becomes ache. Donuts came out on Dilla's 32nd birthday, 7 February 2006; he left three days later. The beat tape as last testament." },
  { g:"lofi", a:"jinsang", t:"affection.", y:2016, v:"LbHsWjX9dv4", s:"https://open.spotify.com/track/7MdZQXUBijQxcBkYz4G1Z5", w:null,
    b:"Track 16 of life., 25 beats the Californian says he made between his last year of high school and now, built from dusty soul and jazz records. The study-beats universe in its purest, kindest form." },
  { g:"lofi", a:"idealism", t:"controlla", y:2016, v:"DB0QHC3c0_Q", s:"https://open.spotify.com/track/1FlY15vdP570PJucy6JdYm", w:null,
    b:"A Finnish bedroom reworking of the Drake hit of the same name, from the rainy evening EP, quietly racking up tens of millions of streams. Tape hiss like weather on the glass; melancholy you can file paperwork to." },

  /* ---- morning : ambient ---- */
  { g:"ambient", a:"Brian Eno", t:"1/1", y:1978, v:"LKZ3fGR2SDY", s:"https://open.spotify.com/track/3bCmDqflFBHijgJfvtqev5", w:"https://en.wikipedia.org/wiki/Ambient_1:_Music_for_Airports",
    b:"The opening side of Music for Airports, grown from two pianists improvising without quite hearing each other; that is Robert Wyatt at the piano. Pitchfork calls the album the greatest ambient record ever made. Board nothing." },
  { g:"ambient", a:"Aphex Twin", t:"Rhubarb", y:1994, v:"75O11W5EZAU", s:"https://open.spotify.com/track/3QIpnNYnUMe1lrr5LJTStk", w:"https://en.wikipedia.org/wiki/Selected_Ambient_Works_Volume_II",
    b:"Officially an untitled track on Selected Ambient Works Volume II; 'Rhubarb' is the name fans gave the saddest, kindest synthesizer ever recorded. Thirty years on he rescored it for orchestra, which proves he knew." },
  { g:"ambient", a:"Hiroshi Yoshimura", t:"Blink", y:1982, v:"aUCiqA4YyH4", s:"https://open.spotify.com/track/7t3VZQzCG5IW3PHRHT6Tip", w:"https://en.wikipedia.org/wiki/Music_for_Nine_Post_Cards",
    b:"From Music for Nine Post Cards, home-recorded on keyboard and Fender Rhodes: notes placed like stones in a garden. Forgotten for decades, then resurrected when the YouTube algorithm fell for Japanese ambient in 2017." },
  { g:"ambient", a:"Biosphere", t:"Poa Alpina", y:1997, v:"xc7atbM0k6g", s:"https://open.spotify.com/track/4K4kedXFAuW6gn8iwgGFTw", w:"https://en.wikipedia.org/wiki/Substrata_(album)",
    b:"Named after an arctic grass, from Substrata, Geir Jenssen's nearly beatless album of cold electronics and stray acoustic guitar. Sounds like standing in tundra wind wearing a very good coat." },

  /* ---- morning : ambient techno ---- */
  { g:"ambient_techno", a:"Aphex Twin", t:"Xtal", y:1992, v:"sWcLccMuCA8", s:"https://open.spotify.com/track/5neBqQFKrcfL6CpifYu8b4", w:"https://en.wikipedia.org/wiki/Selected_Ambient_Works_85%E2%80%9392",
    b:"The first track of Selected Ambient Works 85-92, the record Fact later named the greatest album of the nineties. A sampled choir sighs, a beat tiptoes, and an entire genre grows up inside one bedroom." },
  { g:"ambient_techno", a:"The Orb", t:"Little Fluffy Clouds", y:1990, v:"KNfjpmvbQG0", s:"https://open.spotify.com/track/1ROWnbzI8CFYDuZR2dF30k", w:"https://en.wikipedia.org/wiki/Little_Fluffy_Clouds",
    b:"Rickie Lee Jones describes Arizona skies; The Orb builds a hot-air balloon around her from Steve Reich and Harry Nilsson's drummer. Reich noticed and asked for a cut of the publishing. Sampling as landscape painting." },
  { g:"ambient_techno", a:"Global Communication", t:"14 31", y:1994, v:"SlxTlBPvJD8", s:"https://open.spotify.com/track/0GU7HXMGewpD83cGv6a5YH", w:"https://en.wikipedia.org/wiki/76:14",
    b:"A clock ticking inside heaven. Every title on 76:14 is just its running time, and The Guardian called the album an unfathomably beautiful out-of-time masterpiece. Tom Middleton and Mark Pritchard, gentlemen." },
  { g:"ambient_techno", a:"B12", t:"Soundtrack of Space", y:1993, v:"myE-khYL6iM", s:null, w:"https://en.wikipedia.org/wiki/Electro-Soma",
    b:"The opener of Electro-Soma, fourth release in Warp's Artificial Intelligence series alongside Aphex, Autechre and Speedy J: techno built for the chair, not the floor. B12 drift among satellites." },

  /* ---- afternoon : lofi house ---- */
  { g:"lofi_house", a:"DJ Boring", t:"Winona", y:2016, v:"SrMcYg17D2I", s:"https://open.spotify.com/track/3ilkEyg6OCtd9qCnOJkPzU", w:null,
    b:"Built entirely in the box by a producer with no studio, around a sampled interview where Winona Ryder recalls being told she was not pretty enough for acting. Uploaded late 2016; the algorithm never recovered." },
  { g:"lofi_house", a:"Mall Grab", t:"Guap", y:2015, v:"QE_Vi0EQpHA", s:"https://open.spotify.com/track/5FHFQT1NffiTNocI4dhK0h", w:null,
    b:"From Feel U, Mall Grab's debut on Collect-Call, which promptly sold out; drums caked in beautiful mud, joy unbothered. Yaeji loved it enough to cover it on her first EP." },
  { g:"lofi_house", a:"Ross From Friends", t:"Talk To Me You'll Understand", y:2015, v:"8tKKNV5sXUs", s:"https://open.spotify.com/track/4Z4i631BesV0P6LTvfLAdL", w:null,
    b:"Japanese city pop (Hi-Fi Set) spliced with Dru Hill, pushed through fog until it becomes a hook. Pitchfork noted the recommendation algorithm cannot stop serving it, as if haze were a ranking signal." },
  { g:"lofi_house", a:"DJ Seinfeld", t:"U", y:2017, v:"VmK9oHGVRVw", s:"https://open.spotify.com/track/2tYctbOGPK2OZ2g2wKipgj", w:null,
    b:"From Time Spent Away From U, an album described as an extended post-heartbreak love letter delivered via the dancefloor. Pitchfork heard Bruce Hornsby through the world's saddest, drunkest jukebox. Exactly." },
  { g:"lofi_house", a:"Baltra", t:"Fade Away", y:2016, v:"4FyTx_yeHXo", s:"https://open.spotify.com/track/5KkRMv91vbi3rJ44HDpeih", w:null,
    b:"The vocal dissolves exactly as advertised. Released on 96 and Forever in 2016, it went internet-sensation sized on YouTube and SoundCloud and started pulling Baltra across the Atlantic to play shows." },

  /* ---- afternoon : liquid ---- */
  { g:"liquid", a:"LTJ Bukem", t:"Horizons", y:1995, v:"Y4jhRqh9XFg", s:null, w:"https://en.wikipedia.org/wiki/Logical_Progression",
    b:"Dawn poured over drum and bass: the melody borrowed from Lemon Sol's 'Sunflash', the spoken words from Maya Angelou's 1993 inauguration poem. Bukem's most celebrated record, and liquid's founding document." },
  { g:"liquid", a:"High Contrast", t:"If We Ever", y:2007, v:"Pz1W1OLkw14", s:"https://open.spotify.com/track/6HhdFRM9un1Ojpz1A98pVi", w:null,
    b:"Hospital Records at full gallop: disco strings at 170 with Diane Charlemagne, the voice of Inner City Life, carrying the hook. Hands in the air, for people who read liner notes." },
  { g:"liquid", a:"Netsky", t:"Memory Lane", y:2010, v:"cG7cRDcPY3k", s:"https://open.spotify.com/track/2A9jHLZ1sXrfAKcItrdO8Y", w:null,
    b:"A Belgian teenager who had been sending Hospital demos over instant messenger finally gets his first release on the label, and it is the warmest anthem liquid ever allowed itself. Resistance is pointless; roll with it." },
  { g:"liquid", a:"Seba", t:"Painted Skies", y:2010, v:"kROLuASuuKM", s:"https://open.spotify.com/track/5JpeCgMkmBKIV1Y93EUf2G", w:null,
    b:"Stockholm serenity at 170 on Seba's own Secret Operations label, paired with a Kirsty Hawkshaw collaboration. He came up on Bukem's Good Looking in 1996 and never lost the glow. Pads like weather fronts." },

  /* ---- afternoon : intelligent dnb ---- */
  { g:"intelligent_dnb", a:"PFM", t:"One & Only", y:1995, v:"AsRoKnr-Rxg", s:"https://open.spotify.com/track/4n8BqyKlGtuoO4b2HXTEpS", w:"https://en.wikipedia.org/wiki/Logical_Progression",
    b:"Looking Good Records, 1995, a vocal warm enough to make junglists blush; later enshrined on Bukem's landmark Logical Progression compilation. The year drum and bass decided tenderness could roll too." },
  { g:"intelligent_dnb", a:"Goldie", t:"Inner City Life", y:1994, v:"i-P98B2skts", s:"https://open.spotify.com/track/4qw7xhiy8rWGDeffgSj7Ez", w:"https://en.wikipedia.org/wiki/Inner_City_Life",
    b:"Diane Charlemagne turns the breakbeat into an aria over a sampled Ike Turner drum groove. The first single from Timeless; NME ranked it among the best songs of 1994, and it has refused to age since." },
  { g:"intelligent_dnb", a:"Alex Reece", t:"Pulp Fiction", y:1995, v:"P1_n_9RVnrk", s:"https://open.spotify.com/track/6rdX0la76j3RGwtZ3id80o", w:null,
    b:"That bassline, plus a trumpet lifted from Coolio and bass from MC Solaar. It was untitled until Fabio, a Tarantino fan, named it; Goldie heard him play it and took it straight to Metalheadz. The two-step blueprint." },
  { g:"intelligent_dnb", a:"Photek", t:"Ni Ten Ichi Ryu", y:1997, v:"UBPPO2t1C2Q", s:null, w:null,
    b:"The title is Musashi's two-swords technique, and the track honours it: surgical breaks, ice-water atmosphere, not one sound wasted. AllMusic heard the minimalistic paranoia of a kung-fu sword fight. Irresistible, they said." },

  /* ---- afternoon : atmospheric jungle ---- */
  { g:"atmospheric_jungle", a:"LTJ Bukem", t:"Music", y:1993, v:"m1IvkYFCdV4", s:null, w:"https://en.wikipedia.org/wiki/Logical_Progression",
    b:"Subtitled Happy Raw on its 1993 Good Looking pressing: ocean pads and a break like rain on glass, the soulful alternative to hardcore's sturm und drang. The genre's gentlest manifesto." },
  { g:"atmospheric_jungle", a:"Foul Play", t:"Being With You (Foul Play Remix)", y:1994, v:"xbhWi6if9Eo", s:"https://open.spotify.com/track/6STgT3r9g6YO7ClzswJHdi", w:null,
    b:"Foul Play remix themselves into heaven on a Moving Shadow ten-inch: the original's Mary J. Blige and Ryuichi Sakamoto samples sublimated into diva ghosts and sub-bass undertow. 1994, lit in amber." },
  { g:"atmospheric_jungle", a:"Peshay", t:"Piano Tune", y:1994, v:"3865VN7RGcY", s:null, w:null,
    b:"A piano line falling through the Amen break and Lyn Collins's 'Think' like light through blinds. Good Looking, 1994; peers and press still cite it as one of the most influential early atmospheric sides." },
  { g:"atmospheric_jungle", a:"Essence of Aura", t:"So This Is Love", y:1995, v:"lAdIz0HgfQw", s:"https://open.spotify.com/track/2QPUOQEyuJzJ7RsUJUGy8u", w:null,
    b:"Moving Shadow, July 1995, with the title question sampled from Cinderella herself, Ilene Woods. Rolling breaks, strings, and the answer is obviously yes." },

  /* ---- afternoon : breakbeat ---- */
  { g:"breakbeat", a:"The Future Sound of London", t:"Papua New Guinea", y:1991, v:"wfWMv8Y1V5E", s:"https://open.spotify.com/track/0xU0sRzX4liMDli3ktdDR4", w:"https://en.wikipedia.org/wiki/Papua_New_Guinea_(song)",
    b:"Lisa Gerrard's voice, borrowed from Dead Can Dance, lifted into a breakbeat sunrise over a Meat Beat Manifesto bassline. UK top 30 in 1992: the moment rave realized it could be beautiful and illegal at once." },
  { g:"breakbeat", a:"Hybrid", t:"Finished Symphony", y:1999, v:"vuWAO9QSG2Y", s:"https://open.spotify.com/track/3JF1AViQOMDH3zoO0aBhl2", w:"https://en.wikipedia.org/wiki/Finished_Symphony",
    b:"Welsh breakbeats flown over the Russian Federal Orchestra, with a Gorecki motif folded in. Melodrama with a laminated flight case, and it still soars." },
  { g:"breakbeat", a:"The Chemical Brothers", t:"Star Guitar", y:2002, v:"cbOhvzVOaJA", s:"https://open.spotify.com/track/7nBE8CCq6CpMUxfhODQApq", w:"https://en.wikipedia.org/wiki/Star_Guitar",
    b:"The acoustic flicker of Bowie's 'Starman' turned into a UK number 8. Watch Michel Gondry's video, one continuous shot from a train window where the landscape plays the drums, and journeys never un-sync again." },
  { g:"breakbeat", a:"Propellerheads", t:"Spybreak!", y:1997, v:"rgtf61Gw4u8", s:"https://open.spotify.com/track/5HWR5bZ3SBN6zA6zHJS3Y6", w:"https://en.wikipedia.org/wiki/Spybreak!",
    b:"A heist score waiting for its heist: it grazed the UK Top 40 in 1997, then The Matrix borrowed it for the lobby shootout and settled the matter. Horns, breaks, swagger." },

  /* ---- night : hypnotic techno ---- */
  { g:"hypnotic_techno", a:"Jeff Mills", t:"The Bells", y:1996, v:"S340RiB4kWs", s:"https://open.spotify.com/track/0ISxyAhfop0MoMeAUw72RN", w:null,
    b:"Made in 1994, released on Purpose Maker in 1996; before that Mills played it from a custom-cut 13-inch no one else owned. He says it has appeared in every set he has played since. Three notes, one riot." },
  { g:"hypnotic_techno", a:"Plastikman", t:"Spastik", y:1993, v:"6TYsOMYaz6E", s:"https://open.spotify.com/track/5iYgociEUIfE5f5z84Xhi1", w:"https://en.wikipedia.org/wiki/Spastik",
    b:"Nine minutes of Roland 808 percussion whipped into vertigo; the credits thank 'Rob And His Beagle'. Mixmag readers voted it the seventh greatest dance record ever. Rhythm as hypnosis, certified." },
  { g:"hypnotic_techno", a:"Basic Channel", t:"Phylyps Trak", y:1993, v:"RmQ8xGELTX4", s:"https://open.spotify.com/track/4KsL7ddeairY2OMs8OFRSR", w:null,
    b:"Berlin runs Detroit through a chain of smoke: BC 02, October 1993, its first pressing recorded live in a Potsdam washhouse, mixed hands-on-faders like deep Jamaican dub. Weather systems courting." },
  { g:"hypnotic_techno", a:"Robert Hood", t:"Minus", y:1994, v:"_K-LwhsoGhU", s:"https://open.spotify.com/track/0YLEO6hUj8uO3RrJTHMPkD", w:"https://en.wikipedia.org/wiki/Internal_Empire",
    b:"From Internal Empire on Tresor, cut at Hood's M-Plant studio in Detroit: one idea, perfectly machined, driven at night speed. Richie Hawtin later named his Minus label after this track. Less, used as a weapon." },

  /* ---- night : deep house ---- */
  { g:"deep_house", a:"Mr. Fingers", t:"Can You Feel It", y:1986, v:"1N9Wnqz8Rh8", s:"https://open.spotify.com/track/366NZufdu1fOK0MsIxvwS9", w:"https://en.wikipedia.org/wiki/Can_You_Feel_It_(Larry_Heard_song)",
    b:"Larry Heard, a Juno-60 and a 909, recorded in one pass between two cassette decks; Chicago DJs preached Martin Luther King over the top. Deep house begins here, and the question remains rhetorical." },
  { g:"deep_house", a:"Pépé Bradock", t:"Deep Burnt", y:1999, v:"lQHk5ET3kQU", s:null, w:null,
    b:"A French B-side that outlived every A-side of its year, looping Freddie Hubbard's 'Little Sunflower' into a slow-motion embrace. Bradock himself calls it cubism for ravers." },
  { g:"deep_house", a:"Kerri Chandler", t:"Bar A Thym", y:2005, v:"hNr8RgWl4eM", s:"https://open.spotify.com/track/6ZfF8Yn9qgfAekLIXnLpav", w:null,
    b:"NRK, 2005: thudding kicks, tick-tock hats and one ever-climbing synth riff, pure voltage under strobe light. Mixmag files it among the essential Kerri Chandler productions, which is a crowded shelf." },
  { g:"deep_house", a:"Moodymann", t:"I Can't Kick This Feeling When It Hits", y:1996, v:"0KrFelB-0Hw", s:null, w:null,
    b:"Chic's 'I Want Your Love' lifted into Detroit dusk on KDJ number six, later gathered onto Silentintroduction. Kenny Dixon Jr. smokes the edges off disco, and the feeling, famously, cannot be kicked." },
  { g:"deep_house", a:"Larry Heard presents Mr. White", t:"The Sun Can't Compare", y:2006, v:"tdIQTEYXDP4", s:"https://open.spotify.com/track/4ATWRf0Pu5E8oAXCJUBvAe", w:null,
    b:"Heard again, twenty years after Can You Feel It, with Mr. White's voice over eight minutes Resident Advisor called mesmerizing, emotional acid house. Neon on wet asphalt; night-drive scripture." },

  /* ---- night : ragga jungle ---- */
  { g:"ragga_jungle", a:"Shy FX & UK Apachi", t:"Original Nuttah", y:1994, v:"7VfWmeBo0vs", s:"https://open.spotify.com/track/74V4K9dL0gxWe0F6BOBAyK", w:"https://en.wikipedia.org/wiki/Original_Nuttah",
    b:"Recorded in two takes over Shy FX's 'Gangsta Kid', opening with a Goodfellas sample, and one of the first jungle tunes to crack the UK top 40. London, 1994: a city boiling over with joy." },
  { g:"ragga_jungle", a:"M-Beat feat. General Levy", t:"Incredible", y:1994, v:"GDwNn8bJ2CQ", s:"https://open.spotify.com/track/6jJbVZ3yHb4vZwJgQyTOa3", w:"https://en.wikipedia.org/wiki/Incredible_(M-Beat_song)",
    b:"The first jungle record to reach the UK top ten, gold-certified, Levy's chat adapted from his own 'Wickedest General'. The crossover that scandalized the scene and converted everyone else. Booyaka." },
  { g:"ragga_jungle", a:"Conquering Lion", t:"Code Red", y:1994, v:"bo_T4yg80vg", s:"https://open.spotify.com/track/0fTHMT2hHppGd9Qer2yb3V", w:null,
    b:"Conquering Lion is Rebel MC, the future Congo Natty, with dancehall royalty Super Cat on the mic; Island's Mango label picked it up for major release. Rewind culture in its natural habitat." },
  { g:"ragga_jungle", a:"Remarc", t:"R.I.P.", y:1994, v:"9-r4DYlvV5Q", s:"https://open.spotify.com/track/1SHNtEYq8rz1MnCpAQVHnP", w:null,
    b:"Remarc chops the Amen like it owes him money, with a Gregory Isaacs vocal lifted for the hook. Suburban Base pressed it; Planet Mu later collected it on Sound Murderer. Violence has rarely been this grinnable." },

  /* ---- night : dubstep ---- */
  { g:"dubstep", a:"Skream", t:"Midnight Request Line", y:2005, v:"lcMAbnZy8l8", s:"https://open.spotify.com/track/6saiu3uHwIpzPl8GKtRRNR", w:null,
    b:"Tempa, Halloween 2005: the Croydon teenager's tune the LA Times later called dubstep's most recognizable crossover hit, with a key change The Wire compared to Derrick May. The request line is still open." },
  { g:"dubstep", a:"Burial", t:"Archangel", y:2007, v:"c7jP-vich30", s:"https://open.spotify.com/track/1aaIYTqoRDzRUilU2Q6vTe", w:"https://en.wikipedia.org/wiki/Untrue_(album)",
    b:"A Ray J vocal pitched until it grieves, leading Untrue on Hyperdub, November 2007: night buses, rain static, a whole decade's loneliness in one tune." },
  { g:"dubstep", a:"Digital Mystikz", t:"Anti War Dub", y:2006, v:"G9H3i0T1iN4", s:"https://open.spotify.com/track/2McvwBtG5WHCOsM2AHWXoZ", w:null,
    b:"DMZ 007, around two thousand copies pressed and never repressed, by Mala's own account. It slipped into Children of Men without making the soundtrack album. Meditation at war volume; it still stops rooms." },
  { g:"dubstep", a:"Benga & Coki", t:"Night", y:2008, v:"rNStVlJWy88", s:"https://open.spotify.com/track/0unwEQ4UFfqBOKhHgeTwVp", w:"https://en.wikipedia.org/wiki/Diary_of_an_Afro_Warrior",
    b:"The wobble heard round the world: a 2007 basement anthem that crossed into every genre's record bag, grazed the UK singles chart and sat top five on Pete Tong's dance chart into 2008." },

  /* ---- import lot 1 (approved 2026-10-03): dub and roots, ratings verified on Discogs ---- */
  { g:"dub", a:"King Tubby & The Aggrovators", t:"Dub Fi Gwan", y:1977, bpm:74, v:"qu3RXnGFQa8", s:null, w:"https://www.whosampled.com/King-Tubby/Dub-Fi-Gwan/",
    b:"Tubby riding the Keep On Moving riddim from the Bunny Lee stable, 1977. The 2018 seven-inch on 17 North Parade rates 4.65 on Discogs; WhoSampled maps the whole family tree. The board as instrument, lesson one." },
  { g:"reggae", a:"Max Romeo & The Upsetters", t:"Chase the Devil", y:1976, bpm:76, v:"5_U9wsBVvqU", s:null, w:"https://en.wikipedia.org/wiki/Chase_the_Devil",
    b:"From War Ina Babylon, Island 1976, Lee Perry at the Black Ark: 4.54 on Discogs across 1500 ratings. Sampled by The Prodigy for Out of Space and by Jay-Z and Kanye for Lucifer; Satan has been on the run for fifty years." },
  { g:"dub", a:"Yabby You", t:"Deliver Me From My Enemies", y:1977, bpm:72, v:"uVXlm4He6Mc", s:null, w:"https://en.wikipedia.org/wiki/Deliver_Me_From_My_Enemies",
    b:"The dub plate mix of the Grove Music title track, 1977, with Robbie Shakespeare and Sly Dunbar in the room: 4.58 on Discogs. Jesus Dread at the controls, conviction you can measure in hertz." },
  { g:"reggae", a:"Pablo Gad", t:"Blood Suckers", y:1979, bpm:76, v:"ISIWjpRquGA", s:null, w:null,
    b:"UK roots on Burning Sounds, 1979, from the album also known as Trafalgar Square: 4.52 on Discogs. London heaviness about Babylon's appetite; the bassline collects the debt." },
  { g:"dub", a:"Twinkle Brothers", t:"Never Get Burn", y:1998, bpm:70, v:"lka4awAnubo", s:null, w:null,
    b:"Norman Grant's Twinkle Music seven-inch, 1998, rated 4.92 on Discogs, the heaviest score in tonight's crate: steppers weight built for sound system use. Later than it sounds, exactly as heavy as it looks." },
  { g:"reggae", a:"Johnnie Clarke", t:"Young Rebel", y:1983, bpm:74, v:"Dmujamx8Hww", s:null, w:null,
    b:"Top Notch ten-inch, 1983, with Rebel's Dub on the flip: 4.59 on Discogs. The Bunny Lee school voice over a rockers drive, the last golden year before digital changed the rules." }
];
const GBPM = { reggae:76, dub:72, lofi:80, ambient:64, ambient_techno:112,
  lofi_house:118, liquid:174, intelligent_dnb:168, atmospheric_jungle:158,
  breakbeat:132, hypnotic_techno:132, deep_house:122, ragga_jungle:164, dubstep:140,
  dub_techno:118, oldskool_hardcore:150, ska_rocksteady:94 };
