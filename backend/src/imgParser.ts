import * as cheerio from 'cheerio';
import { URL } from 'url';
import path from 'path';


export interface ImageDetail {
    count: number;
    totalSize: number;
    sources: string[];   // URLs of images of this type
}

export interface ExtensionAnalysis {
    [extension: string]: ImageDetail;
}

// Function to extract URLs from srcset attribute
function parseSrcset(srcset: string): string[] {
    if (!srcset){
        return []
    };
    const srcsets: string[] = srcset.split(',')
        .map(part => part.trim().split(/\s+/)[0]) // Get the URL part
        .filter(url => url); // Filter out any empty strings

    return srcsets;
}

//Find Images in <img> tags
function findImgTagSources(htmlParser: cheerio.Root, baseUrl: string): string[] {
    const sources: string[] = [];

    //Inside <img> tag
    htmlParser('img').each((index, element) => {
        const img = htmlParser(element);
        const src = img.attr('src'); //pull images from src attribute
        const srcset = img.attr('srcset'); //pull images from srcset (for responsive images) attributes 

        if (src) {
            sources.push(src)
        };
        if (srcset) {
            sources.push(...parseSrcset(srcset))
        };
    });

    // data-src / data-srcset 
    htmlParser('img[data-src]').each((index, element) => {
        sources.push(htmlParser(element).attr('data-src')!)
    });
    htmlParser('img[data-srcset]').each((index, element) => {
        sources.push(...parseSrcset(htmlParser(element).attr('data-srcset')!))
    });
    
    return sources;
}

//Find images in the <picture> element
function findPictureTagSources(htmlParser: cheerio.Root, baseUrl: string): string[] {
    const sources: string[] = [];
    htmlParser('picture source').each((index, element) => {
        const srcset = htmlParser(element).attr('srcset');
        if (srcset) {
            sources.push(...parseSrcset(srcset))
        };
    });
    return sources;
}

//Find background images
function findStyleBackgroundImageSources(htmlParser: cheerio.Root, baseUrl: string): string[] {
    const sources: string[] = [];
    const urlRegex = /url\(['"]?(.*?)['"]?\)/g; // Regex to find url(...)

    // Find Background images directly in HTML tag
    htmlParser('[style]').each((index, element) => {
        const styleAttribute = htmlParser(element).attr('style'); //get string value of style attribute
        if (styleAttribute && styleAttribute.includes('background-image')) {
            let match;
            //This loop repeatedly tries to find the `url(...)` pattern in the styleAttribute string
            while ((match = urlRegex.exec(styleAttribute)) !== null) {
                sources.push(match[1]);
            //If a match is found, `match` becomes an array:
            //match[0] is the entire matched string (ex: url('image.png')).
            //match[1] is the content of the first capturing group (.*?) (ex: 'image.png')
            }
        }
    });

    // Find background images within <style> tags
    htmlParser('style').each((index, element) => {
        const styleContent = htmlParser(element).html();
        if (styleContent) {
            let match;
            // Reset regex lastIndex before using it again
            urlRegex.lastIndex = 0; 
            //This loop repeatedly tries to find the `url(...)` pattern in the styleContent string
            while ((match = urlRegex.exec(styleContent)) !== null) {
                sources.push(match[1]);
            }
        }
    });
    return sources;
}

//Get svg images
function findSvgImageSources(htmlParser: cheerio.Root, baseUrl: string): string[] {
    const sources: string[] = [];
    htmlParser('svg image').each((index, element) => { 
        const href = htmlParser(element).attr('href') || htmlParser(element).attr('xlink:href');
        if (href){
            sources.push(href);
        }
    });
    return sources;
}

//Get Favicons and Touch Icons inside <link> tag
function findLinkAndMetaTagImageSources(htmlParser: cheerio.Root, baseUrl: string): string[] {
    const sources: string[] = [];
    
    // Favicons
    htmlParser('link[rel*="icon"]').each((index, element) => {
        const href = htmlParser(element).attr('href');
        if (href) {
            sources.push(href);
        }
    });
    // Open Graph images
    htmlParser('meta[property="og:image"]').each((index, element) => {
        const content = htmlParser(element).attr('content');
        if (content) {
            sources.push(content);
        }
    });
    // Twitter card images
    htmlParser('meta[name="twitter:image"]').each((index, element) => {
        const content = htmlParser(element).attr('content');
        if (content) {
            sources.push(content);
        }
    });
    return sources;
}


export async function analyzeImages(htmlContent: string, url_to_analyze: string): Promise<ExtensionAnalysis>{
    const htmlParser = cheerio.load(htmlContent);
    const potentialImageURLs: string[] = [];
    potentialImageURLs.push(...findImgTagSources(htmlParser, url_to_analyze));
    potentialImageURLs.push(...findPictureTagSources(htmlParser, url_to_analyze));
    potentialImageURLs.push(...findStyleBackgroundImageSources(htmlParser, url_to_analyze));
    potentialImageURLs.push(...findSvgImageSources(htmlParser, url_to_analyze));
    potentialImageURLs.push(...findLinkAndMetaTagImageSources(htmlParser, url_to_analyze));

    const uniqueImageUrls = [...new Set(potentialImageURLs)]; //Remove Duplicate URLS
    const imageDetailsResult: ExtensionAnalysis = {}; //Object to store found images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.avif', '.tiff']; //list of known image extensions

    //iterate through all unique image urls
    for (const src of uniqueImageUrls) {
        if (src) {
            try {
                let absoluteImgUrl: string; //to hold full absolute URL of the image
                let isDataUrl = false; //track if "src" is a data URL
                let mimeTypeFromDataUrl: string | null = null; //to store MIME type if data url

                //if data URL - embed image data directly in URL string
                if (src.startsWith('data:image/')) {
                    isDataUrl = true;
                    absoluteImgUrl = src; //src is the absolute URL
                    const mimeMatch = src.match(/^data:(image\/[^;]+);/);
                    // This regex looks for:
                    //   ^data:        - "data:" at the beginning.
                    //   (image\/[^;]+) - capturing group for "image/" followed by any characters
                    //                    that are not a semicolon, one or more times. This is our MIME type.
                    if (mimeMatch && mimeMatch[1]) {
                        mimeTypeFromDataUrl = mimeMatch[1]; //if regex match store MIME type
                    }
                } else { //Non-Data URLs
                    absoluteImgUrl = new URL(src, url_to_analyze).href; //Resolve absolute URL
                    if (!absoluteImgUrl.startsWith('http:') && !absoluteImgUrl.startsWith('https:')) {
                        continue; //filter out urls that are not HTTP or HTTPs
                    }
                }

                //to get file extension
                let extension = '';
                //if data url and MIME type received 
                if (isDataUrl && mimeTypeFromDataUrl) {
                    //convery MIME type to extension format
                    extension = '.' + mimeTypeFromDataUrl.split('/')[1];
                } else if (!isDataUrl) {
                    //if regular URL
                    const parsedUrl = new URL(absoluteImgUrl);
                    extension = path.extname(parsedUrl.pathname).toLowerCase(); //get extension from path name

                    //if extension from pathname isn't a known image extension try finding an extension in the query paremeter of the URL
                    if (!imageExtensions.includes(extension)) {
                        for (const value of parsedUrl.searchParams.values()) {
                            const queryParamExtension = path.extname(value).toLowerCase(); //get extension from value of query parameter
                            if (imageExtensions.includes(queryParamExtension)) {
                                extension = queryParamExtension;
                                break;
                            }
                        }
                    }
                }
                
                //if valid extension found
                if (extension && imageExtensions.includes(extension)) {
                    //initialize extension enry in imageDetailsResult object
                    if (!imageDetailsResult[extension]) {
                        imageDetailsResult[extension] = { count: 0, totalSize: 0, sources: [] };
                    }
                    imageDetailsResult[extension].count++; //increment count of extension
                    imageDetailsResult[extension].sources.push(absoluteImgUrl); //store absolute url
                } else if (src) { 
                    //if extension could not be determined group as .unknown
                    const unknownExt = ".unknown";
                    if (!imageDetailsResult[unknownExt]) {
                        imageDetailsResult[unknownExt] = { count: 0, totalSize: 0, sources: [] };
                    }
                    imageDetailsResult[unknownExt].count++;
                    imageDetailsResult[unknownExt].sources.push(src);
                }

            } catch (error) {
                if (error instanceof Error) {
                    console.warn(`Could not parse or resolve URL: ${src} (base: ${url_to_analyze})`, error.message);
                } else {
                    console.warn(`An unexpected error occurred while processing URL: ${src} (base: ${url_to_analyze})`, error);
                }
            }
        }
    }

    return imageDetailsResult;
}