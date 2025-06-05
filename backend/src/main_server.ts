import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
// import path from 'path' //Using for working with URL paths and getting extensions
// import { log } from 'console';
import { extractAndCategorizeLinks } from './linkParser';
import { analyzeImages, getHttpImageSizes, ExtensionAnalysis } from './imgParser';
import * as https from 'https';

console.log("Starting Server")
//Initialize Express app
const app = express();
app.use(cors()); //Enable CORS
app.use(express.json()); //Parse incoming requests as JSON payloads

const PORT = process.env.PORT || 3000; //Server Listen port. Check env variable for PORT else default to 3000

//Root Path
app.get('/', (req: Request, res: Response) => {
    console.log("Root Path Called");
    res.status(200).json({ message: "Backed Server is Active!" });

});


// Since the challenge asked for a production ready solution, I disabled direct bypassing of SSL certificate validation
// ('rejectUnauthorized: false') as it is a security risk and is disabled by default.
// This may cause failures when analyzing URLs with self-signed or untrusted certificates.
// A more robust solution for handling specific untrusted certificates, or a UI toggle
// for development purposes, was considered but omitted for timely completion
// and to prioritize security in the submitted code.
// const agent = new https.Agent({
//   rejectUnauthorized: false,
// });


//Analyze Url Path. URL will be supplied via URL query string parameter
app.get('/analyze_url', async (req: Request, res: Response) => {
    let url_to_analyze = req.query.url as string | undefined;

    if (!url_to_analyze || url_to_analyze.trim() === '') {
        console.log("URL Query Parameter not passed!")
        res.status(400).json({ error: "URL Query parameter required!" });
        return;
    }
    //add default scheme (https) if user does not provide it
    if (!url_to_analyze.startsWith('http://') && !url_to_analyze.startsWith('https://')) {
        url_to_analyze = 'https://' + url_to_analyze;
        console.log(`Scheme missing, added https://. New URL: ${url_to_analyze}`);
    }

    console.log(`Attempting to fetch URL: ${url_to_analyze}`);

    try {
        //Using axios to retrive HTML content of supplied URL to analyze
        const response = await axios.get(url_to_analyze, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36' },
            timeout: 10000,
            // httpsAgent: agent
        });

        const htmlContent = response.data;

        //Extract and Categorize Links from parser function
        const { internalLinks, externalLinks } = extractAndCategorizeLinks(htmlContent, url_to_analyze);
        console.log(`Internal Links Found: ${internalLinks.length}`);
        console.log(`External Links Found: ${externalLinks.length}`);

        //Perform image analysis and get counts, source urls and Data URL sizes
        const imageDetails: ExtensionAnalysis = analyzeImages(htmlContent, url_to_analyze);
        console.log(`Found images for ${Object.keys(imageDetails).length} image types.`)

        //get sizes of http and https images and update imageDetails
        await getHttpImageSizes(imageDetails);
        console.log(`Found images for ${Object.keys(imageDetails).length} image types.`)

        //Return snippet of HTML
        const html_snippet = typeof response.data === 'string' ? response.data.substring(0, 500) : "Could not retrive HTML as string";
        console.log(`Successfully reterived URL: ${url_to_analyze}. Status: [${response.status}]`)

        res.status(200).json({
            message: `URL retrived successfully!`,
            requestedURL: url_to_analyze,
            html_snippet: html_snippet + '...',
            imageDetails: imageDetails,
            internalLinks: internalLinks,
            externalLinks: externalLinks
        })
    } catch (error: any) {
        console.error(`Error retrieving URL ${url_to_analyze}:`, error.message)

        if (axios.isAxiosError(error)) { //Check if error is an Axios error
            if (error.response) { //If server responded with a status code
                res.status(error.response.status).json({
                    message: `Server responded with the status ${error.response.status}`,
                    requestedURL: url_to_analyze,
                    error: "Failed to retrieve URL!"
                })
            } else if (error.request) { //No response from server
                res.status(500).json({
                    message: `No response from server: ${error.message}. Ensure URL is correct!`,
                    requestedURL: url_to_analyze,
                    error: "Failed to retrieve URL!"
                })
            } else {
                res.status(500).json({
                    message: `ERROR: ${error.message}`,
                    requestedURL: url_to_analyze,
                    error: "Failed to retrieve URL!"
                })
            }
        } else { //Non axios errors
            res.status(500).json({
                message: error.message,
                requestedURL: url_to_analyze,
                error: "Unexpected Error!"
            })
        }
        return;
    }
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong on the server!' });
});

app.listen(PORT, () => {
    console.log(`Backend server is listening on http://localhost:${PORT}`);
});