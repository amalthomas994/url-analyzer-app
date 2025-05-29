import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
app.use(cors()); //Enable CORS
app.use(express.json()); //Parse incoming requests as JSON payloads

const PORT = process.env.PORT || 3000; //Server Listen port. Check env variable for PORT else default to 3000

//Root Path
app.get('/', (req: Request, res: Response)=> {
    console.log("Root Path Called");
    res.status(200).json({message: "Server Active!"});
});

//
app.get('/analyze_url', (req: Request, res: Response) => {
    const url_to_analyze = req.query.url as string | undefined;

    if(!url_to_analyze){
        res.status(400).json({ error: "URL Query parameter required!"});
    }

    console.log(`Analyze URL: ${url_to_analyze}`);

    res.status(200).json({
        message: 'URL Analysis Request Received',
        requestedUrl: url_to_analyze
    });
});