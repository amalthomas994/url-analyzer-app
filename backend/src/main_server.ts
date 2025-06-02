import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import path from 'path' //Using for working with URL paths and getting extensions
import { log } from 'console';
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
    let  url_to_analyze = req.query.url as string | undefined;

    if(!url_to_analyze || url_to_analyze.trim() === ''){
        console.log("URL Query Parameter not passed!")
        res.status(400).json({ error: "URL Query parameter required!"});
        return;
    }

    if (!url_to_analyze.startsWith('http://') && !url_to_analyze.startsWith('https://')) {
        url_to_analyze = 'https://' + url_to_analyze;
        console.log(`Scheme missing, added https://. New URL: ${url_to_analyze}`);
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

        const internalLinks: string[] = []; //array for internal links
        const externalLinks: string[] = []; //array for external links
        const baseURL = new URL(url_to_analyze).origin; // Base URL
        const hostname = new URL(url_to_analyze).hostname; // Base Hostname

        links.forEach((href) => {
            if(href){
                try {
                    const absoluteURL = new URL(href, url_to_analyze).href; //getting absolute URL relative to the fetched page's URL
                    if (!absoluteURL.startsWith('http:') && !absoluteURL.startsWith('https:')){ //filter out non http links
                        return;
                    }
                    if (absoluteURL.startsWith(baseURL + '#')){ //filter out fragment identifiers
                        if (href.startsWith('#')){ //skip if original href was a fragment
                            return;
                        }
                    }

                    const currentLinkHostname = new URL(absoluteURL).hostname; //Hostname for current link being processed
                    console.log(`currentLinkHostname: ${currentLinkHostname}`)

                    if (currentLinkHostname === hostname){ //If internal link
                        if(!internalLinks.includes(absoluteURL)){ //ensure no duplicates
                            internalLinks.push(absoluteURL); //push to internal links array
                        }
                    }else{//external link
                        if(!externalLinks.includes(absoluteURL)){
                            externalLinks.push(absoluteURL); //push to external links array
                        }
                    }
                

                } catch (error) {
                    if (error instanceof Error) {
                        console.warn(`Could not parse or resolve URL: ${href} (base: ${url_to_analyze})`, error.message);
                    } else {
                        console.warn(`An unexpected error occurred while processing URL: ${href} (base: ${url_to_analyze})`, error);
                    }
                }
            }
        });
        console.log(`Interal Links: ${internalLinks}`);
        console.log(`Exteral Links: ${externalLinks}`);

        const imageDetails: {[key: string]: {count: number}} = {};

        images.forEach((src) => {
            if (src){
                try {
                    
                    const absoluteImageURL = new URL(src, url_to_analyze).href; //getting absolute image URL relative to the fetched page's URL
                    console.log(`absoluteImageURL: ${absoluteImageURL}`)

                    if (!absoluteImageURL.startsWith('http:') && !absoluteImageURL.startsWith('https:')){ //filter out non http links
                        return;
                    }

                    const pathname = new URL(absoluteImageURL).pathname; //Path for current link being processed
                    console.log(`PATHNAME: ${pathname}`)
                    const extension = path.extname(pathname).toLowerCase(); //getting extension
                    console.log(`extension: ${extension}`)
                    
                    if (extension){
                        if (imageDetails[extension]){ //if extension count exists then add to counter
                            imageDetails[extension].count++;
                        }else{ //otherwise initialize count
                            imageDetails[extension] = { count: 1};
                        }
                    }else{
                        const unknownExt = ".unknown"; //if there is an image without a clear extension
                        if (imageDetails[unknownExt]){
                            imageDetails[unknownExt].count++;
                        }else{
                            imageDetails[unknownExt] = {count: 1};
                        }
                    }

                } catch (error) {
                    if (error instanceof Error) {
                        console.warn(`Could not parse or resolve Image URL: ${src} (base: ${url_to_analyze})`, error.message);
                    } else {
                        console.warn(`An unexpected error occurred while processing Image URL: ${src} (base: ${url_to_analyze})`, error);
                    }
                }
            }
        })

        //Return snippet of HTML
        const html_snippet = typeof response.data === 'string' ? response.data.substring(0, 500) : "Could not retrive HTML as string";
        console.log(`Successfully reterived URL: ${url_to_analyze}. Status: [${response.status}]`)

        res.status(200).json({
            message: `URL retrived successfully!`,
            requestedURL: url_to_analyze,
            html_snippet: html_snippet + '...',
            images: images,
            imageDetails: imageDetails,
            internalLinksinks: internalLinks,
            externalLinks: externalLinks
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