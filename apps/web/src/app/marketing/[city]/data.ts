export interface CityData {
  name: string;
  state: string;
  population: string;
  headline: string;
  description: string;
  businessTypes: string[];
  localStats: {
    businesses: string;
    digitalAdSpend: string;
  };
  metaTitle: string;
  metaDescription: string;
  heroSubtitle: string;
  localContext: string;
}

export const CITIES: Record<string, CityData> = {
  sydney: {
    name: "Sydney",
    state: "NSW",
    population: "5.3 million",
    headline: "Dominate Sydney's Digital Landscape with AI-Powered Marketing",
    description:
      "Sydney is Australia's largest and most competitive market. From Surry Hills startups to CBD financial firms, businesses need smarter automation to cut through the noise and reach the right audience across every channel.",
    businessTypes: [
      "Financial Services",
      "Tech Startups",
      "Hospitality & Dining",
      "Real Estate Agencies",
      "Professional Services",
    ],
    localStats: {
      businesses: "200,000+ businesses",
      digitalAdSpend: "$2.1B annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Sydney Businesses | AdPilot",
    metaDescription:
      "AI-powered marketing automation built for Sydney businesses. Automate content, scheduling, and analytics across 9 platforms. Start free today.",
    heroSubtitle:
      "From the CBD to the Northern Beaches, automate your marketing across every platform and reach Sydney's 5.3 million consumers.",
    localContext:
      "Sydney's business ecosystem spans from the towering financial district in Martin Place to the creative agencies of Surry Hills and Chippendale. The harbour city's tech corridor along Pyrmont and Ultimo hosts hundreds of fast-growing startups. With fiercely competitive hospitality, real estate, and professional services sectors, Sydney businesses that leverage marketing automation gain a decisive edge in Australia's most lucrative market.",
  },
  melbourne: {
    name: "Melbourne",
    state: "VIC",
    population: "5.1 million",
    headline: "Melbourne Businesses Deserve Marketing as Creative as the City",
    description:
      "Melbourne's culture of creativity and innovation extends to its business landscape. From laneway cafes to fintech disruptors, the city rewards brands that stand out with authentic, well-timed content across every channel.",
    businessTypes: [
      "Hospitality & Coffee Culture",
      "Fintech & SaaS",
      "Arts & Entertainment",
      "Retail & Fashion",
      "Health & Wellness",
    ],
    localStats: {
      businesses: "180,000+ businesses",
      digitalAdSpend: "$1.8B annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Melbourne Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Melbourne businesses. Publish across 9 platforms, automate scheduling, and grow faster. Free plan available.",
    heroSubtitle:
      "Power your marketing across Melbourne's thriving business scene — from Fitzroy creatives to Southbank enterprises.",
    localContext:
      "Melbourne's reputation as Australia's cultural capital creates a unique marketing landscape where authenticity and creativity matter more than anywhere else. The city's legendary laneway bars, world-class coffee scene, and thriving arts precinct in Collingwood and Fitzroy set the tone for brands that need to feel genuine. Melbourne's growing fintech hub in the CBD and the booming health and wellness sector in the inner suburbs make it a hotbed for businesses ready to scale their digital presence with smart automation.",
  },
  brisbane: {
    name: "Brisbane",
    state: "QLD",
    population: "2.6 million",
    headline: "Scale Your Brisbane Business Before the 2032 Boom",
    description:
      "Brisbane is transforming fast. With the 2032 Olympics on the horizon and a massive infrastructure boom underway, the River City is attracting investment and talent at record pace. Get your marketing automation in place now.",
    businessTypes: [
      "Construction & Property",
      "Tourism & Experiences",
      "Technology & Innovation",
      "Education & Training",
      "Food & Beverage",
    ],
    localStats: {
      businesses: "120,000+ businesses",
      digitalAdSpend: "$850M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Brisbane Businesses | AdPilot",
    metaDescription:
      "Brisbane marketing automation powered by AI. Automate content across 9 platforms, smart scheduling, and analytics. Start your free trial.",
    heroSubtitle:
      "Ride Brisbane's growth wave with automated marketing that scales as fast as the River City.",
    localContext:
      "Brisbane is in the middle of its biggest transformation in decades. The 2032 Olympic Games are driving billions in infrastructure investment across Fortitude Valley, South Bank, and the greater metro area. The city's emerging tech hub at the Howard Smith Wharves precinct and Newstead's startup ecosystem are drawing founders from across Australia. With construction, tourism, and education sectors all expanding rapidly, Brisbane businesses that automate their marketing now will be positioned to capture the enormous growth ahead.",
  },
  perth: {
    name: "Perth",
    state: "WA",
    population: "2.1 million",
    headline: "Perth Businesses: Turn Isolation into Digital-First Advantage",
    description:
      "Perth's geographic isolation has made its businesses naturally digital-first. The mining capital's unique economy creates opportunities for brands that can reach audiences across vast distances with the right automation.",
    businessTypes: [
      "Mining & Resources",
      "FIFO Services",
      "Property & Development",
      "Agriculture & Export",
      "Professional Services",
    ],
    localStats: {
      businesses: "95,000+ businesses",
      digitalAdSpend: "$620M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Perth Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Perth and WA businesses. Reach audiences across vast distances with automated 9-platform publishing. Start free.",
    heroSubtitle:
      "From the Perth CBD to the Pilbara, automate your marketing to reach Western Australia's dispersed but lucrative market.",
    localContext:
      "Perth's economy is anchored by the mining and resources sector, with major players headquartered in the CBD and operations stretching across the Pilbara and Kimberley. This creates a unique marketing challenge — reaching FIFO workers, remote communities, and corporate decision-makers simultaneously. The city's growing startup scene around Spacecubed in the CBD and the thriving property market in suburbs like Subiaco and Fremantle mean Perth businesses need multi-channel automation that works across time zones and vast distances.",
  },
  adelaide: {
    name: "Adelaide",
    state: "SA",
    population: "1.4 million",
    headline: "Adelaide's Smartest Businesses Automate Their Marketing",
    description:
      "Adelaide punches above its weight in defense tech, wine tourism, and innovation. The Festival City's tight-knit business community means word-of-mouth matters — and automated social proof across every platform amplifies it.",
    businessTypes: [
      "Wine & Hospitality",
      "Defense & Aerospace",
      "Health & Medical Research",
      "Education & Universities",
      "Festival & Events",
    ],
    localStats: {
      businesses: "70,000+ businesses",
      digitalAdSpend: "$380M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Adelaide Businesses | AdPilot",
    metaDescription:
      "AI-powered marketing automation for Adelaide businesses. From Barossa wineries to Lot Fourteen tech. Automate 9 platforms free.",
    heroSubtitle:
      "From the Barossa Valley to Lot Fourteen, power Adelaide's most ambitious businesses with AI marketing automation.",
    localContext:
      "Adelaide has reinvented itself as a hub for defense technology at Lot Fourteen, world-class wine tourism in the Barossa and McLaren Vale, and cutting-edge medical research at the Adelaide BioMed City. The city's famous festival season — Fringe, WOMADelaide, and the Adelaide Festival — drives a massive hospitality and events economy. Adelaide's collaborative business culture and lower cost of operations compared to the east coast make it the perfect environment for businesses ready to scale their reach with smart marketing automation.",
  },
  "gold-coast": {
    name: "Gold Coast",
    state: "QLD",
    population: "700,000",
    headline: "Gold Coast Marketing Automation for Tourism, Fitness & Beyond",
    description:
      "The Gold Coast runs on tourism, fitness, and lifestyle brands. In a city where image is everything, automated content creation and multi-platform publishing keep your brand front-of-mind with visitors and locals alike.",
    businessTypes: [
      "Tourism & Accommodation",
      "Fitness & Wellness",
      "Real Estate & Development",
      "Nightlife & Entertainment",
      "Marine & Water Sports",
    ],
    localStats: {
      businesses: "45,000+ businesses",
      digitalAdSpend: "$280M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Gold Coast Businesses | AdPilot",
    metaDescription:
      "Marketing automation for Gold Coast tourism, fitness, and lifestyle businesses. AI-powered content across 9 platforms. Start free today.",
    heroSubtitle:
      "Keep your Gold Coast brand visible year-round with AI-powered marketing that works as hard as you do.",
    localContext:
      "The Gold Coast is Australia's playground, attracting over 13 million visitors annually to its famous surf beaches, theme parks, and nightlife precincts in Surfers Paradise and Broadbeach. The city has evolved far beyond tourism — its booming fitness and wellness industry, particularly around Burleigh Heads and Robina, drives a massive social media marketing economy. With one of Australia's fastest-growing property markets and a thriving marine services sector, Gold Coast businesses need always-on marketing automation to stay competitive in this high-energy market.",
  },
  canberra: {
    name: "Canberra",
    state: "ACT",
    population: "470,000",
    headline: "Canberra Businesses: Automate Marketing with Military Precision",
    description:
      "Canberra's economy revolves around government, defense, and education — sectors that demand professional, consistent communication. Marketing automation ensures your brand maintains that standard across every platform.",
    businessTypes: [
      "Government Contractors",
      "Defense & Cybersecurity",
      "Education & Research",
      "Professional Services",
      "IT & Consulting",
    ],
    localStats: {
      businesses: "30,000+ businesses",
      digitalAdSpend: "$180M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Canberra Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Canberra's government, defense, and education sectors. Professional multi-platform publishing. Start free.",
    heroSubtitle:
      "Bring automation precision to your Canberra business marketing — across government, defense, and professional services.",
    localContext:
      "Canberra's business landscape is shaped by its role as Australia's capital. The city's major employers in defense, government services, and cybersecurity create a professional services ecosystem that demands polished, compliant marketing. The growing tech sector around the Canberra Innovation Network and the concentration of universities — ANU, UC, and UNSW Canberra — fuel a knowledge economy that values data-driven marketing. Canberra's high average income and educated population make it a premium market for businesses that communicate with clarity and consistency.",
  },
  newcastle: {
    name: "Newcastle",
    state: "NSW",
    population: "320,000",
    headline: "Newcastle's New Wave: Smart Marketing for a Reinvented City",
    description:
      "Newcastle has transformed from a steel town into a vibrant hub of surf culture, craft brewing, and creative enterprise. Local businesses thrive by connecting with a community that values authenticity and local pride.",
    businessTypes: [
      "Craft Brewing & Hospitality",
      "Surf & Outdoor Lifestyle",
      "Creative & Digital Agencies",
      "Healthcare & Allied Health",
      "Property & Urban Renewal",
    ],
    localStats: {
      businesses: "22,000+ businesses",
      digitalAdSpend: "$120M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Newcastle Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Newcastle NSW businesses. From Honeysuckle to Merewether, automate content across 9 platforms. Start free.",
    heroSubtitle:
      "Newcastle is thriving — make sure your marketing keeps pace with the city's renaissance.",
    localContext:
      "Newcastle's post-industrial renaissance has turned the former steel city into one of Australia's most exciting regional hubs. The revitalized Honeysuckle waterfront and East End precincts now host craft breweries, co-working spaces, and creative agencies. Merewether and Bar Beach attract a surf-lifestyle crowd that drives fitness, outdoor, and hospitality businesses. With the University of Newcastle fueling a growing health and tech sector, the city's businesses are increasingly sophisticated — and ready for marketing automation that matches their ambition.",
  },
  hobart: {
    name: "Hobart",
    state: "TAS",
    population: "240,000",
    headline: "Hobart Marketing Automation: Small City, Global Reach",
    description:
      "The MONA effect transformed Hobart into a global cultural destination. Now the city's food producers, tourism operators, and creative businesses need marketing that matches their world-class reputation.",
    businessTypes: [
      "Tourism & Accommodation",
      "Food & Beverage Producers",
      "Arts & Culture",
      "Sustainability & Clean Energy",
      "Agriculture & Aquaculture",
    ],
    localStats: {
      businesses: "15,000+ businesses",
      digitalAdSpend: "$65M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Hobart Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Hobart and Tasmania businesses. Reach global audiences from Australia's southernmost capital. Start free.",
    heroSubtitle:
      "From Salamanca Market to MONA, give your Hobart business the marketing reach it deserves.",
    localContext:
      "Hobart's transformation from a quiet state capital into a global cultural destination is one of Australia's great business stories. MONA single-handedly reshaped the city's brand and sparked a tourism, food, and arts boom that shows no signs of slowing. The Salamanca waterfront precinct, farm-gate trail, and burgeoning whisky scene have put Tasmanian produce on the world map. For Hobart businesses — whether running a Battery Point guesthouse or exporting Bruny Island oysters — marketing automation means turning local excellence into global visibility.",
  },
  darwin: {
    name: "Darwin",
    state: "NT",
    population: "150,000",
    headline: "Darwin Businesses: Reach the Top End and Beyond",
    description:
      "Darwin's tropical business environment is unlike anywhere else in Australia. Military, tourism, and Indigenous enterprise create a unique market that demands targeted, culturally aware marketing automation.",
    businessTypes: [
      "Tourism & Adventure Travel",
      "Military & Defence Services",
      "Indigenous Business",
      "Mining & Resources",
      "Tropical Agriculture",
    ],
    localStats: {
      businesses: "10,000+ businesses",
      digitalAdSpend: "$45M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Darwin Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Darwin and NT businesses. Reach audiences across the Top End with automated 9-platform publishing. Start free.",
    heroSubtitle:
      "Automate your Top End marketing — reach Darwin locals, tourists, and defence personnel on every platform.",
    localContext:
      "Darwin's business landscape is shaped by its strategic position as Australia's gateway to Southeast Asia and its role as the Territory's capital. The city's economy blends defence — with major bases at Robertson Barracks and RAAF Base Darwin — tourism to Kakadu and Litchfield, and a growing Indigenous business sector. The Waterfront Precinct and Mitchell Street are the heart of Darwin's hospitality scene, while the dry season markets at Mindil Beach draw thousands. For Darwin businesses, marketing automation bridges the vast distances of the Territory and connects with audiences across multiple time zones.",
  },
  "sunshine-coast": {
    name: "Sunshine Coast",
    state: "QLD",
    population: "350,000",
    headline: "Sunshine Coast Marketing That Matches Your Lifestyle Business",
    description:
      "The Sunshine Coast attracts entrepreneurs who want to build great businesses without the big-city grind. Marketing automation lets you compete with city agencies while living the coastal lifestyle.",
    businessTypes: [
      "Health & Wellness",
      "Tourism & Eco-Tourism",
      "Creative & Digital Nomad",
      "Food & Organic Produce",
      "Education & Coaching",
    ],
    localStats: {
      businesses: "35,000+ businesses",
      digitalAdSpend: "$160M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Sunshine Coast Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Sunshine Coast businesses. Compete with city agencies from Noosa to Caloundra. Automate 9 platforms free.",
    heroSubtitle:
      "From Noosa to Caloundra, automate your marketing and spend more time doing what you love on the Sunshine Coast.",
    localContext:
      "The Sunshine Coast has become one of Australia's fastest-growing regions, attracting tree-changers, digital nomads, and lifestyle entrepreneurs from Sydney and Melbourne. Noosa's upmarket food scene, Maroochydore's emerging CBD, and the hinterland wellness retreats around Maleny and Montville create a diverse business ecosystem. The region's new international airport runway and the Maroochydore city centre development signal serious growth ahead. Sunshine Coast businesses value work-life balance — and marketing automation is how they maintain a professional, always-on presence without sacrificing their lifestyle.",
  },
  wollongong: {
    name: "Wollongong",
    state: "NSW",
    population: "310,000",
    headline: "Wollongong Businesses: Punch Above Your Weight with AI Marketing",
    description:
      "Wollongong combines university-driven innovation with blue-collar resilience. The Gong's businesses are ready to grow — and marketing automation gives them the tools to compete beyond the Illawarra.",
    businessTypes: [
      "Education & University Services",
      "Manufacturing & Engineering",
      "Healthcare & Aged Care",
      "Hospitality & Coastal Tourism",
      "IT & Cybersecurity",
    ],
    localStats: {
      businesses: "18,000+ businesses",
      digitalAdSpend: "$85M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Wollongong Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Wollongong and Illawarra businesses. Automate content across 9 platforms and grow beyond the Gong. Start free.",
    heroSubtitle:
      "Give your Wollongong business the marketing firepower to reach customers across the Illawarra and beyond.",
    localContext:
      "Wollongong has evolved from its steel-making heritage into a diversified economy anchored by the University of Wollongong's research strengths in cybersecurity and engineering. The city's Innovation Campus at North Wollongong is nurturing a new generation of tech startups. Meanwhile, the coastal strip from Thirroul to Shellharbour supports a thriving hospitality and tourism sector. Wollongong businesses benefit from lower operating costs than Sydney while being close enough to tap into the capital's talent pool — and marketing automation helps them project a bigger presence than their postcode might suggest.",
  },
  geelong: {
    name: "Geelong",
    state: "VIC",
    population: "270,000",
    headline: "Geelong's Growth Story Needs Growth Marketing",
    description:
      "Geelong has reinvented itself as Victoria's second city, attracting Melbourne refugees and major employers alike. Smart marketing automation helps Geelong businesses capture this growth wave.",
    businessTypes: [
      "Manufacturing & Advanced Manufacturing",
      "Health & NDIS Services",
      "Retail & Lifestyle",
      "Education & Research",
      "Tourism & Great Ocean Road",
    ],
    localStats: {
      businesses: "16,000+ businesses",
      digitalAdSpend: "$75M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Geelong Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Geelong businesses. From the waterfront to the Great Ocean Road, automate 9 platforms. Start free today.",
    heroSubtitle:
      "Geelong is booming — automate your marketing to capture the growth in Victoria's fastest-rising city.",
    localContext:
      "Geelong's transformation from a manufacturing town to a vibrant regional city is one of Victoria's great success stories. The revitalised waterfront precinct, Deakin University's expanding campus, and the arrival of major employers like WorkSafe and the NDIS have driven population growth and business confidence. As the gateway to the Great Ocean Road, Geelong also serves a massive tourism market. The city's advanced manufacturing sector, anchored by the Avalon precinct, continues to evolve. Geelong businesses that automate their marketing now are positioning themselves for the next decade of growth.",
  },
  cairns: {
    name: "Cairns",
    state: "QLD",
    population: "160,000",
    headline: "Cairns Marketing Automation: Reach Every Tourist Before They Arrive",
    description:
      "Cairns lives and breathes tourism. With the Great Barrier Reef and Daintree Rainforest on your doorstep, marketing automation helps you reach international and domestic visitors at every stage of their journey.",
    businessTypes: [
      "Tourism & Reef Experiences",
      "Accommodation & Resorts",
      "Adventure & Outdoor Activities",
      "Indigenous Tourism",
      "Marine Services",
    ],
    localStats: {
      businesses: "12,000+ businesses",
      digitalAdSpend: "$55M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Cairns Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Cairns tourism and hospitality businesses. Reach visitors across 9 platforms before they arrive. Start free.",
    heroSubtitle:
      "From the Reef to the Rainforest, automate your Cairns marketing to reach travellers worldwide.",
    localContext:
      "Cairns is the gateway to two World Heritage sites — the Great Barrier Reef and the Daintree Rainforest — making it one of Australia's premier tourism destinations. The city's Esplanade and Reef Fleet Terminal are the launching points for reef tours that generate hundreds of millions in annual revenue. With the return of international tourism and growing interest in Indigenous cultural experiences, Cairns businesses need to be visible across multiple platforms and languages. Marketing automation ensures your reef tours, rainforest lodges, and adventure experiences are reaching the right travellers at the right time.",
  },
  townsville: {
    name: "Townsville",
    state: "QLD",
    population: "195,000",
    headline: "Townsville Marketing Automation for North Queensland's Hub",
    description:
      "Townsville is North Queensland's economic engine — a military town, port city, and university hub rolled into one. Marketing automation helps local businesses reach diverse audiences across the region.",
    businessTypes: [
      "Defence & Military Services",
      "Mining & Minerals Processing",
      "Healthcare & Tropical Medicine",
      "Education & Research",
      "Port & Logistics",
    ],
    localStats: {
      businesses: "14,000+ businesses",
      digitalAdSpend: "$60M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Townsville Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Townsville and North QLD businesses. Reach defence, mining, and education sectors. Automate 9 platforms free.",
    heroSubtitle:
      "Power North Queensland's largest city with marketing automation that reaches from Lavarack Barracks to Magnetic Island.",
    localContext:
      "Townsville is the unofficial capital of North Queensland, home to Australia's largest army base at Lavarack Barracks and a critical port for the minerals industry. James Cook University drives a significant education and tropical research economy, while the Townsville University Hospital is the region's major healthcare centre. Castle Hill overlooks a city that serves a vast catchment area stretching from Mackay to the Torres Strait. For Townsville businesses, marketing automation means efficiently reaching a geographically dispersed audience of defence families, mining workers, students, and tourists visiting Magnetic Island.",
  },
  toowoomba: {
    name: "Toowoomba",
    state: "QLD",
    population: "170,000",
    headline: "Toowoomba: The Garden City's Businesses Are Ready to Grow",
    description:
      "Toowoomba sits at the crossroads of the Darling Downs agricultural powerhouse and Queensland's second-largest inland city. Smart marketing automation helps local businesses reach beyond the range.",
    businessTypes: [
      "Agriculture & Agribusiness",
      "Education & Training",
      "Healthcare & Allied Health",
      "Retail & Regional Services",
      "Transport & Logistics",
    ],
    localStats: {
      businesses: "11,000+ businesses",
      digitalAdSpend: "$40M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Toowoomba Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Toowoomba and Darling Downs businesses. Reach regional audiences across 9 platforms. Start your free trial.",
    heroSubtitle:
      "From the Darling Downs to the digital world — automate your Toowoomba business marketing.",
    localContext:
      "Toowoomba is Queensland's largest inland city and the commercial heart of the Darling Downs, one of Australia's most productive agricultural regions. The city's Wellcamp Airport — Australia's newest public airport — has opened new logistics and export opportunities. The University of Southern Queensland and a strong network of schools make education a major employer. Toowoomba's famous Carnival of Flowers and its reputation as the Garden City drive a growing tourism sector. For agribusinesses, healthcare providers, and retailers serving the Darling Downs, marketing automation extends their reach far beyond the Great Dividing Range.",
  },
  ballarat: {
    name: "Ballarat",
    state: "VIC",
    population: "115,000",
    headline: "Ballarat Businesses: Heritage City, Modern Marketing",
    description:
      "Ballarat blends gold rush heritage with a modern, growing economy. From Sovereign Hill tourism to Federation University innovation, local businesses are ready for marketing tools that match their ambition.",
    businessTypes: [
      "Tourism & Heritage",
      "Education & Research",
      "Healthcare & Community Services",
      "Retail & Hospitality",
      "Creative & Digital Industries",
    ],
    localStats: {
      businesses: "8,000+ businesses",
      digitalAdSpend: "$30M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Ballarat Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Ballarat businesses. From Sovereign Hill to Sturt Street, automate content across 9 platforms. Start free.",
    heroSubtitle:
      "Give your Ballarat business the gold standard in marketing automation.",
    localContext:
      "Ballarat's gold rush heritage — celebrated at Sovereign Hill and along the grand Sturt Street boulevard — draws hundreds of thousands of visitors annually. But modern Ballarat is much more than history. Federation University's growing campus and the city's burgeoning tech and creative sector are attracting young professionals. The revitalised Bridge Mall precinct and thriving hospitality scene around Lydiard Street show a city investing in its future. For Ballarat businesses, marketing automation means reaching both the tourism market and the growing local population with consistent, professional content.",
  },
  bendigo: {
    name: "Bendigo",
    state: "VIC",
    population: "120,000",
    headline: "Bendigo Marketing Automation: Regional Reach, City-Level Results",
    description:
      "Bendigo is central Victoria's thriving hub — a city of arts, food, and enterprise that's growing fast. Marketing automation helps Bendigo businesses compete with Melbourne-based competitors on every platform.",
    businessTypes: [
      "Arts & Culture",
      "Food & Wine",
      "Healthcare & Aged Care",
      "Mining & Engineering",
      "Education & Training",
    ],
    localStats: {
      businesses: "8,500+ businesses",
      digitalAdSpend: "$32M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Bendigo Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Bendigo businesses. Compete with city agencies from central Victoria. Automate 9 platforms. Start free.",
    heroSubtitle:
      "From the Bendigo Art Gallery to Pall Mall, power your business with marketing automation that delivers city-level results.",
    localContext:
      "Bendigo has emerged as one of regional Australia's most dynamic cities. The Bendigo Art Gallery — home to blockbuster exhibitions — and the city's thriving food and wine scene along Pall Mall and View Street have made it a cultural destination. The Bendigo and Adelaide Bank's headquarters anchor a significant financial services presence, while La Trobe University's campus contributes to a growing knowledge economy. With the Melbourne-to-Bendigo rail corridor driving population growth, local businesses need marketing automation that helps them capture both the expanding local market and the tourist trade.",
  },
  "central-coast": {
    name: "Central Coast",
    state: "NSW",
    population: "340,000",
    headline: "Central Coast Marketing Automation: Coastal Living, Digital Reach",
    description:
      "The Central Coast offers Sydney-quality talent at regional prices. Smart businesses here use marketing automation to serve both the local community and clients up and down the NSW coast.",
    businessTypes: [
      "Healthcare & NDIS Services",
      "Tourism & Coastal Hospitality",
      "Trades & Home Services",
      "Retail & Local Services",
      "Education & Childcare",
    ],
    localStats: {
      businesses: "20,000+ businesses",
      digitalAdSpend: "$90M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Central Coast Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Central Coast NSW businesses. From Gosford to Terrigal, automate content across 9 platforms. Start free.",
    heroSubtitle:
      "From Gosford to Terrigal, give your Central Coast business the digital marketing edge it deserves.",
    localContext:
      "The Central Coast is NSW's third-largest population centre, stretching from Gosford and Erina to the beachside towns of Terrigal, Avoca, and The Entrance. The region has evolved from a Sydney commuter belt into a self-sustaining economy with strengths in healthcare, trades, and tourism. The Gosford CBD renewal and the growing co-working scene are attracting remote workers and small business owners priced out of Sydney. For Central Coast businesses — whether you're a tradie in Woy Woy or a boutique hotel in Terrigal — marketing automation means maintaining a professional presence that competes with the big city without the big-city overhead.",
  },
  launceston: {
    name: "Launceston",
    state: "TAS",
    population: "90,000",
    headline: "Launceston Marketing Automation for Tasmania's Northern Gateway",
    description:
      "Launceston combines natural beauty with a thriving food and wine scene. For businesses in the Tamar Valley and beyond, marketing automation means reaching tourists and locals with consistent, compelling content.",
    businessTypes: [
      "Food & Wine Tourism",
      "Agriculture & Farming",
      "Healthcare & Community Services",
      "Tourism & Heritage",
      "Retail & Regional Services",
    ],
    localStats: {
      businesses: "6,000+ businesses",
      digitalAdSpend: "$22M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Launceston Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Launceston and northern Tasmania businesses. Reach tourists and locals across 9 platforms. Start free.",
    heroSubtitle:
      "From the Cataract Gorge to the Tamar Valley, automate your Launceston business marketing for maximum reach.",
    localContext:
      "Launceston is Tasmania's second city and the gateway to the Tamar Valley wine region, Cataract Gorge, and the state's stunning north-east. The city's food scene — from Stillwater restaurant to the Harvest Market — rivals much larger cities. Agriculture remains the economic backbone of the region, with the Tamar Valley producing world-class cool-climate wines and premium produce. The University of Tasmania's Launceston campus and the growing creative sector at the Design Centre Tasmania add a youthful energy. Marketing automation helps Launceston businesses turn their exceptional local products and experiences into compelling stories that reach a national and international audience.",
  },
  mackay: {
    name: "Mackay",
    state: "QLD",
    population: "125,000",
    headline: "Mackay Marketing Automation: Mining Town, Modern Business",
    description:
      "Mackay is the gateway to the Bowen Basin — Australia's richest coal-mining region. The city's economy extends far beyond mining, with sugar, tourism, and marine industries all needing smart marketing.",
    businessTypes: [
      "Mining Services & Equipment",
      "Sugar & Agriculture",
      "Marine & Fishing",
      "Tourism & Whitsunday Gateway",
      "Trade Services & Engineering",
    ],
    localStats: {
      businesses: "9,000+ businesses",
      digitalAdSpend: "$35M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Mackay Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Mackay and Bowen Basin businesses. Reach mining, agriculture, and tourism markets. Start free today.",
    heroSubtitle:
      "From the Bowen Basin to the Whitsundays, automate your Mackay business marketing.",
    localContext:
      "Mackay sits at the intersection of Australia's richest mining region and some of its most beautiful coastline. The city serves the Bowen Basin coal industry with a sophisticated mining services sector, while its harbour is a major sugar export terminal. The transformation of the Mackay waterfront and the Bluewater Trail shows a city diversifying beyond resources. As a gateway to the Whitsunday Islands and Eungella National Park, Mackay also serves a growing tourism market. Marketing automation helps Mackay businesses reach mining companies, tourists, and the local community without needing a full-time marketing team.",
  },
  rockhampton: {
    name: "Rockhampton",
    state: "QLD",
    population: "85,000",
    headline: "Rockhampton: Australia's Beef Capital Meets Digital Marketing",
    description:
      "Rockhampton's economy is built on beef, mining, and its role as Central Queensland's service hub. Marketing automation helps Rocky businesses reach customers across a region bigger than many countries.",
    businessTypes: [
      "Beef & Cattle Industry",
      "Mining & Resources",
      "Retail & Regional Services",
      "Healthcare & Community",
      "Education & CQUniversity",
    ],
    localStats: {
      businesses: "7,000+ businesses",
      digitalAdSpend: "$25M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Rockhampton Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Rockhampton and Central QLD businesses. Reach audiences across the beef capital. Automate 9 platforms free.",
    heroSubtitle:
      "Give Rocky businesses the digital marketing edge to reach all of Central Queensland.",
    localContext:
      "Rockhampton — affectionately known as Rocky — is the unofficial capital of Central Queensland and Australia's beef capital. The city's iconic bull statues line the highway, but the economy extends well beyond cattle. CQUniversity's main campus drives education and research, while the nearby Capricorn Coast attracts tourists to Great Keppel Island and the Capricorn Caves. Rocky serves as the service centre for mining operations in the Bowen and Galilee basins. For businesses in Rockhampton, marketing automation means efficiently reaching a vast regional catchment — from graziers in the hinterland to tourists on the coast — with consistent, professional content.",
  },
  bunbury: {
    name: "Bunbury",
    state: "WA",
    population: "78,000",
    headline: "Bunbury Marketing Automation: The South West's Digital Hub",
    description:
      "Bunbury is Western Australia's second-largest city and the commercial heart of the South West. From wineries to port services, local businesses need marketing automation to reach Perth and beyond.",
    businessTypes: [
      "Wine & Tourism",
      "Port & Maritime Services",
      "Agriculture & Dairy",
      "Healthcare & Aged Care",
      "Retail & Regional Services",
    ],
    localStats: {
      businesses: "5,500+ businesses",
      digitalAdSpend: "$20M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Bunbury Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Bunbury and WA South West businesses. Reach Perth and beyond with automated 9-platform publishing. Start free.",
    heroSubtitle:
      "From Bunbury's port to Margaret River's vines, automate your South West marketing.",
    localContext:
      "Bunbury is the gateway to Western Australia's stunning South West — a region famous for Margaret River wines, Busselton Jetty, and ancient karri forests. The city's port handles alumina, mineral sands, and timber exports, while the surrounding agricultural region produces premium dairy and beef. Bunbury's Dolphin Discovery Centre and revitalised waterfront are growing the tourism economy. As the South West's major service centre, Bunbury businesses cater to a catchment extending from Harvey to Augusta. Marketing automation helps them maintain a professional digital presence that reaches Perth weekenders, local residents, and the wider WA market.",
  },
  mandurah: {
    name: "Mandurah",
    state: "WA",
    population: "100,000",
    headline: "Mandurah Marketing Automation: Perth's Coastal Growth Corridor",
    description:
      "Mandurah has transformed from a fishing village into one of WA's fastest-growing cities. With retirees, young families, and tourists all flocking in, local businesses need multi-channel marketing automation.",
    businessTypes: [
      "Tourism & Waterways",
      "Aged Care & Retirement",
      "Hospitality & Seafood",
      "Trades & Construction",
      "Marine & Boating",
    ],
    localStats: {
      businesses: "6,500+ businesses",
      digitalAdSpend: "$25M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Mandurah Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Mandurah businesses. Reach the Peel region across 9 platforms with AI-powered content. Start free today.",
    heroSubtitle:
      "Automate your Mandurah marketing to reach the Peel region's booming population.",
    localContext:
      "Mandurah has grown from a quiet crabbing town into the heart of the Peel region — one of Australia's fastest-growing population corridors. The city's stunning estuary, canal developments, and boardwalk precinct attract tourists year-round, while its proximity to Perth via the Mandurah rail line has drawn young families and retirees. The famous Mandurah blue manna crab and the annual crab festival anchor a seafood tourism economy. With massive residential development in suburbs like Lakelands and Ravenswood, Mandurah businesses — from boat charter operators to aged care providers — need marketing automation to keep pace with the region's explosive growth.",
  },
  "wagga-wagga": {
    name: "Wagga Wagga",
    state: "NSW",
    population: "68,000",
    headline: "Wagga Wagga: The Riverina's Business Hub Goes Digital",
    description:
      "Wagga Wagga is the largest inland city in NSW and the heart of the Riverina. From agriculture to defence, local businesses serve a vast region and need marketing automation that reaches every corner of it.",
    businessTypes: [
      "Agriculture & Agribusiness",
      "Defence & Military Services",
      "Education & Charles Sturt University",
      "Healthcare & Regional Health",
      "Wine & Food Tourism",
    ],
    localStats: {
      businesses: "5,000+ businesses",
      digitalAdSpend: "$18M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Wagga Wagga Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Wagga Wagga and Riverina businesses. Reach rural and regional audiences across 9 platforms. Start free.",
    heroSubtitle:
      "From the Murrumbidgee to the market — automate your Wagga Wagga business marketing.",
    localContext:
      "Wagga Wagga is the largest inland city in NSW and the unofficial capital of the Riverina. The city is a major agricultural hub — the surrounding region produces grains, livestock, and wine — and home to Kapooka army base, which brings defence families and spending into the local economy. Charles Sturt University's campus is a significant employer and innovation driver. The revitalised Baylis Street precinct and the Wagga beach along the Murrumbidgee River show a city investing in lifestyle. For Riverina businesses, marketing automation means reaching a geographically dispersed rural and regional audience efficiently and consistently.",
  },
  albury: {
    name: "Albury",
    state: "NSW",
    population: "55,000",
    headline: "Albury-Wodonga: Cross-Border Business Needs Cross-Platform Marketing",
    description:
      "Albury sits on the Murray River at the NSW-Victoria border, creating a unique twin-city market. Marketing automation helps businesses here reach audiences on both sides of the river and beyond.",
    businessTypes: [
      "Manufacturing & Industrial",
      "Healthcare & Border Health",
      "Retail & Cross-Border Trade",
      "Wine & Murray Region Tourism",
      "Defence & Military Services",
    ],
    localStats: {
      businesses: "4,500+ businesses",
      digitalAdSpend: "$16M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Albury-Wodonga Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Albury-Wodonga businesses. Bridge the border with automated 9-platform marketing. Start your free trial.",
    heroSubtitle:
      "Bridge the Murray and reach both sides of the border with automated marketing for your Albury business.",
    localContext:
      "Albury-Wodonga's unique position straddling the NSW-Victoria border creates a twin-city market of over 100,000 people. The region's economy spans manufacturing, defence (with Bandiana and Latchford Barracks), and a growing food and wine tourism sector along the Murray River. The Albury QEII Square redevelopment and the thriving Dean Street precinct reflect a city that's invested in its future. For businesses operating across the border — navigating different state regulations while serving a unified market — marketing automation provides the consistency and efficiency needed to maintain a strong presence on both sides of the river.",
  },
  mildura: {
    name: "Mildura",
    state: "VIC",
    population: "55,000",
    headline: "Mildura Marketing Automation: From Sunraysia to the World",
    description:
      "Mildura is the heart of the Sunraysia region — Australia's food bowl. From table grapes to citrus to world-class wine, local businesses need marketing automation to sell their premium produce far and wide.",
    businessTypes: [
      "Agriculture & Horticulture",
      "Wine & Cellar Doors",
      "Tourism & Murray River",
      "Food Processing & Export",
      "Solar Energy & Sustainability",
    ],
    localStats: {
      businesses: "4,000+ businesses",
      digitalAdSpend: "$14M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Mildura Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Mildura and Sunraysia businesses. Market your produce, wine, and tourism across 9 platforms. Start free.",
    heroSubtitle:
      "Take Sunraysia's finest produce from the paddock to the platform with automated marketing.",
    localContext:
      "Mildura is the capital of the Sunraysia region — one of Australia's most productive agricultural areas, generating billions in table grapes, citrus, dried fruits, almonds, and wine grapes. The Murray River that feeds the region also drives a houseboat and eco-tourism industry. Mildura's Feast Street precinct and its growing reputation as a food destination reflect a community that's proud of its produce. The region is also pioneering solar energy, with large-scale solar farms taking advantage of 300+ days of sunshine. For Mildura businesses, marketing automation means connecting premium local products with buyers in Melbourne, Sydney, and export markets around the world.",
  },
  shepparton: {
    name: "Shepparton",
    state: "VIC",
    population: "52,000",
    headline: "Shepparton Marketing Automation: The Food Bowl Gets Digital",
    description:
      "Shepparton is the heart of the Goulburn Valley — one of the world's most productive fruit-growing regions. Marketing automation helps local producers, retailers, and service businesses reach new markets.",
    businessTypes: [
      "Fruit & Dairy Industry",
      "Food Processing & SPC",
      "Agriculture & Water Management",
      "Healthcare & Regional Services",
      "Multicultural Business",
    ],
    localStats: {
      businesses: "3,800+ businesses",
      digitalAdSpend: "$12M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Shepparton Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Shepparton and Goulburn Valley businesses. Market your produce and services across 9 platforms. Start free.",
    heroSubtitle:
      "From the Goulburn Valley's orchards to online marketplaces — automate your Shepparton business marketing.",
    localContext:
      "Shepparton is the commercial capital of the Goulburn Valley, one of the world's most productive food-growing regions. The city's economy is built on stone fruit, dairy (home to iconic brands like SPC and Campbell's), and a diverse agricultural sector that feeds Australia and exports globally. Shepparton also boasts one of Australia's most multicultural regional communities, with vibrant Italian, Albanian, and Iraqi communities enriching the local business landscape. The Shepparton Art Museum's stunning new lakeside building reflects a city investing in culture alongside agriculture. Marketing automation helps Shepparton businesses tell their story to markets far beyond the Valley.",
  },
  gladstone: {
    name: "Gladstone",
    state: "QLD",
    population: "65,000",
    headline: "Gladstone Marketing Automation: Industrial Powerhouse, Digital Future",
    description:
      "Gladstone is one of Australia's most important industrial cities, with the world's largest alumina refinery and a critical LNG export hub. Local businesses serve a high-income workforce that demands quality.",
    businessTypes: [
      "Industrial & Manufacturing",
      "LNG & Energy",
      "Marine & Port Services",
      "Hospitality & Tourism",
      "Trade Services & Maintenance",
    ],
    localStats: {
      businesses: "4,500+ businesses",
      digitalAdSpend: "$15M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Gladstone Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Gladstone businesses. Reach the industrial and LNG workforce across 9 platforms. Start your free trial.",
    heroSubtitle:
      "Power your Gladstone business with marketing automation that matches the city's industrial ambition.",
    localContext:
      "Gladstone is an industrial powerhouse — home to the world's largest alumina refinery, a major aluminium smelter, and three massive LNG plants on Curtis Island that export Australian gas to the world. This concentration of heavy industry creates a high-income workforce that supports a thriving local services economy. The Gladstone Marina and nearby Heron Island and Agnes Water offer tourism opportunities, while the port — one of Australia's largest by tonnage — anchors a significant maritime services sector. For Gladstone businesses, marketing automation means reaching a relatively small but high-value audience with the professional, targeted content they expect.",
  },
  "hervey-bay": {
    name: "Hervey Bay",
    state: "QLD",
    population: "55,000",
    headline: "Hervey Bay: Whale-Watching Capital Meets Smart Marketing",
    description:
      "Hervey Bay is Australia's whale-watching capital and a beloved retirement destination. Tourism, aged care, and lifestyle businesses here need marketing automation that works as beautifully as the bay.",
    businessTypes: [
      "Tourism & Whale Watching",
      "Aged Care & Retirement Living",
      "Hospitality & Seafood",
      "Marine & Fraser Island Tours",
      "Healthcare & Allied Health",
    ],
    localStats: {
      businesses: "4,000+ businesses",
      digitalAdSpend: "$13M annual digital ad spend",
    },
    metaTitle: "Marketing Automation for Hervey Bay Businesses | AdPilot",
    metaDescription:
      "AI marketing automation for Hervey Bay businesses. From whale watching to aged care, automate your marketing across 9 platforms. Free.",
    heroSubtitle:
      "From K'gari to the whale-watching fleet, automate your Hervey Bay business marketing for year-round results.",
    localContext:
      "Hervey Bay is one of the world's premier whale-watching destinations, with humpback whales migrating through the sheltered bay from July to November each year. The city is also the gateway to K'gari (Fraser Island), the world's largest sand island and a UNESCO World Heritage site. Beyond tourism, Hervey Bay has become one of Queensland's most popular retirement destinations, driving strong demand for aged care, healthcare, and lifestyle services. The Esplanade precinct and Urangan Harbour are the heart of the tourism economy. Marketing automation helps Hervey Bay businesses maintain visibility during the quieter months and maximise bookings during the peak whale season.",
  },
};

export function getCityData(slug: string): CityData | undefined {
  return CITIES[slug];
}

export function getAllCitySlugs(): string[] {
  return Object.keys(CITIES);
}

export const STATES: Record<string, string> = {
  NSW: "New South Wales",
  VIC: "Victoria",
  QLD: "Queensland",
  WA: "Western Australia",
  SA: "South Australia",
  TAS: "Tasmania",
  NT: "Northern Territory",
  ACT: "Australian Capital Territory",
};

export const CITIES_BY_STATE: Record<string, string[]> = Object.entries(
  CITIES
).reduce(
  (acc, [slug, city]) => {
    if (!acc[city.state]) acc[city.state] = [];
    acc[city.state]!.push(slug);
    return acc;
  },
  {} as Record<string, string[]>
);
