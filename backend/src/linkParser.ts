import * as cheerio from 'cheerio';
import { URL } from 'url';

export interface LinkDetails {
    internalLinks: string[];
    externalLinks: string[];
}

export function extractAndCategorizeLinks(htmlContent: string, url_to_analyze: string): LinkDetails {
    //Using cheerrio to parse html content
    const htmlParser = cheerio.load(htmlContent);

    //Empty arrays for internal and external links found
    const internalLinks: string[] = [];
    const externalLinks: string[] = [];

    const baseURL = new URL(url_to_analyze).origin; // Base URL
    const baseHostname = new URL(url_to_analyze).hostname; // Base Hostname

    //Find links with 'href' tag
    htmlParser('a').each((index, element) => {
        const href = htmlParser(element).attr('href');
        if (href) {
            try {
                const absoluteUrl = new URL(href, url_to_analyze).href;  //getting absolute URL relative to the fetched page's URL

                if (!absoluteUrl.startsWith('http:') && !absoluteUrl.startsWith('https:')) { //filter out non http links
                    return;
                }

                //filter out fragment identifiers
                if (href.startsWith('#') && absoluteUrl.startsWith(baseURL + '#')) {
                    return; 
                }

                const linkHostname = new URL(absoluteUrl).hostname; //Hostname for current link being processed

                if (linkHostname === baseHostname) {//If internal link
                    if (!internalLinks.includes(absoluteUrl)) { //ensure no duplicates
                        internalLinks.push(absoluteUrl); //push to internal links array
                    }
                } else { //external link
                    if (!externalLinks.includes(absoluteUrl)) {
                        externalLinks.push(absoluteUrl); //push to external links array
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

    return { internalLinks, externalLinks };
}