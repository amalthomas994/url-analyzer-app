import * as cheerio from 'cheerio';
import { URL } from 'url';
import path from 'path';
import { KNOWN_IMAGE_EXTENSIONS } from './config'; //list of known image extensions
import axios from 'axios';
import { Buffer } from 'buffer';

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
    if (!srcset) {
        return []
    };
    const srcsets: string[] = srcset.split(',')
        .map(part => part.trim().split(/\s+/)[0]) // Get the URL part
        .filter(url => url); // Filter out any empty strings

    return srcsets;
}

//Find Images in <img> tags
function findImgTagSources(htmlParser: cheerio.Root): string[] {
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
function findPictureTagSources(htmlParser: cheerio.Root): string[] {
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
function findStyleBackgroundImageSources(htmlParser: cheerio.Root): string[] {
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
function findSvgImageSources(htmlParser: cheerio.Root): string[] {
    const sources: string[] = [];
    htmlParser('svg image').each((index, element) => {
        const href = htmlParser(element).attr('href') || htmlParser(element).attr('xlink:href');
        if (href) {
            sources.push(href);
        }
    });
    return sources;
}

//Get Favicons and Touch Icons inside <link> tag
function findLinkAndMetaTagImageSources(htmlParser: cheerio.Root): string[] {
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

//interface for DataURL types
interface DataURLInfo {
    extension: string;
    size: number;
    mimeType: string;
}

// get extension and size of Data URL images
function parseDataURL(dataURL: string): DataURLInfo | null {
    let mimeType: string | null = null;
    let data: string | null = null;
    let size = 0;
    let extension = "";

    //check if data encoding is base64
    const base64Match = dataURL.match(/^data:(image\/[^;]+);base64,(.+)$/);
    //base64Match[1] will contain mime type and base64Match[2] will contain Base64 encoded image data
    if (base64Match && base64Match[1] && base64Match[2]) {
        mimeType = base64Match[1].toLowerCase();
        data = base64Match[2];
        try {
            //calculate byte size of image data encoded as base64
            size = Buffer.from(data, 'base64').length;
        } catch (e) {
            size = 0;
        }
    } else {
        //check if data encoding is some other type of encoding
        const unknownBaseType = dataURL.match(/^data:(image\/[^;]+)(?:;[^,]*)?,(.+)$/);
        if (unknownBaseType && unknownBaseType[1] && unknownBaseType[2]) {
            mimeType = unknownBaseType[1].toLowerCase();
            data = unknownBaseType[2];
            let processedData = data;
            if (mimeType === 'image/svg+xml') {
                try { 
                    //decode URL-encoded url
                    processedData = decodeURIComponent(data); 
                } catch (e) {

                 }
            }
            try { 
                size = Buffer.from(processedData, 'utf8').length; 
            } catch (e) { 
                size = 0; 
            }
        }
    }

    //get image extension 
    if (mimeType) {
        let subtype = mimeType.split('/')[1];
        if (subtype.includes('+')) {
            subtype = subtype.substring(0, subtype.indexOf('+'));
        }
        const potentialExtension = '.' + subtype;
        if (KNOWN_IMAGE_EXTENSIONS.includes(potentialExtension)) {
            extension = potentialExtension;
        } else {
            extension = ".unknown";
        }
        return { extension, size, mimeType };
    }
    return null;
}

//get extension from HTTP Urls (non data urls)
function getExtensionFromHttpURL(imageURL: string): string {
    try {
        const url = new URL(imageURL);
        //get extension from path name
        const pathNameExtension = path.extname(url.pathname).toLowerCase();
        if (KNOWN_IMAGE_EXTENSIONS.includes(pathNameExtension)) {
            return pathNameExtension;
        } else {//if extension from pathname isn't a known image extension try finding an extension in the query paremeter of the URL
            for (const value of url.searchParams.values()) {
                const queryParamExtension = path.extname(value).toLowerCase(); //get extension from value of query parameter
                if (KNOWN_IMAGE_EXTENSIONS.includes(queryParamExtension)) {
                    return queryParamExtension;
                }
            }
        }
    } catch (error) {
        console.warn(`Could not parse HTTP URL for extension: ${imageURL}`);
    }
    return "";
}


export function analyzeImages(htmlContent: string, url_to_analyze: string): ExtensionAnalysis {
    const htmlParser = cheerio.load(htmlContent);
    const potentialImageURLs: string[] = [];

    //get image urls with the help of the following helper functions
    potentialImageURLs.push(...findImgTagSources(htmlParser));
    potentialImageURLs.push(...findPictureTagSources(htmlParser));
    potentialImageURLs.push(...findStyleBackgroundImageSources(htmlParser));
    potentialImageURLs.push(...findSvgImageSources(htmlParser));
    potentialImageURLs.push(...findLinkAndMetaTagImageSources(htmlParser));

    const uniqueImageUrls = [...new Set(potentialImageURLs.filter(url => url))]; //Remove Duplicate URLs and filter out empty or undefined values
    const imageDetailsResult: ExtensionAnalysis = {}; //Object to store found images

    //iterate through all unique image urls
    for (const src of uniqueImageUrls) {
        try {

            let resolvedUrl: string; //to hold full absolute URL of the image
            let extension: string = "";
            let size: number = 0;


            //if data URL - embed image data directly in URL string
            if (src.startsWith('data:image/')) {
                resolvedUrl = src; //src is the absolute URL
                const dataURLInfo = parseDataURL(src);
                if (dataURLInfo) {
                    extension = dataURLInfo.extension;
                    size = dataURLInfo.size;
                } else {
                    extension = '.unknown'
                }
            } else { //If http or https url
                try {
                    resolvedUrl = new URL(src, url_to_analyze).href;
                    if (!resolvedUrl.startsWith('http:') && !resolvedUrl.startsWith('https:')) {
                        extension = ".unknown";
                    } else {
                        //find image extension
                        extension = getExtensionFromHttpURL(resolvedUrl);
                    }
                } catch (error) {
                    resolvedUrl = src;
                    extension = ".errorProcessingUrl";
                }
            }


            const finalExtension = extension || ".unknown";

            //if entry for extension does not exist, initialize it
            if (!imageDetailsResult[finalExtension]) {
                imageDetailsResult[finalExtension] = { count: 0, totalSize: 0, sources: [] };
            }
            //increase count for extension
            imageDetailsResult[finalExtension].count++;
            imageDetailsResult[finalExtension].totalSize += size; // Add up size of found images

            //add url to sources key
            if (!imageDetailsResult[finalExtension].sources.includes(resolvedUrl)) {
                imageDetailsResult[finalExtension].sources.push(resolvedUrl);
            }

        } catch (error) { 
            const errorKey = ".unknown";
            if (!imageDetailsResult[errorKey]) {
                imageDetailsResult[errorKey] = { count: 0, totalSize: 0, sources: [] };
            }
            imageDetailsResult[errorKey].count++;
            imageDetailsResult[errorKey].sources.push(src);
        }
    }

    return imageDetailsResult;
}

//function to get byte sizes for http and https image urls
export async function getHttpImageSizes(imageDetails: ExtensionAnalysis): Promise<void> {
    const getSizePromises: Promise<void>[] = [];

    for (const [ext, details] of Object.entries(imageDetails)) {
        // fetch sizes for known extensions that are not data-url specific error categories
        if (ext.startsWith('.') && KNOWN_IMAGE_EXTENSIONS.includes(ext)) {
            //iterate through sources list for each extension
            for (let i = 0; i < details.sources.length; i++) {
                const imageUrl = details.sources[i]; 
                // HEAD request if HTTP or HTTPS URL
                if (imageUrl.startsWith('http:') || imageUrl.startsWith('https:')) {
                    getSizePromises.push(
                        (async () => {
                            try {

                                //get metadata of image url
                                const headResponse = await axios.head(imageUrl, {
                                    timeout: 10000,
                                    headers: {
                                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
                                    }
                                });

                                //get content length
                                const contentLength = headResponse.headers['content-length'];
                                if (contentLength) {
                                    const imageByteSize = parseInt(contentLength, 10);
                                    //if imageByteSize is a valid number
                                    if (!isNaN(imageByteSize)) {
                                        details.totalSize += imageByteSize;
                                    }
                                }
                            } catch (error: any) {
                                console.warn(`Failed to get HEAD for ${imageUrl}: ${error.message}`);
                            }
                        })()
                    );
                }
            }
        }
    }

    try {
        await Promise.all(getSizePromises);
    } catch (error) {
        console.error("Error while fetching image sizes:", error);
    }
}
