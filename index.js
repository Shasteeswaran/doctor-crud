const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.static('public'));

// MongoDB connection
mongoose.connect('mongodb+srv://harishbhalaa:harish@backend.w8koxqb.mongodb.net/', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB database');
});

// Define schema for the patient collection
const patientSchema = new mongoose.Schema({
    name: String,
    phone_number: String,
    age: Number,
    gender: String,
    consultation: String,
    imagei: String,
    imageo:String
    // Add more fields as needed
});

// Create a model for the patient collection
const Patient = mongoose.model('tech_patient_datas', patientSchema);

// Middleware to parse JSON requests
app.use(express.json());

app.get('/', (req, res) => {
    // Read the HTML file
    fs.readFile(path.join(__dirname, 'edit3.html'), 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error loading HTML file');
            return;
        }
        // Send the HTML file as a response
        res.send(data);
    });
});


// Search route to find patients whose names start with the given prefix
app.get('/search', async (req, res) => {
    const namePrefix = req.query.namePrefix;

    try {
        let patients;
        if (namePrefix) {
            // Search patients whose names start with the given prefix
            patients = await Patient.find({ name: { $regex: `^${namePrefix}`, $options: 'i' } });
        } else {
            res.status(400).json({ error: 'Name prefix is required for search suggestions' });
            return;
        }

        if (patients.length === 0) {
            res.status(404).json({ error: 'No matching patients found' });
        } else {
            res.json(patients);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Search route to find a specific patient by name
app.get('/search/patient', async (req, res) => {
    const name = req.query.name;

    try {
        if (!name) {
            res.status(400).json({ error: 'Name is required for patient search' });
            return;
        }

        // Search for the specific patient by name
        const patient = await Patient.findOne({ name: name });

        if (!patient || patient.length === 0) { // Check if patient is not found
            res.status(404).json({ error: 'Patient not found' });
        } else {
            res.json(patient);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Edit route to update patient details including images
app.put('/edit/patient/:id', async (req, res) => {
    const id = req.params.id;
    const newData = req.body;

    try {
        // Handle image uploads if new images are provided
        if (req.files && req.files.imagei && req.files.imageo) {
            const imagei = req.files.imagei[0];
            const imageo = req.files.imageo[0];

            // Define upload directories
            const uploadDir = path.join(__dirname, 'uploads');
            const imageiPath = path.join(uploadDir, imagei.originalname);
            const imageoPath = path.join(uploadDir, imageo.originalname);

            // Move uploaded images to the uploads directory
            fs.writeFileSync(imageiPath, imagei.buffer);
            fs.writeFileSync(imageoPath, imageo.buffer);

            // Update image paths in the newData object
            newData.imagei = imageiPath;
            newData.imageo = imageoPath;
        }

        // Update the patient details in the database
        const updatedPatient = await Patient.findByIdAndUpdate(id, newData, { new: true });

        if (!updatedPatient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json(updatedPatient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Delete route to remove patient from the database
app.delete('/delete/patient/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const deletedPatient = await Patient.findByIdAndDelete(id);

        if (!deletedPatient) {
            return res.status(404).json({ error: 'Patient not found' });
        }

        res.json({ message: 'Patient deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Add route to insert a new patient into the database
app.post('/add/patient', async (req, res) => {
    const newData = req.body;

    try {
        const newPatient = await Patient.create(newData);

        res.json(newPatient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
