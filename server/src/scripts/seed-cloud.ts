import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db';
import { DESTINATIONS_DATA } from '../data/destinations.data';
import { ACCOMMODATIONS_DATA } from '../data/accommodations.data';
import { EXPERIENCES_DATA } from '../data/experiences.data';
import { LOCAL_TREASURES_DATA } from '../data/local-treasures.data';
import { DestinationModel } from '../models/destination.model';
import { StayModel } from '../models/stay.model';
import { ExperienceModel } from '../models/experience.model';
import { LocalTreasureModel } from '../models/local-treasure.model';

async function seedBothDatabases() {
  await connectDB();
  console.log('Connected to Atlas successfully.');

  const targetDatabases = ['staylocal', 'test'];

  for (const dbName of targetDatabases) {
    console.log(`\n==================================================`);
    console.log(`Processing Database: [${dbName}]`);
    console.log(`==================================================`);

    const dbConn = mongoose.connection.useDb(dbName);
    const Dest = dbConn.model('Destination', DestinationModel.schema);
    const Stay = dbConn.model('Stay', StayModel.schema);
    const Exp = dbConn.model('Experience', ExperienceModel.schema);
    const Treasure = dbConn.model('LocalTreasure', LocalTreasureModel.schema);

    // 1. Destinations
    for (const d of DESTINATIONS_DATA) {
      await Dest.updateOne({ id: d.id.toLowerCase() }, { $set: d }, { upsert: true });
    }
    const destCount = await Dest.countDocuments();
    console.log(`Destinations in [${dbName}]: ${destCount}`);

    // 2. Stays / Homestays (ensure isPreloaded: true, assignmentStatus: 'unassigned')
    for (const s of ACCOMMODATIONS_DATA) {
      const stayData = {
        ...s,
        isPreloaded: true,
        assignmentStatus: s.hostId ? 'assigned' : 'unassigned',
      };
      await Stay.updateOne({ id: s.id.toLowerCase() }, { $set: stayData }, { upsert: true });
    }
    const stayCount = await Stay.countDocuments();
    console.log(`Stays in [${dbName}]: ${stayCount}`);

    // 3. Experiences (including Darkot / Munsiyari Shawl Factory & Handloom Weaving)
    for (const e of EXPERIENCES_DATA) {
      await Exp.updateOne({ id: e.id.toLowerCase() }, { $set: e }, { upsert: true });
    }
    const expCount = await Exp.countDocuments();
    console.log(`Experiences in [${dbName}]: ${expCount}`);

    // 4. Local Treasures
    for (const t of LOCAL_TREASURES_DATA) {
      await Treasure.updateOne({ id: t.id.toLowerCase() }, { $set: t }, { upsert: true });
    }
    const treasureCount = await Treasure.countDocuments();
    console.log(`Local Treasures in [${dbName}]: ${treasureCount}`);
  }

  await disconnectDB();
  console.log('\nSeeding completed successfully!');
}

seedBothDatabases().catch((err) => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
