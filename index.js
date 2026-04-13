const express = require('express');
const axios = require('axios');
const cors = require('cors')
const dotenv = require('dotenv')
dotenv.config()

const app = express();
app.use(express.json());
app.use(cors());


const PORT = process.env.PORT || 3000;


app.get('/api/classify', async (req, res) => {
    try {
        let { name } = req.query;
        name = name.trim();

        //MISSING NAME PARAMETER EDGE CASE
        if(!name || name === '') return res.status(400).json({
            status: 'error',
            message: 'Missing or empty name parameter'
        });

        //PROVIDED PARAMETER NOT A STRING EDGE CASE
        if(!isNaN(name) && !isNaN(parseFloat(name))) return res.status(422).json({
            status: 'error',
            message: 'name is not a string'
        })

        //CALLING THE GENDERIZE API USING A NAME PARAMETER
        const response = await axios.get(`https://api.genderize.io?name=${name}`, {
            timeout: 20000
        });

        //PROCESSING RAW RESPONSE
        let gender = response.data.gender;
        let probability = response.data.probability;
        let count = response.data.count;

        //NULL GENDER OR COUNT = 0 EDGE CASE
        if(!gender || count === 0) return res.status(422).json({
            status: 'error',
            message: 'No prediction available for the provided name'
        });

        //RENAMING COUNT TO SAMPLE SIZE
        let sample_size = count;

        let is_confident = ( probability >= 0.7 ) && (sample_size >=100 );

        let processed_at = new Date().toISOString();

        
        res.json({
            status: 'success',
            data :{
                name,
                gender,
                probability,
                sample_size,
                is_confident,
                processed_at
                
            }
        });
    } catch (error) {

        //FOR POSSIBLE INTERRUPTIONS

        if (error.code === "ECONNABORTED") {
            return res.status(504).json({
                status: 'error',
                message: "Request timed out" })
        }
        if (error.code === "ENOTFOUND") {
            return res.status(503).json({
                status: 'error',
                message: "Service unavailable" })
        }
        if (error.code === "ECONNREFUSED") {
            return res.status(503).json({
                status: 'error',
                message: 'Could not reach server' })
        }
        // FOR SERVER ERROR
        res.status(500).json({
            status: 'error',
            message: "Error in server" })
}
});

app.listen(PORT, () => {
    console.log(`Server booming on ${PORT}`);
});