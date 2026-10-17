import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists locally
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'localjourney.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency and performance
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    vip_tier TEXT DEFAULT 'Gold',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS itineraries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT,
    end_date TEXT,
    budget TEXT,
    travelers_count INTEGER DEFAULT 2,
    pacing TEXT DEFAULT 'Balanced',
    interests TEXT,
    constraints TEXT,
    hotel_preference TEXT,
    content_markdown TEXT NOT NULL,
    model_used TEXT DEFAULT 'llama3',
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface Client {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  vip_tier?: string;
  notes?: string;
  created_at?: string;
}

export interface Itinerary {
  id?: number;
  client_id?: number | null;
  client_name?: string;
  client_email?: string;
  client_vip_tier?: string;
  title: string;
  destination: string;
  start_date?: string;
  end_date?: string;
  budget?: string;
  travelers_count?: number;
  pacing?: string;
  interests?: string; // JSON array string or comma separated
  constraints?: string;
  hotel_preference?: string;
  content_markdown: string;
  model_used?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export function getClients(): Client[] {
  return db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all() as Client[];
}

export function getClientById(id: number): Client | undefined {
  return db.prepare('SELECT * FROM clients WHERE id = ?').get(id) as Client | undefined;
}

export function getOrCreateClient(name: string, email?: string, phone?: string, vip_tier?: string): Client {
  const existing = db.prepare('SELECT * FROM clients WHERE LOWER(name) = LOWER(?)').get(name.trim()) as Client | undefined;
  if (existing) {
    return existing;
  }
  const info = db.prepare(`
    INSERT INTO clients (name, email, phone, vip_tier, notes)
    VALUES (?, ?, ?, ?, ?)
  `).run(name.trim(), email || '', phone || '', vip_tier || 'Gold', 'Created via itinerary planner');
  
  return getClientById(Number(info.lastInsertRowid))!;
}

export function getItineraries(limit = 50): Itinerary[] {
  return db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email, c.vip_tier as client_vip_tier
    FROM itineraries i
    LEFT JOIN clients c ON i.client_id = c.id
    ORDER BY i.created_at DESC
    LIMIT ?
  `).all(limit) as Itinerary[];
}

export function getItineraryById(id: number): Itinerary | undefined {
  return db.prepare(`
    SELECT i.*, c.name as client_name, c.email as client_email, c.vip_tier as client_vip_tier
    FROM itineraries i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = ?
  `).get(id) as Itinerary | undefined;
}

export function createItinerary(itinerary: Omit<Itinerary, 'id' | 'created_at' | 'updated_at'>): Itinerary {
  const stmt = db.prepare(`
    INSERT INTO itineraries (
      client_id, title, destination, start_date, end_date, budget,
      travelers_count, pacing, interests, constraints, hotel_preference,
      content_markdown, model_used, status
    ) VALUES (
      @client_id, @title, @destination, @start_date, @end_date, @budget,
      @travelers_count, @pacing, @interests, @constraints, @hotel_preference,
      @content_markdown, @model_used, @status
    )
  `);

  const info = stmt.run({
    client_id: itinerary.client_id || null,
    title: itinerary.title,
    destination: itinerary.destination,
    start_date: itinerary.start_date || '',
    end_date: itinerary.end_date || '',
    budget: itinerary.budget || '',
    travelers_count: itinerary.travelers_count || 2,
    pacing: itinerary.pacing || 'Balanced',
    interests: itinerary.interests || '[]',
    constraints: itinerary.constraints || '',
    hotel_preference: itinerary.hotel_preference || 'Boutique Luxury',
    content_markdown: itinerary.content_markdown,
    model_used: itinerary.model_used || 'llama3',
    status: itinerary.status || 'draft',
  });

  return getItineraryById(Number(info.lastInsertRowid))!;
}

export function deleteItinerary(id: number): boolean {
  const result = db.prepare('DELETE FROM itineraries WHERE id = ?').run(id);
  return result.changes > 0;
}

export function updateItineraryStatus(id: number, status: string): boolean {
  const result = db.prepare('UPDATE itineraries SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);
  return result.changes > 0;
}

export function getDashboardStats() {
  const totalItineraries = (db.prepare('SELECT COUNT(*) as count FROM itineraries').get() as { count: number }).count;
  const totalClients = (db.prepare('SELECT COUNT(*) as count FROM clients').get() as { count: number }).count;
  const finalizedCount = (db.prepare("SELECT COUNT(*) as count FROM itineraries WHERE status = 'finalized'").get() as { count: number }).count;
  
  return {
    totalItineraries,
    totalClients,
    finalizedCount,
    privacyScore: 100, // 100% on-device local storage
  };
}

// Seed initial boutique agency sample data if database is empty
export function seedSampleDataIfEmpty() {
  const count = (db.prepare('SELECT COUNT(*) as count FROM itineraries').get() as { count: number }).count;
  if (count > 0) return;

  // Insert luxury boutique clients
  const c1 = getOrCreateClient('Victoria Sterling', 'victoria.sterling@privatewealth.example', '+1 (555) 349-8821', 'Ultra-VIP Black Card');
  const c2 = getOrCreateClient('Julian & Elena Vance', 'jvance@vancestudio.example', '+1 (555) 782-9901', 'Gold VIP');
  const c3 = getOrCreateClient('Marcus Sterling-Cho', 'marcus.cho@techfounders.example', '+1 (555) 201-4478', 'Ultra-VIP Black Card');

  // Sample Itinerary 1: Amalfi Coast
  createItinerary({
    client_id: c1.id,
    title: 'Amalfi & Ravello Private Cliffside & Vineyard Sanctuary',
    destination: 'Amalfi Coast, Italy',
    start_date: '2026-06-12',
    end_date: '2026-06-17',
    budget: '$18,000',
    travelers_count: 2,
    pacing: 'Relaxed',
    interests: JSON.stringify(['Private Yacht Charter', 'Vineyard Tasting', 'Michelin Dining', 'Cliffside Architecture']),
    constraints: 'Dietary: Pescatarian, strictly boutique cliffside properties with private terraces.',
    hotel_preference: 'Monastero Santa Rosa Hotel & Spa (Conca dei Marini)',
    content_markdown: `### Day 1: Arrival & Private Cliffside Welcome
- **Morning**: Private helicopter transfer from Naples International (NAP) landing at Ravello heli-pad. Check-in at *Monastero Santa Rosa*, greeting by Guest Relations Director with chilled Franciacorta.
- **Afternoon**: Leisure recovery by the infinity pool overlooking the Gulf of Salerno. Herbal aromatic spa ritual featuring herbs harvested from the monastery's cliffside terraced gardens.
- **Evening**: Welcome 5-course coastal tasting menu at Michelin-starred *Il Refettorio*, featuring red shrimp tartare with citrus gelée and catch-of-the-day turbot.

### Day 2: Private Riva Boat Charter & Capri Grottoes
- **Morning (09:30)**: Private Riva Aquarama yacht boarding directly from Amalfi private pier. Cruise past Positano's pastel cascades towards the Faraglioni rocks of Capri.
- **Lunch**: Secluded table at *La Fontelina Capri*, reserved beach loungers with wild sea bass in salt crust and chilled Greco di Tufo.
- **Afternoon**: Hidden sea cave exploration (Grotta Verde and secluded coves inaccessible to public vessels). Sunset champagne toast en route back to Amalfi.
- **Evening**: Casual dinner on the pergola terrace at *Ristorante Da Gemma* in Amalfi center.

### Day 3: Ravello Gardens & Historic Villa Cimbrone
- **Morning**: Private guided walk through Villa Cimbrone's "Terrace of Infinity" before public hours. Architecture briefing on 11th-century Moorish influences.
- **Afternoon**: Private vineyard tour and cellar tasting at *Marisa Cuomo* in Furore, cut into vertical dolomitic limestone cliffs. Meet with enologist Andrea Ferraioli.
- **Evening**: Candlelit dinner at *Rossellinis* in Palazzo Avino, overlooking the azure coast.`,
    model_used: 'llama3 (local)',
    status: 'finalized',
  });

  // Sample Itinerary 2: Kyoto & Tokyo
  createItinerary({
    client_id: c2.id,
    title: 'Kyoto Zen Temples & Artisan Crafts Connoisseur Journey',
    destination: 'Kyoto, Japan',
    start_date: '2026-11-04',
    end_date: '2026-11-10',
    budget: '$22,500',
    travelers_count: 2,
    pacing: 'Balanced',
    interests: JSON.stringify(['Zen Gardens', 'Private Tea Ceremony', 'Master Ceramicists', 'Kaiseki Dining']),
    constraints: 'Requires private English-fluent art historian guide throughout.',
    hotel_preference: 'Sowaka Heritage Machiya or Aman Kyoto',
    content_markdown: `### Day 1: Private Machiya Sanctuary & Kaiseki Welcome
- **Arrival**: First-class Shinkansen greeting at Kyoto Station. Private car escort to *Sowaka* in the historic Gion Yasaka district.
- **Late Afternoon**: Quiet orientation stroll through Shinbashi-dori preserved wooden teahouse row.
- **Evening**: Private private 10-course seasonal autumn kaiseki at 3-Michelin-starred *Hyotei* (400-year culinary heritage), featuring matsutake mushrooms in earthen teapots.

### Day 2: Exclusive Temple Access & Living National Treasure
- **Morning (08:00)**: Exclusive before-hours private entry to Daitoku-ji's sub-temple *Daisen-in*. Private zazen meditation session led by the resident abbot.
- **Afternoon**: Private studio visit with a 15th-generation Raku ceramic master. Hands-on appreciation of tea bowl aesthetics (Wabi-sabi).
- **Evening**: Private bamboo forest tea ceremony prepared by a Urasenke grand master in Arashiyama.`,
    model_used: 'mistral (local)',
    status: 'finalized',
  });
}

// Run initial seed on load
seedSampleDataIfEmpty();

export default db;
