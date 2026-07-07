import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User.js';
import Campaign from './models/Campaign.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in .env!");
  process.exit(1);
}

const dbName = MONGODB_URI.includes('?') ? MONGODB_URI.split('?')[0].split('/').pop() : MONGODB_URI.split('/').pop();
console.log(`Targeting database: ${dbName}`);

const skillsPool = ['First Aid', 'Teaching', 'Web Development', 'Heavy Lifting', 'Cooking', 'Event Management', 'Public Speaking', 'Social Media', 'Writing', 'Database Management'];
const interestPool = ['Education', 'Healthcare', 'Environment', 'Food Security', 'Disaster Relief', 'Animal Welfare', 'Human Rights'];
const locations = ["Seattle, WA", "New York, NY", "San Francisco, CA", "Chicago, IL", "Boston, MA", "Los Angeles, CA", "Austin, TX"];

const seed = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully!");

    // 1. Create Admin
    const adminEmail = 'vikashtiwari1@example.com';
    const adminPassword = 'Vikash#2004';

    // Delete existing admin if exists to avoid duplication
    await User.deleteMany({ email: adminEmail });

    const admin = await User.create({
      name: 'VikashTiwari1',
      email: adminEmail,
      password: adminPassword,
      role: 'Admin',
      phone: '1234567890',
      location: 'Seattle, WA',
      isVerified: true
    });
    console.log(`Created Admin user: ${admin.name} (${admin.email})`);

    // 2. Create 20 Volunteer Users
    console.log("Creating 20 volunteer users...");
    await User.deleteMany({ role: 'Volunteer', email: { $regex: /volunteer\d+@example\.com/ } });

    const volunteers = [];
    for (let i = 1; i <= 20; i++) {
      const volSkills = [
        skillsPool[Math.floor(Math.random() * skillsPool.length)],
        skillsPool[Math.floor(Math.random() * skillsPool.length)]
      ].filter((v, idx, self) => self.indexOf(v) === idx);

      const volInterests = [
        interestPool[Math.floor(Math.random() * interestPool.length)],
        interestPool[Math.floor(Math.random() * interestPool.length)]
      ].filter((v, idx, self) => self.indexOf(v) === idx);

      const vol = await User.create({
        name: `Volunteer User ${i}`,
        email: `volunteer${i}@example.com`,
        password: `password${i}`,
        role: 'Volunteer',
        phone: `98765432${i.toString().padStart(2, '0')}`,
        location: locations[Math.floor(Math.random() * locations.length)],
        skills: volSkills,
        interests: volInterests,
        availability: i % 2 === 0 ? 'Weekends' : 'Weekdays',
        isVerified: true
      });
      volunteers.push(vol);
    }
    console.log("Successfully created 20 volunteer users!");

    // 3. Create 10 Campaigns
    console.log("Creating 10 campaigns...");
    await Campaign.deleteMany({ createdBy: admin._id });

    // Varying time offsets
    const timeOffsets = [
      7 * 24 * 60 * 60 * 1000,      // 1 week later
      14 * 24 * 60 * 60 * 1000,     // 2 weeks later
      21 * 24 * 60 * 60 * 1000,     // 3 weeks later
      30 * 24 * 60 * 60 * 1000,     // 1 month later
      35 * 24 * 60 * 60 * 1000,     // 5 weeks later
      42 * 24 * 60 * 60 * 1000,     // 6 weeks later
      3 * 24 * 60 * 60 * 1000,      // 3 days later
      10 * 24 * 60 * 60 * 1000,     // 10 days later
      18 * 24 * 60 * 60 * 1000,     // 18 days later
      50 * 24 * 60 * 60 * 1000      // 50 days later
    ];

    const campaignData = [
      {
        title: "Community Beach Cleanup",
        description: "Join us for our weekly cleanup campaign to keep our local shoreline pristine. We will gather at the main entrance, distribute trash pickers, bags, and gloves, and cover a 2-mile stretch. Refreshments will be provided.",
        time: "09:00 AM",
        category: "Environmental",
        skillsRequired: ["Heavy Lifting", "Event Management"]
      },
      {
        title: "Free Health Screening Camp",
        description: "An event providing basic medical screenings, blood pressure checks, and general physician consultations to underserved families. Healthcare volunteers and administrative helpers are highly needed.",
        time: "08:00 AM",
        category: "Healthcare",
        skillsRequired: ["First Aid", "Event Management"]
      },
      {
        title: "Youth Tutoring Workshop",
        description: "Help school children with science and math tutoring. A perfect opportunity for volunteers who love education and mentoring the next generation.",
        time: "03:30 PM",
        category: "Education",
        skillsRequired: ["Teaching", "Public Speaking"]
      },
      {
        title: "Food Pantry Food Distribution",
        description: "Assist in sorting donations, packing grocery bags, and handing out meals to local community members in need at our central distribution hub.",
        time: "10:00 AM",
        category: "Food Security",
        skillsRequired: ["Heavy Lifting", "Cooking"]
      },
      {
        title: "Senior Center Social Hour",
        description: "Spend time with elderly residents playing board games, sharing stories, and helping coordinate a delightful afternoon tea event.",
        time: "02:00 PM",
        category: "Social Services",
        skillsRequired: ["Public Speaking", "Event Management"]
      },
      {
        title: "Tree Planting Initiative",
        description: "Help us plant over 200 native tree saplings in the city park. Please bring outdoor clothes and sturdy shoes. Shovels and trees will be provided.",
        time: "07:30 AM",
        category: "Environmental",
        skillsRequired: ["Heavy Lifting"]
      },
      {
        title: "First Aid & CPR Certification",
        description: "A workshop to train volunteers on basic first aid and life support skills. Certified instructors will lead the training.",
        time: "09:00 AM",
        category: "Healthcare",
        skillsRequired: ["First Aid"]
      },
      {
        title: "Coding for Kids BootCamp",
        description: "An introductory HTML/CSS class for local middle school students. Share your tech skills and ignite a passion for software development.",
        time: "01:00 PM",
        category: "Education",
        skillsRequired: ["Web Development", "Teaching"]
      },
      {
        title: "Hot Meals Soup Kitchen",
        description: "Help cook and serve healthy, warm lunch meals to local individuals experiencing homelessness. Kitchen prep and cleaning duties included.",
        time: "11:00 AM",
        category: "Food Security",
        skillsRequired: ["Cooking", "Heavy Lifting"]
      },
      {
        title: "Disaster Preparedness Seminar",
        description: "Learn and share vital emergency response strategies. We will distribute information pamphlets and train the public on building emergency kits.",
        time: "04:00 PM",
        category: "Social Services",
        skillsRequired: ["Public Speaking", "Writing"]
      }
    ];

    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      const camp = campaignData[i];
      const eventDate = new Date(now + timeOffsets[i]);

      await Campaign.create({
        title: camp.title,
        description: camp.description,
        date: eventDate,
        time: camp.time,
        location: locations[Math.floor(Math.random() * locations.length)],
        maxVolunteers: Math.floor(Math.random() * 20) + 10,
        category: camp.category,
        skillsRequired: camp.skillsRequired,
        image: `https://images.unsplash.com/photo-${1500000000000 + i * 100000}?auto=format&fit=crop&w=600&q=80`,
        status: "Upcoming",
        createdBy: admin._id
      });
    }

    console.log("Successfully created 10 campaigns with varying dates!");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seed();


// I have successfully generated and populated your MongoDB Atlas database with the requested fake users and campaigns.

// 1. Created Admin Account
// Name: VikashTiwari1
// Email: vikashtiwari1@example.com
// Password: Vikash#2004
// Role: Admin
// 2. Created 20 Volunteer Accounts
// Names: Volunteer User 1 through Volunteer User 20
// Emails: volunteer1@example.com through volunteer20@example.com
// Passwords: password1 through password20 (e.g. password5 for Volunteer 5)
// Attributes: Randomly assigned skills, location, availability (weekends/weekdays), and verified status.
// 3. Created 10 Campaigns (with varying dates)
// Creator: Linked directly to your new VikashTiwari1 admin account.
// Categories: Evenly distributed across "Healthcare", "Environmental", "Education", "Food Security", and "Social Services".
// Dates:
// Community Beach Cleanup (1 week later)
// Free Health Screening Camp (2 weeks later)
// Youth Tutoring Workshop (3 weeks later)
// Food Pantry Distribution (1 month later)
// Senior Center Social Hour (5 weeks later)
// Tree Planting Initiative (6 weeks later)
// First Aid & CPR Certification (3 days later)
// Coding for Kids BootCamp (10 days later)
// Hot Meals Soup Kitchen (18 days later)
// Disaster Preparedness Seminar (50 days later)