import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

console.log("Starting Server")
const app = express();
app.use(cors()); //Enable CORS
app.use(express.json()); //Parse incoming requests as JSON payloads

const PORT = process.env.PORT || 3000; //Server Listen port. Check env variable for PORT else default to 3000

//Root Path
app.get('/', (req: Request, res: Response)=> {
    console.log("Root Path Called");
    res.status(200).json({message: "Backed Server is Active!"});

});

//Analyze Url Path. URL will be supplied via URL query string parameter
app.get('/analyze_url', async (req: Request, res: Response) => {
    const url_to_analyze = req.query.url as string | undefined;

    if(!url_to_analyze){
        console.log("URL Query Parameter not passed!")
        res.status(400).json({ error: "URL Query parameter required!"});
        return;
    }

    console.log(`Attempting to fetch URL: ${url_to_analyze}`);

    try {
        //Using axios to retrive HTML content of supplied URL to analyze
        const response = await axios.get(url_to_analyze, {
            headers: {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'},
            timeout: 10000
        });

        //Using cheerrio to parse html content
        const htmlParser = cheerio.load(response.data);
        
        //Empty array for images found
        const images: (string | undefined)[] = [];
        
        //Find images with 'img' tag
        htmlParser('img').each((index, element) => {
            const src = htmlParser(element).attr('src');
            images.push(src);
        });

        console.log(`Images Found: ${images}`);

        //Empty array for links found
        const links: (string | undefined)[] = [];
        
        //Find links with 'href' tag
        htmlParser('a').each((index, element) => {
            const href = htmlParser(element).attr('href');
            links.push(href);
        });

        console.log(`Links Found: ${links}`);



        //Return snippet of HTML
        const html_snippet = typeof response.data === 'string' ? response.data.substring(0, 500) : "Could not retrive HTML as string";
        console.log(`Successfully reterived URL: ${url_to_analyze}. Status: [${response.status}]`)

        res.status(200).json({
            message: `URL retrived successfully!`,
            requestedURL: url_to_analyze,
            html_snippet: html_snippet + '...',
            images: images,
            links: links
        })
    } catch (error: any) {
        console.error(`Error retrieving URL ${url_to_analyze}:`, error.message)

        if (axios.isAxiosError(error)){ //Check if error is an Axios error
            if (error.response){ //If server responded with a status code
                res.status(error.response.status).json({
                    message: `Server responded with the status ${error.response.status}`,
                    requestedURL: url_to_analyze,
                    error: "Failed to retrieve URL!"
                })
            } else if (error.request){ //No response from server
            res.status(500).json({
                message: `No response from server: ${error.message}`,
                requestedURL: url_to_analyze,
                error: "Failed to retrieve URL!"
            })} else {
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