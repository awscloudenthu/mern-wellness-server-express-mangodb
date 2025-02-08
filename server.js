const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5001;

// MongoDB connection URL
const mongoUri = "mongodb://root:example@mongodb:27017/health-data?authSource=admin";

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((error) => {
  console.error("Error connecting to MongoDB", error);
});

// Middleware
app.use(cors());
app.use(express.json());

// HealthData schema and model with userId
const healthDataSchema = new mongoose.Schema({
  userId: String,
  date: String,
  steps: Number,
  calories: Number
});

const HealthData = mongoose.model('HealthData', healthDataSchema);

// Static health data for seeding
const healthDataSeed = [
  { userId: 'seeded', date: "2025-01-20", steps: 5000, calories: 200 },
  { userId: 'seeded', date: "2025-01-19", steps: 7000, calories: 300 },
  { userId: 'seeded', date: "2025-01-18", steps: 8000, calories: 350 },
  { userId: 'seeded', date: "2025-01-17", steps: 10000, calories: 400 },
  { userId: 'seeded', date: "2025-01-16", steps: 4500, calories: 180 },
  { userId: 'seeded', date: "2025-01-15", steps: 9000, calories: 360 },
  { userId: 'seeded', date: "2025-01-14", steps: 12000, calories: 500 }
];


// Seed data if no documents exist
mongoose.connection.once('open', async () => {
  const count = await HealthData.countDocuments({ userId: 'seeded' });
  if (count === 0) {
    await HealthData.insertMany(healthDataSeed);
    console.log('Seed data inserted for userId: seeded');
  }
});

// API Endpoints

// 1. Get health data for a specific user
//    For now, only the this get method is used for "seeded" user
//       Eventually, when aws cognito userpool is supported, rest of the
//       methods will be used to persist user data
//
app.get('/api/health-data/:userId', async (req, res) => {
  const userId = req.params.userId || 'seeded';
  try {
    const data = await HealthData.find({ userId });
    const today = new Date(); //   today's date
    const adjustedData = data.map((entry, index) => {
      const entryDate = new Date(today); // Copy today's date
      entryDate.setDate(today.getDate() - index - 2 ); // Subtract days based on the index, just show two days ago

      // Format the date to 'yyyy-mm-dd'
      const formattedDate = entryDate.toISOString().split('T')[0];

      const updatedEntry = entry.toObject(); // Convert the Mongoose document to plain JavaScript object
      updatedEntry.date = formattedDate; // Update the date field

      return updatedEntry; // Return the updated entry
    });

    res.json(adjustedData);
  } catch (error) {
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Error fetching health data" });
  }
});

// 2. Add new health data for a user
app.post('/api/health-data', async (req, res) => {
  const { userId, date, steps, calories } = req.body;
  try {
    const newEntry = new HealthData({ userId, date, steps, calories });
    await newEntry.save();
    res.status(201).json({ message: "Data added successfully", data: newEntry });
  } catch (error) {
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Error adding health data" });
  }
});

// 3. Update health data for a specific record by ID
app.put('/api/health-data/:id', async (req, res) => {
  const { id } = req.params; // Get the _id from URL params
  const { date, steps, calories } = req.body;

  try {
    const updatedData = await HealthData.findByIdAndUpdate(
      id, // Use _id to find the record
      { date, steps, calories }, // Update the fields
      { new: true } // Return the updated document
    );

    if (!updatedData) {
      return res.status(404).json({ message: "Data not found" });
    }

    res.json({ message: "Data updated successfully", data: updatedData });
  } catch (error) {
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Error updating health data" });
  }
});

// 4. Delete health data for a specific record by ID
app.delete('/api/health-data/:id', async (req, res) => {
  const { id } = req.params; // Get the _id from URL params

  try {
    const deletedData = await HealthData.findByIdAndDelete(id); // Use _id to delete the record

    if (!deletedData) {
      return res.status(404).json({ message: "Data not found" });
    }

    res.json({ message: "Data deleted successfully" });
  } catch (error) {
    console.error("Database Error:", error.message);
    res.status(500).json({ error: "Error deleting health data" });
  }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
